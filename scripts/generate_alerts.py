import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from api.db.database import SessionLocal
from api.db.models import Forecast
from api.services.alert_service import check_and_generate_alerts_for_blend

def main():
    print("Starting alert generation from historical blended forecasts...")
    db = SessionLocal()
    
    try:
        # Retrieve all distinct (region, parameter, lead_hours, timestamp) combinations
        # We can find these by looking at unique combinations in the Forecasts table.
        combinations = db.query(
            Forecast.region,
            Forecast.parameter,
            Forecast.lead_hours,
            Forecast.ts
        ).distinct().all()
        
        print(f"Found {len(combinations)} forecast combinations to evaluate.")
        
        alerts_generated = 0
        for region, parameter, lead_hours, ts in combinations:
            alert = check_and_generate_alerts_for_blend(db, region, parameter, lead_hours, ts)
            if alert:
                alerts_generated += 1
                
        print(f"Alert generation complete. Evaluated {len(combinations)} combinations.")
        print(f"Generated/Updated {alerts_generated} alerts.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
