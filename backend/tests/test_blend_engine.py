import pytest
import math
from api.services.blend import calculate_blend

def test_simple_weighted_blend():
    forecasts = {"A": 10.0, "B": 20.0}
    weights = {"A": 0.2, "B": 0.8}
    
    # 10*0.2 + 20*0.8 = 2 + 16 = 18.0
    val = calculate_blend(forecasts, weights)
    assert math.isclose(val, 18.0)

def test_weights_sum_to_one_validation():
    forecasts = {"A": 10.0, "B": 20.0}
    weights = {"A": 0.2, "B": 0.7} # sums to 0.9
    
    with pytest.raises(ValueError, match="Weights must sum to approximately 1.0"):
        calculate_blend(forecasts, weights)

def test_missing_weight():
    forecasts = {"A": 10.0, "B": 20.0}
    weights = {"A": 1.0}
    
    with pytest.raises(ValueError, match="Missing weight for forecast source: B"):
        calculate_blend(forecasts, weights)

def test_invalid_weight():
    forecasts = {"A": 10.0, "B": 20.0}
    weights = {"A": 0.5, "B": math.nan}
    
    with pytest.raises(ValueError, match="Invalid numeric value for B"):
        calculate_blend(forecasts, weights)

def test_invalid_forecast():
    forecasts = {"A": 10.0, "B": math.inf}
    weights = {"A": 0.5, "B": 0.5}
    
    with pytest.raises(ValueError, match="Invalid numeric value for B"):
        calculate_blend(forecasts, weights)
