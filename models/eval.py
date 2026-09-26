import numpy as np

def evaluate_predictions(pred: np.ndarray, truth: np.ndarray, threshold: float):
    """
    Computes continuous error metrics and categorical extreme skill scores.
    """
    # Continuous metrics
    rmse = np.sqrt(np.mean((pred - truth) ** 2))
    mae = np.mean(np.abs(pred - truth))

    # Binary contingency for extreme weather events
    pred_bin = (pred >= threshold)
    truth_bin = (truth >= threshold)

    hits = int(np.sum(pred_bin & truth_bin))
    misses = int(np.sum(~pred_bin & truth_bin))
    false_alarms = int(np.sum(pred_bin & ~truth_bin))
    correct_negs = int(np.sum(~pred_bin & ~truth_bin))

    csi = hits / (hits + misses + false_alarms + 1e-6)
    pod = hits / (hits + misses + 1e-6)
    far = false_alarms / (hits + false_alarms + 1e-6)

    # Heidke Skill Score (skill relative to random chance)
    total = hits + misses + false_alarms + correct_negs
    expected_correct = (
        (hits + misses) * (hits + false_alarms) + (correct_negs + misses) * (correct_negs + false_alarms)
    ) / (total + 1e-6)
    hss = (hits + correct_negs - expected_correct) / (total - expected_correct + 1e-6)

    return {
        "RMSE": round(float(rmse), 3),
        "MAE": round(float(mae), 3),
        "CSI": round(float(csi), 3),
        "POD": round(float(pod), 3),
        "FAR": round(float(far), 3),
        "HSS": round(float(hss), 3)
    }