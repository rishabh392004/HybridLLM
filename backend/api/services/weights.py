import math
from typing import Dict

def calculate_inverse_rmse_weights(rmse_values: Dict[str, float]) -> Dict[str, float]:
    """
    Given a dictionary mapping source to RMSE, compute inverse RMSE weights.
    Returns a dictionary of normalized weights sum to 1.
    """
    raw_weights = {}
    has_zero_rmse = False
    
    for src, rmse in rmse_values.items():
        if not math.isfinite(rmse) or rmse < 0:
            raise ValueError(f"Invalid RMSE for {src}: {rmse}")
        if rmse == 0:
            has_zero_rmse = True
            
    if has_zero_rmse:
        zero_sources = [s for s, r in rmse_values.items() if r == 0]
        weight_per_zero = 1.0 / len(zero_sources)
        return {s: (weight_per_zero if r == 0 else 0.0) for s, r in rmse_values.items()}
        
    sum_raw = 0.0
    for src, rmse in rmse_values.items():
        rw = 1.0 / rmse
        raw_weights[src] = rw
        sum_raw += rw
        
    if sum_raw == 0:
        n = len(rmse_values)
        return {s: 1.0/n for s in rmse_values}
        
    return {s: w / sum_raw for s, w in raw_weights.items()}

def smooth_weights(computed_weights: Dict[str, float], previous_weights: Dict[str, float]) -> Dict[str, float]:
    """
    Compute new_weight = 0.7 * previous_weight + 0.3 * computed_weight.
    Then normalize to sum to 1.
    """
    new_raw = {}
    sum_new = 0.0
    
    for src, cw in computed_weights.items():
        if src in previous_weights and previous_weights[src] is not None:
            nw = 0.7 * previous_weights[src] + 0.3 * cw
        else:
            nw = cw
        new_raw[src] = nw
        sum_new += nw
        
    if sum_new == 0:
        n = len(computed_weights)
        if n == 0:
            return {}
        return {s: 1.0/n for s in computed_weights}
        
    return {s: w / sum_new for s, w in new_raw.items()}

def generate_weight_reason(source: str, computed_weight: float, all_computed_weights: Dict[str, float]) -> str:
    """
    Generate the reason based on the computed weight vs others.
    """
    sorted_sources = sorted(all_computed_weights.items(), key=lambda x: x[1], reverse=True)
    rank = next(i for i, (s, w) in enumerate(sorted_sources) if s == source) + 1
    
    if rank == 1:
        return f"{source} received the highest weight because its RMSE was lower than all other available sources."
    elif computed_weight == 0:
        return f"{source} received zero weight because another source had a perfect prediction (RMSE=0)."
    else:
        return f"{source} received a lower weight because its RMSE was higher than higher-ranked sources."
