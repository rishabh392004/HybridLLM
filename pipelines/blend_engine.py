import json
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

from collections import deque

class RollingVerificationTracker:
    """
    Maintains a rolling window of verification skill scores (e.g., past 7 forecast cycles)
    and produces dynamic weight penalty factors.
    """
    def __init__(self, window_size=7):
        self.window_size = window_size
        self.m1_errors = deque(maxlen=window_size)
        self.m2_errors = deque(maxlen=window_size)

    def log_cycle(self, t_m1, t_m2, truth):
        """Computes spatial RMSE for current cycle and adds to rolling window."""
        rmse_m1 = float(np.sqrt(np.mean((t_m1 - truth) ** 2)))
        rmse_m2 = float(np.sqrt(np.mean((t_m2 - truth) ** 2)))
        self.m1_errors.append(rmse_m1)
        self.m2_errors.append(rmse_m2)

    def get_rolling_rmse(self):
        """Returns mean rolling RMSE over the past cycles."""
        avg_m1 = float(np.mean(self.m1_errors)) if self.m1_errors else 1.0
        avg_m2 = float(np.mean(self.m2_errors)) if self.m2_errors else 1.0
        return avg_m1, avg_m2

    def get_reliability_priors(self):
        """
        Inverse-error weighting: model with lower rolling RMSE receives higher prior score.
        Softmax-normalized into prior multipliers [p1, p2].
        """
        avg_m1, avg_m2 = self.get_rolling_rmse()
        inv1, inv2 = 1.0 / (avg_m1 + 1e-4), 1.0 / (avg_m2 + 1e-4)
        total = inv1 + inv2
        return inv1 / total, inv2 / total

class MultiTaskBlendingUNet(nn.Module):
    def __init__(self, num_models=2, num_vars=2, has_dem=True):
        super().__init__()
        in_channels = (num_models * num_vars) + (1 if has_dem else 0)
        self.num_models = num_models

        self.enc1 = nn.Sequential(
            nn.Conv2d(in_channels, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU()
        )
        self.enc2 = nn.Sequential(
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU()
        )
        self.bridge = nn.Sequential(
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU()
        )
        self.dec1 = nn.Sequential(
            nn.Conv2d(64, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU()
        )
        
        self.out_temp = nn.Conv2d(32, num_models, kernel_size=1)
        self.out_rain = nn.Conv2d(32, num_models, kernel_size=1)

    def forward(self, x_features, raw_temp, raw_rain):
        feat = self.enc1(x_features)
        feat = self.enc2(feat)
        feat = self.bridge(feat)
        feat = self.dec1(feat)

        weights_temp = F.softmax(self.out_temp(feat), dim=1)
        weights_rain = F.softmax(self.out_rain(feat), dim=1)

        blended_temp = torch.sum(weights_temp * raw_temp, dim=1, keepdim=True)
        blended_rain = torch.clamp(torch.sum(weights_rain * raw_rain, dim=1, keepdim=True), min=0.0)

        return blended_temp, blended_rain, weights_temp, weights_rain

class RealTimeBiasCorrector:
    """
    Online Recursive Bias Filter.
    Continuously nudges model forecast fields using recent verification errors.
    """
    def __init__(self, shape=(35, 35), momentum=0.25):
        self.momentum = momentum
        self.temp_bias_m1 = np.zeros(shape)
        self.temp_bias_m2 = np.zeros(shape)
        self.rain_bias_m1 = np.zeros(shape)
        self.rain_bias_m2 = np.zeros(shape)

    def update(self, t_m1, t_m2, r_m1, r_m2, obs_t, obs_r):
        """Update running systematic bias map with current observation."""
        self.temp_bias_m1 = (1 - self.momentum) * self.temp_bias_m1 + self.momentum * (t_m1 - obs_t)
        self.temp_bias_m2 = (1 - self.momentum) * self.temp_bias_m2 + self.momentum * (t_m2 - obs_t)
        self.rain_bias_m1 = (1 - self.momentum) * self.rain_bias_m1 + self.momentum * (r_m1 - obs_r)
        self.rain_bias_m2 = (1 - self.momentum) * self.rain_bias_m2 + self.momentum * (r_m2 - obs_r)

    def correct(self, t_m1, t_m2, r_m1, r_m2):
        """Applies real-time calibrated bias subtraction."""
        t_m1_cal = t_m1 - self.temp_bias_m1
        t_m2_cal = t_m2 - self.temp_bias_m2
        r_m1_cal = np.clip(r_m1 - self.rain_bias_m1, 0, None)
        r_m2_cal = np.clip(r_m2 - self.rain_bias_m2, 0, None)
        return t_m1_cal, t_m2_cal, r_m1_cal, r_m2_cal

class ConformalPredictor:
    def __init__(self, alpha=0.10):
        self.alpha = alpha
        self.q_temp = 1.42
        self.q_rain = 5.80

    def get_bounds(self, blended_temp, blended_rain):
        temp_lower = blended_temp - self.q_temp
        temp_upper = blended_temp + self.q_temp
        rain_lower = np.clip(blended_rain - self.q_rain, 0, None)
        rain_upper = blended_rain + self.q_rain
        return (temp_lower, temp_upper, self.q_temp), (rain_lower, rain_upper, self.q_rain)

class OperationalBlender:
    def __init__(self, meta_path="models/model_metadata.json"):
        with open(meta_path, "r") as f:
            self.meta = json.load(f)

        self.t_mean = self.meta.get("t_mean", 295.37)
        self.t_std = self.meta.get("t_std", 10.73)
        self.extreme_thresh = self.meta.get("extreme_threshold", 303.76)
        
        self.model = MultiTaskBlendingUNet(num_models=2, num_vars=2, has_dem=True)
        self.model.eval()
        self.uq = ConformalPredictor(alpha=0.10)
        self.bias_corrector = RealTimeBiasCorrector(shape=(35, 35), momentum=0.35)
        
        # 1. Initialize Rolling Verification Tracker
        self.verifier = RollingVerificationTracker(window_size=7)

    def blend(self, t_m1, t_m2, r_m1, r_m2, dem_grid, obs_t=None, obs_r=None, apply_bias_correction=True):
        # 2. Update real-time bias fields and rolling verification metrics if observations exist
        if obs_t is not None and obs_r is not None:
            self.bias_corrector.update(t_m1, t_m2, r_m1, r_m2, obs_t, obs_r)
            self.verifier.log_cycle(t_m1, t_m2, obs_t)

        # Apply bias correction
        if apply_bias_correction:
            t_m1_in, t_m2_in, r_m1_in, r_m2_in = self.bias_corrector.correct(t_m1, t_m2, r_m1, r_m2)
        else:
            t_m1_in, t_m2_in, r_m1_in, r_m2_in = t_m1, t_m2, r_m1, r_m2

        t_norm1 = (t_m1_in - self.t_mean) / self.t_std
        t_norm2 = (t_m2_in - self.t_mean) / self.t_std
        r_norm1 = r_m1_in / 50.0
        r_norm2 = r_m2_in / 50.0
        dem_norm = (dem_grid - np.mean(dem_grid)) / (np.std(dem_grid) + 1e-5)

        features = np.stack([t_norm1, t_norm2, r_norm1, r_norm2, dem_norm], axis=0)[np.newaxis, ...]
        raw_t = np.stack([t_m1_in, t_m2_in], axis=0)[np.newaxis, ...]
        raw_r = np.stack([r_m1_in, r_m2_in], axis=0)[np.newaxis, ...]

        feat_tensor = torch.tensor(features, dtype=torch.float32)
        raw_t_tensor = torch.tensor(raw_t, dtype=torch.float32)
        raw_r_tensor = torch.tensor(raw_r, dtype=torch.float32)

        with torch.no_grad():
            b_temp, b_rain, w_temp, w_rain = self.model(feat_tensor, raw_t_tensor, raw_r_tensor)

        # 3. Dynamic Reliability Priors: Modulate raw U-Net weights with recent verification skill
        priors = self.verifier.get_reliability_priors() # [P_m1, P_m2]
        priors_tensor = torch.tensor(priors, dtype=torch.float32).view(1, 2, 1, 1)
        
        # Bayesian prior-weighted normalization
        w_temp_adjusted = (w_temp * priors_tensor) / (torch.sum(w_temp * priors_tensor, dim=1, keepdim=True) + 1e-6)
        
        # Re-blend temperature with verified weights
        b_temp_calibrated = torch.sum(w_temp_adjusted * raw_t_tensor, dim=1, keepdim=True)

        blended_celsius = b_temp_calibrated.squeeze().numpy() - 273.15
        blended_rain_mm = b_rain.squeeze().numpy()
        w_t = w_temp_adjusted.squeeze().numpy()
        w_r = w_rain.squeeze().numpy()

        extreme_heat_mask = b_temp_calibrated.squeeze().numpy() >= self.extreme_thresh
        heavy_rain_mask = blended_rain_mm >= 35.0

        temp_bounds, rain_bounds = self.uq.get_bounds(blended_celsius, blended_rain_mm)
        rolling_rmse = self.verifier.get_rolling_rmse()

        return (
            blended_celsius,
            blended_rain_mm,
            w_t,
            w_r,
            extreme_heat_mask,
            heavy_rain_mask,
            temp_bounds,
            rain_bounds,
            (self.bias_corrector.temp_bias_m1, self.bias_corrector.temp_bias_m2),
            rolling_rmse
        )

    def compute_saliency(self, t_m1, t_m2, r_m1, r_m2, dem_grid):
        t_norm1 = (t_m1 - self.t_mean) / self.t_std
        t_norm2 = (t_m2 - self.t_mean) / self.t_std
        r_norm1 = r_m1 / 50.0
        r_norm2 = r_m2 / 50.0
        dem_norm = (dem_grid - np.mean(dem_grid)) / (np.std(dem_grid) + 1e-5)

        features = np.stack([t_norm1, t_norm2, r_norm1, r_norm2, dem_norm], axis=0)[np.newaxis, ...]
        raw_t = np.stack([t_m1, t_m2], axis=0)[np.newaxis, ...]
        raw_r = np.stack([r_m1, r_m2], axis=0)[np.newaxis, ...]

        feat_tensor = torch.tensor(features, dtype=torch.float32, requires_grad=True)
        raw_t_tensor = torch.tensor(raw_t, dtype=torch.float32)
        raw_r_tensor = torch.tensor(raw_r, dtype=torch.float32)

        _, _, w_temp, _ = self.model(feat_tensor, raw_t_tensor, raw_r_tensor)
        target_score = w_temp[:, 0].sum()
        target_score.backward()

        attr = (feat_tensor.grad.data * feat_tensor.data).squeeze().abs().numpy()
        return attr[4], attr[0]