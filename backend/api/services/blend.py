import math
from typing import Dict

def calculate_blend(forecasts: Dict[str, float], weights: Dict[str, float]) -> float:
    """
    Calculate the blended forecast value.
    Requires every forecast source to have a corresponding weight.
    """
    if not forecasts or not weights:
        raise ValueError("Forecasts and weights cannot be empty")
        
    for source in forecasts.keys():
        if source not in weights:
            raise ValueError(f"Missing weight for forecast source: {source}")
            
    sum_weights = 0.0
    blended_value = 0.0
    
    for source, f_val in forecasts.items():
        w_val = weights[source]
        
        if not math.isfinite(f_val) or not math.isfinite(w_val):
            raise ValueError(f"Invalid numeric value for {source}: forecast={f_val}, weight={w_val}")
            
        sum_weights += w_val
        blended_value += f_val * w_val
        
    if not math.isclose(sum_weights, 1.0, rel_tol=1e-4):
        raise ValueError(f"Weights must sum to approximately 1.0, got {sum_weights}")
        
    return blended_value
