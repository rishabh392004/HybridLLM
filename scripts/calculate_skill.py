import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from api.db.database import SessionLocal
from api.services.skill_service import compute_and_store_historical_skill

def main():
    print("Starting historical skill computation...")
    db = SessionLocal()
    try:
        count = compute_and_store_historical_skill(db, season="ALL")
        print(f"Skill computation complete. Upserted {count} SkillScore records.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
