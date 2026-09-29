import math
from typing import List

def calculate_rmse(predictions: List[float], observations: List[float]) -> float:
    if not predictions or not observations:
        raise ValueError("Inputs cannot be empty")
    if len(predictions) != len(observations):
        raise ValueError("Mismatched lengths between predictions and observations")
        
    sum_sq_err = 0.0
    valid_count = 0
    for p, o in zip(predictions, observations):
        if math.isfinite(p) and math.isfinite(o):
            sum_sq_err += (p - o) ** 2
            valid_count += 1
            
    if valid_count == 0:
        raise ValueError("No finite values to calculate RMSE")
        
    return math.sqrt(sum_sq_err / valid_count)

def calculate_mae(predictions: List[float], observations: List[float]) -> float:
    if not predictions or not observations:
        raise ValueError("Inputs cannot be empty")
    if len(predictions) != len(observations):
        raise ValueError("Mismatched lengths between predictions and observations")
        
    sum_abs_err = 0.0
    valid_count = 0
    for p, o in zip(predictions, observations):
        if math.isfinite(p) and math.isfinite(o):
            sum_abs_err += abs(p - o)
            valid_count += 1
            
    if valid_count == 0:
        raise ValueError("No finite values to calculate MAE")
        
    return sum_abs_err / valid_count
