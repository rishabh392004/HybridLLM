import hashlib
import numpy as np
from datetime import datetime
from typing import List, Tuple
from sqlalchemy.orm import Session
from api.db.models import Forecast, Observation

SOURCES = ["NWP", "ENSEMBLE", "AI_MODEL", "SATELLITE_AI"]
REGIONS = ["Delhi", "Punjab", "Uttar Pradesh", "Rajasthan", "Maharashtra", "Bihar"]
PARAMETERS = ["rainfall", "temperature", "wind"]
LEAD_TIMES = [6, 12, 24, 48, 72]

class SyntheticGenerator:
    def __init__(self, base_seed: int = 42):
        self.base_seed = base_seed

    def _get_hash_seed(self, *args) -> int:
        s = f"{self.base_seed}_" + "_".join(str(a) for a in args)
        return int(hashlib.md5(s.encode()).hexdigest(), 16) % (2**32)

    def generate_true_value(self, region: str, parameter: str, ts: datetime) -> float:
        rng = np.random.RandomState(self._get_hash_seed(region, parameter, ts.isoformat(), "true_val"))
        day_of_year = ts.timetuple().tm_yday
        
        if parameter == "rainfall":
            # mostly dry, occasionally rains
            if rng.uniform() > 0.7:
                return rng.uniform(5.0, 180.0)
            return rng.uniform(0.0, 5.0)
            
        elif parameter == "temperature":
            # Varies from 10 to 45
            base = 25 + 15 * np.sin(2 * np.pi * day_of_year / 365.0)
            return max(10.0, min(45.0, base + rng.uniform(-5.0, 5.0)))
            
        elif parameter == "wind":
            # 0 to 100
            return rng.uniform(0.0, 60.0)
            
        return 0.0

    def get_source_error(self, source: str, parameter: str, region: str, lead_hours: int, ts: datetime) -> float:
        rng = np.random.RandomState(self._get_hash_seed(source, parameter, region, lead_hours, ts.isoformat(), "error"))
        lead_multiplier = 1.0 + (lead_hours / 72.0)
        
        # Base characteristics
        bias = 0.0
        noise = 1.0

        if source == "NWP":
            bias = 1.0
            noise = 5.0
        elif source == "ENSEMBLE":
            bias = 0.5
            noise = 2.0
        elif source == "AI_MODEL":
            if parameter == "temperature":
                bias = -0.2
                noise = 1.0
            else:
                bias = 2.0
                noise = 8.0
        elif source == "SATELLITE_AI":
            if parameter == "rainfall":
                bias = 0.1
                noise = 1.0
            else:
                bias = -3.0
                noise = 10.0
                
        # regional variance
        if region == "Delhi" and source == "NWP":
            noise *= 1.5
            
        return rng.normal(loc=bias, scale=noise) * lead_multiplier

    def generate_observation(self, region: str, ts: datetime, parameter: str) -> Observation:
        true_val = self.generate_true_value(region, parameter, ts)
        return Observation(
            region=region,
            ts=ts,
            parameter=parameter,
            value=round(true_val, 2)
        )
        
    def generate_forecast(self, region: str, ts: datetime, lead_hours: int, parameter: str, source: str, true_val: float) -> Forecast:
        error = self.get_source_error(source, parameter, region, lead_hours, ts)
        forecast_val = true_val + error
        
        # Bound limits naturally
        if parameter == "rainfall":
            forecast_val = max(0.0, forecast_val)
        elif parameter == "wind":
            forecast_val = max(0.0, forecast_val)
            
        return Forecast(
            region=region,
            ts=ts,
            lead_hours=lead_hours,
            parameter=parameter,
            source=source,
            value=round(forecast_val, 2)
        )
        
    def generate_dataset_for_day(self, target_date: datetime) -> Tuple[List[Observation], List[Forecast]]:
        observations = []
        forecasts = []
        
        for region in REGIONS:
            for parameter in PARAMETERS:
                obs = self.generate_observation(region, target_date, parameter)
                observations.append(obs)
                
                for lead in LEAD_TIMES:
                    for source in SOURCES:
                        fcst = self.generate_forecast(
                            region=region, 
                            ts=target_date, 
                            lead_hours=lead, 
                            parameter=parameter, 
                            source=source,
                            true_val=obs.value
                        )
                        forecasts.append(fcst)
                        
        return observations, forecasts
