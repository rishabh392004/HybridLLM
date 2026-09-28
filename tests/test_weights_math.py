import pytest
import math
from api.services.weights import calculate_inverse_rmse_weights, smooth_weights

def test_inverse_rmse():
    rmses = {"A": 1.0, "B": 2.0, "C": 4.0}
    weights = calculate_inverse_rmse_weights(rmses)
    
    # raw: A=1, B=0.5, C=0.25 -> sum=1.75
    assert math.isclose(weights["A"], 1 / 1.75)
    assert math.isclose(weights["B"], 0.5 / 1.75)
    assert math.isclose(weights["C"], 0.25 / 1.75)
    assert math.isclose(sum(weights.values()), 1.0)

def test_inverse_rmse_zero():
    rmses = {"A": 0.0, "B": 2.0, "C": 4.0}
    weights = calculate_inverse_rmse_weights(rmses)
    
    assert weights["A"] == 1.0
    assert weights["B"] == 0.0
    assert weights["C"] == 0.0

def test_inverse_rmse_multiple_zeros():
    rmses = {"A": 0.0, "B": 0.0, "C": 4.0}
    weights = calculate_inverse_rmse_weights(rmses)
    
    assert weights["A"] == 0.5
    assert weights["B"] == 0.5
    assert weights["C"] == 0.0

def test_inverse_rmse_invalid():
    with pytest.raises(ValueError):
        calculate_inverse_rmse_weights({"A": -1.0, "B": 2.0})
    with pytest.raises(ValueError):
        calculate_inverse_rmse_weights({"A": math.nan, "B": 2.0})

def test_smoothing():
    computed = {"A": 0.8, "B": 0.2}
    previous = {"A": 0.5, "B": 0.5}
    
    final = smooth_weights(computed, previous)
    
    # A: 0.7*0.5 + 0.3*0.8 = 0.35 + 0.24 = 0.59
    # B: 0.7*0.5 + 0.3*0.2 = 0.35 + 0.06 = 0.41
    # sum = 1.0
    assert math.isclose(final["A"], 0.59)
    assert math.isclose(final["B"], 0.41)
    assert math.isclose(sum(final.values()), 1.0)
    
def test_smoothing_no_previous():
    computed = {"A": 0.8, "B": 0.2}
    previous = {}
    
    final = smooth_weights(computed, previous)
    
    # Should use computed directly
    assert math.isclose(final["A"], 0.8)
    assert math.isclose(final["B"], 0.2)
