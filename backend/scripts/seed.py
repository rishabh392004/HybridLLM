import os
import sys
from datetime import datetime, timedelta
from sqlalchemy.dialects.postgresql import insert

# Add the backend directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from api.db.database import SessionLocal, engine
from api.db.models import Forecast, Observation
from api.services.ingestion.synthetic import SyntheticGenerator

def seed_data(days: int = 365, base_date: datetime = None):
    if base_date is None:
        base_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
    generator = SyntheticGenerator(base_seed=42)
    db = SessionLocal()
    
    try:
        total_obs = 0
        total_fcst = 0
        
        for i in range(days):
            target_date = base_date - timedelta(days=days - i - 1)
            print(f"Seeding data for {target_date.date()}...")
            
            obs_list, fcst_list = generator.generate_dataset_for_day(target_date)
            
            # Bulk upsert observations
            if obs_list:
                obs_dicts = [
                    {
                        "region": o.region,
                        "ts": o.ts,
                        "parameter": o.parameter,
                        "value": o.value
                    } for o in obs_list
                ]
                
                stmt = insert(Observation).values(obs_dicts)
                stmt = stmt.on_conflict_do_nothing(
                    constraint='uix_observation_region_ts_param'
                )
                res = db.execute(stmt)
                total_obs += res.rowcount

            # For Forecast, there is a unique constraint: 'uix_forecast_region_ts_lead_param_src'
            # We can use ON CONFLICT DO NOTHING
            if fcst_list:
                fcst_dicts = [
                    {
                        "region": f.region,
                        "ts": f.ts,
                        "lead_hours": f.lead_hours,
                        "parameter": f.parameter,
                        "source": f.source,
                        "value": f.value
                    } for f in fcst_list
                ]
                stmt = insert(Forecast).values(fcst_dicts)
                stmt = stmt.on_conflict_do_nothing(
                    constraint='uix_forecast_region_ts_lead_param_src'
                )
                res = db.execute(stmt)
                total_fcst += res.rowcount
            
            db.commit()
            
        print(f"Seeding complete! Added {total_obs} observations and {total_fcst} forecasts.")
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting seed process...")
    seed_data(days=365)
