import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from api.db.database import SessionLocal
from api.db.models import SkillScore, Weight, Forecast

def main():
    db = SessionLocal()
    
    region = "Delhi"
    parameter = "temperature"
    lead_hours = 24
    
    print("==================================================")
    print("PHASE 5 — SCIENTIFIC OUTPUT")
    print("==================================================")
    
    skills = db.query(SkillScore).filter_by(region=region, parameter=parameter, lead_hours=lead_hours).all()
    
    for s in skills:
        print(f"Forecast source {s.source}:")
        print(f"RMSE: {s.rmse}")
        print(f"MAE: {s.mae}")
        print(f"skill: {1.0 / s.rmse if s.rmse else 'N/A'}")
        print()
        
    weights = db.query(Weight).filter_by(region=region, parameter=parameter, lead_hours=lead_hours).all()
    print("Adaptive weights:")
    w_sum = 0
    for w in weights:
        print(f"source {w.source}: {w.weight}")
        w_sum += w.weight
    print(f"sum: {w_sum}")
    print()
    
    from api.services.blend_service import get_blended_forecast
    blend = get_blended_forecast(db, region=region, parameter=parameter, lead_hours=lead_hours)
    
    print("Blended result:")
    print(f"Blended value: {blend.forecast}")
    print("==================================================")
    db.close()

if __name__ == "__main__":
    main()
