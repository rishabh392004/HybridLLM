from typing import Tuple, Optional

# DEMONSTRATION thresholds for synthetic data prototype.
# These are NOT official operational weather-warning thresholds.
THRESHOLDS = {
    "rainfall": {
        "watch": 50.0,
        "warning": 100.0,
        "severe": 150.0
    },
    "temperature_high": {
        "watch": 35.0,
        "warning": 40.0,
        "severe": 44.0
    },
    "temperature_low": {
        "watch": 15.0,
        "warning": 12.0,
        "severe": 10.0
    },
    "wind": {
        "watch": 40.0,
        "warning": 60.0,
        "severe": 80.0
    }
}

class ExtremeWeatherDetector:
    
    @staticmethod
    def evaluate_rainfall(value: float) -> Tuple[bool, str, str, Optional[float]]:
        t = THRESHOLDS["rainfall"]
        if value >= t["severe"]:
            return True, "SEVERE", "HEAVY_RAINFALL", t["severe"]
        if value >= t["warning"]:
            return True, "WARNING", "HEAVY_RAINFALL", t["warning"]
        if value >= t["watch"]:
            return True, "WATCH", "HEAVY_RAINFALL", t["watch"]
        return False, "NORMAL", "NORMAL", None

    @staticmethod
    def evaluate_temperature(value: float) -> Tuple[bool, str, str, Optional[float]]:
        # Check high first
        th = THRESHOLDS["temperature_high"]
        if value >= th["severe"]:
            return True, "SEVERE", "HIGH_TEMPERATURE", th["severe"]
        if value >= th["warning"]:
            return True, "WARNING", "HIGH_TEMPERATURE", th["warning"]
        if value >= th["watch"]:
            return True, "WATCH", "HIGH_TEMPERATURE", th["watch"]
            
        # Check low
        tl = THRESHOLDS["temperature_low"]
        if value <= tl["severe"]:
            return True, "SEVERE", "LOW_TEMPERATURE", tl["severe"]
        if value <= tl["warning"]:
            return True, "WARNING", "LOW_TEMPERATURE", tl["warning"]
        if value <= tl["watch"]:
            return True, "WATCH", "LOW_TEMPERATURE", tl["watch"]
            
        return False, "NORMAL", "NORMAL", None

    @staticmethod
    def evaluate_wind(value: float) -> Tuple[bool, str, str, Optional[float]]:
        t = THRESHOLDS["wind"]
        if value >= t["severe"]:
            return True, "SEVERE", "HIGH_WIND", t["severe"]
        if value >= t["warning"]:
            return True, "WARNING", "HIGH_WIND", t["warning"]
        if value >= t["watch"]:
            return True, "WATCH", "HIGH_WIND", t["watch"]
        return False, "NORMAL", "NORMAL", None

    @classmethod
    def evaluate(cls, parameter: str, value: float) -> Tuple[bool, str, str, Optional[float]]:
        """
        Returns: detected(bool), severity(str), condition(str), threshold(float)
        """
        if parameter == "rainfall":
            return cls.evaluate_rainfall(value)
        elif parameter == "temperature":
            return cls.evaluate_temperature(value)
        elif parameter == "wind":
            return cls.evaluate_wind(value)
        else:
            return False, "NORMAL", "UNKNOWN", None

    @staticmethod
    def generate_message(condition: str, severity: str) -> str:
        if condition == "HEAVY_RAINFALL":
            return f"Heavy rainfall conditions detected ({severity.lower()})."
        elif condition == "HIGH_TEMPERATURE":
            return f"Extreme heat conditions detected ({severity.lower()})."
        elif condition == "LOW_TEMPERATURE":
            return f"Extreme cold conditions detected ({severity.lower()})."
        elif condition == "HIGH_WIND":
            return f"High wind conditions detected ({severity.lower()})."
        return "Normal conditions."
