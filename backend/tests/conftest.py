import pytest
from datetime import datetime, timedelta
import os
import sys

# Ensure backend and root are in python path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from api.db.database import engine, SessionLocal
from api.db.models import Base, Forecast, Observation, SkillScore, Weight, Alert, User

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create all tables and seed sample test data for Delhi."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
        
        # 4 Standard Forecast sources for Delhi (weights sum to 1.0)
        sources = [
            ("ECMWF IFS", 18.0, 0.40, "Lowest 30-day RMSE"),
            ("GFS", 16.5, 0.30, "Moderate synoptic skill"),
            ("GraphCast AI", 19.2, 0.20, "Neural model benchmark"),
            ("WRF Regional", 17.1, 0.10, "High-resolution mesoscale"),
        ]
        
        # Add Forecasts & Weights & Skills
        for src, val, weight, reason in sources:
            fcst_rain = Forecast(
                region="Delhi",
                ts=now,
                lead_hours=24,
                parameter="rainfall",
                source=src,
                value=val
            )
            fcst_temp = Forecast(
                region="Delhi",
                ts=now,
                lead_hours=24,
                parameter="temperature",
                source=src,
                value=28.5 + (1.0 if src == "GFS" else -0.5)
            )
            db.add(fcst_rain)
            db.add(fcst_temp)
            
            w_rain = Weight(
                region="Delhi",
                season="ALL",
                lead_hours=24,
                parameter="rainfall",
                source=src,
                weight=weight,
                previous_weight=weight,
                reason=reason,
                updated_on=now
            )
            w_temp = Weight(
                region="Delhi",
                season="ALL",
                lead_hours=24,
                parameter="temperature",
                source=src,
                weight=weight,
                previous_weight=weight,
                reason=reason,
                updated_on=now
            )
            db.add(w_rain)
            db.add(w_temp)
            
            sk_rain = SkillScore(
                region="Delhi",
                season="ALL",
                lead_hours=24,
                parameter="rainfall",
                source=src,
                rmse=2.1,
                mae=1.6,
                brier=0.12,
                computed_on=now
            )
            sk_temp = SkillScore(
                region="Delhi",
                season="ALL",
                lead_hours=24,
                parameter="temperature",
                source=src,
                rmse=1.2,
                mae=0.9,
                brier=0.08,
                computed_on=now
            )
            db.add(sk_rain)
            db.add(sk_temp)
        
        # Add Observations
        obs_rain = Observation(
            region="Delhi",
            ts=now,
            parameter="rainfall",
            value=17.8
        )
        obs_temp = Observation(
            region="Delhi",
            ts=now,
            parameter="temperature",
            value=28.2
        )
        db.add(obs_rain)
        db.add(obs_temp)
        
        # Add an active alert for Delhi
        alert = Alert(
            region="Delhi",
            parameter="rainfall",
            timestamp=now,
            lead_hours=24,
            value=45.0,
            threshold=35.0,
            condition="heavy_rainfall",
            severity="warning",
            message="Heavy rainfall advisory for National Capital Region",
            created_at=now,
            acknowledged=0
        )
        db.add(alert)
        
        db.commit()
    finally:
        db.close()
    
    yield
