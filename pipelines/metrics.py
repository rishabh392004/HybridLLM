import numpy as np
import pandas as pd

def compute_spatial_rmse(pred, truth):
    return float(np.sqrt(np.mean((pred - truth) ** 2)))

def compute_spatial_mae(pred, truth):
    return float(np.mean(np.abs(pred - truth)))

def compute_extreme_contingency(pred, truth, threshold):
    pred_event = (pred >= threshold)
    truth_event = (truth >= threshold)

    hits = int(np.sum(pred_event & truth_event))
    false_alarms = int(np.sum(pred_event & ~truth_event))
    misses = int(np.sum(~pred_event & truth_event))
    correct_negatives = int(np.sum(~pred_event & ~truth_event))

    return hits, false_alarms, misses, correct_negatives

def compute_csi_threat_score(hits, false_alarms, misses):
    denom = hits + false_alarms + misses
    return float(hits / denom) if denom > 0 else 0.0

def compute_pod(hits, misses):
    denom = hits + misses
    return float(hits / denom) if denom > 0 else 0.0

def compute_far(hits, false_alarms):
    denom = hits + false_alarms
    return float(false_alarms / denom) if denom > 0 else 0.0

def build_benchmark_table(truth, m1, m2, equal_blend, ai_blend, threshold):
    candidates = {
        "ECMWF IFS (Physical)": m1,
        "GraphCast / AIFS (AI)": m2,
        "Simple Ensemble (50/50)": equal_blend,
        "Hybrid Adaptive Blend (Ours)": ai_blend
    }

    records = []
    for name, forecast in candidates.items():
        rmse = compute_spatial_rmse(forecast, truth)
        mae = compute_spatial_mae(forecast, truth)
        h, fa, m, _ = compute_extreme_contingency(forecast, truth, threshold)
        csi = compute_csi_threat_score(h, fa, m)
        pod = compute_pod(h, m)
        far = compute_far(h, fa)

        records.append({
            "Forecasting Model": name,
            "RMSE (°C / mm) ↓": round(rmse, 2),
            "MAE (°C / mm) ↓": round(mae, 2),
            "CSI / Threat Score ↑": round(csi, 3),
            "POD (Hit Rate) ↑": f"{round(pod * 100, 1)}%",
            "False Alarm Ratio (FAR) ↓": f"{round(far * 100, 1)}%"
        })

    return pd.DataFrame(records)