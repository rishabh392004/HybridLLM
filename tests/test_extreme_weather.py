import pytest
from api.services.extreme_weather import ExtremeWeatherDetector, THRESHOLDS

def test_rainfall_detection():
    # Below threshold
    detected, sev, cond, thresh = ExtremeWeatherDetector.evaluate("rainfall", THRESHOLDS["rainfall"]["watch"] - 1.0)
    assert not detected
    
    # Watch threshold exactly
    detected, sev, cond, thresh = ExtremeWeatherDetector.evaluate("rainfall", THRESHOLDS["rainfall"]["watch"])
    assert detected
    assert sev == "WATCH"
    assert thresh == THRESHOLDS["rainfall"]["watch"]
    
    # Warning threshold exactly
    detected, sev, cond, thresh = ExtremeWeatherDetector.evaluate("rainfall", THRESHOLDS["rainfall"]["warning"])
    assert detected
    assert sev == "WARNING"
    
    # Severe threshold above
    detected, sev, cond, thresh = ExtremeWeatherDetector.evaluate("rainfall", THRESHOLDS["rainfall"]["severe"] + 10.0)
    assert detected
    assert sev == "SEVERE"
    assert cond == "HEAVY_RAINFALL"

def test_temperature_detection():
    # Normal
    detected, sev, cond, thresh = ExtremeWeatherDetector.evaluate("temperature", 25.0)
    assert not detected
    
    # High watch
    detected, sev, cond, thresh = ExtremeWeatherDetector.evaluate("temperature", THRESHOLDS["temperature_high"]["watch"])
    assert detected
    assert sev == "WATCH"
    assert cond == "HIGH_TEMPERATURE"
    
    # Low severe
    detected, sev, cond, thresh = ExtremeWeatherDetector.evaluate("temperature", THRESHOLDS["temperature_low"]["severe"] - 2.0)
    assert detected
    assert sev == "SEVERE"
    assert cond == "LOW_TEMPERATURE"

def test_wind_detection():
    # Normal
    detected, sev, cond, thresh = ExtremeWeatherDetector.evaluate("wind", THRESHOLDS["wind"]["watch"] - 0.1)
    assert not detected
    
    # Warning
    detected, sev, cond, thresh = ExtremeWeatherDetector.evaluate("wind", THRESHOLDS["wind"]["warning"])
    assert detected
    assert sev == "WARNING"
    assert cond == "HIGH_WIND"

def test_unknown_parameter():
    detected, sev, cond, thresh = ExtremeWeatherDetector.evaluate("unknown_param", 100.0)
    assert not detected
    assert cond == "UNKNOWN"

def test_generate_message():
    msg = ExtremeWeatherDetector.generate_message("HEAVY_RAINFALL", "WARNING")
    assert msg == "Heavy rainfall conditions detected (warning)."
    
    msg = ExtremeWeatherDetector.generate_message("NORMAL", "NORMAL")
    assert msg == "Normal conditions."
