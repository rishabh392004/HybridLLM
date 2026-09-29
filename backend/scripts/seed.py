import os
import sys
from datetime import datetime, timedelta
from sqlalchemy.dialects.postgresql import insert

# Add the backend directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from api.db.database import SessionLocal, engine
from api.db.models import Forecast, Observation
from api.services.ingestion.synthetic import SyntheticGenerator

def seed_data(days: int = 30, base_date: datetime = None):
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
                
                # Postgres doesn't have a unique constraint covering just region, ts, parameter yet,
                # but we can query to prevent duplicates if we want to be safe, or just insert.
                # Actually wait, the Observation model doesn't have a unique constraint in Milestone 1!
                # "Observation: id, region, ts, parameter, value" -> no unique constraint defined.
                # So we can't use ON CONFLICT DO NOTHING for observations without adding a constraint.
                pass
            
            # Since Observation has no unique constraint, let's do it manually or add a constraint.
            # We'll just do manual check for obs since it's only 18 per day.
            for obs in obs_list:
                existing = db.query(Observation).filter(
                    Observation.region == obs.region,
                    Observation.parameter == obs.parameter,
                    Observation.ts == obs.ts
                ).first()
                if not existing:
                    db.add(obs)
                    total_obs += 1

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
    seed_data(days=30)
