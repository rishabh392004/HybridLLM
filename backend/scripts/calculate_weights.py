import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from api.db.database import SessionLocal
from api.services.weight_service import compute_and_store_weights
from api.db.models import Weight

def main():
    print("Starting adaptive weight computation...")
    db = SessionLocal()
    try:
        count = compute_and_store_weights(db, season="ALL")
        print(f"Weight computation complete. Upserted {count} Weight records.")
        
        # Print a sample
        print("\n--- SAMPLE WEIGHTS ---")
        sample_weights = db.query(Weight).filter(
            Weight.region == "Delhi", 
            Weight.parameter == "rainfall", 
            Weight.lead_hours == 24
        ).all()
        
        if sample_weights:
            from api.db.models import SkillScore
            print("Region: Delhi")
            print("Parameter: rainfall")
            print("Lead: 24h")
            for w in sample_weights:
                ss = db.query(SkillScore).filter(
                    SkillScore.region == w.region,
                    SkillScore.parameter == w.parameter,
                    SkillScore.lead_hours == w.lead_hours,
                    SkillScore.source == w.source
                ).first()
                print(f"\n{w.source}:")
                if ss:
                    print(f"RMSE = {ss.rmse:.4f}")
                print(f"Weight = {w.weight:.4f}")
                print(f"Reason = {w.reason}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
