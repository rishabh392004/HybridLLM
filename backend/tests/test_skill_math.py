import pytest
import math
from api.services.skill import calculate_rmse, calculate_mae

def test_rmse_perfect():
    preds = [1.0, 2.0, 3.0]
    obs = [1.0, 2.0, 3.0]
    assert calculate_rmse(preds, obs) == 0.0

def test_rmse_known():
    # diffs: 1, 2, 3 -> sq: 1, 4, 9 -> sum: 14 -> mean: 14/3
    preds = [1.0, 2.0, 3.0]
    obs = [0.0, 0.0, 0.0]
    assert math.isclose(calculate_rmse(preds, obs), math.sqrt(14/3))

def test_rmse_large_error():
    preds = [1000.0]
    obs = [0.0]
    assert calculate_rmse(preds, obs) == 1000.0

def test_rmse_mismatched():
    with pytest.raises(ValueError):
        calculate_rmse([1.0], [1.0, 2.0])

def test_rmse_empty():
    with pytest.raises(ValueError):
        calculate_rmse([], [])

def test_mae_perfect():
    preds = [1.0, 2.0, 3.0]
    obs = [1.0, 2.0, 3.0]
    assert calculate_mae(preds, obs) == 0.0

def test_mae_known():
    preds = [1.0, -2.0, 3.0]
    obs = [0.0, 0.0, 0.0]
    # abs diffs: 1, 2, 3 -> sum 6 -> mean 2
    assert calculate_mae(preds, obs) == 2.0

def test_mae_mismatched():
    with pytest.raises(ValueError):
        calculate_mae([1.0], [])

def test_mae_empty():
    with pytest.raises(ValueError):
        calculate_mae([], [])
