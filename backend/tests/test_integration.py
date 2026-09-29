import pytest
import math
from api.db.database import SessionLocal
from api.db.models import SkillScore, Weight
from api.services.skill_service import compute_and_store_historical_skill
from api.services.weight_service import compute_and_store_weights

def test_integration_pipeline():
    # Note: This test runs against the populated synthetic database.
    db = SessionLocal()
    try:
        # 1. Compute Skills
        skill_count = compute_and_store_historical_skill(db)
        assert skill_count > 0
        
        # Verify db records
        db_skills = db.query(SkillScore).all()
        assert len(db_skills) > 0
        
        # 2. Compute Weights
        weight_count = compute_and_store_weights(db)
        assert weight_count > 0
        
        # Verify db records
        db_weights = db.query(Weight).all()
        assert len(db_weights) > 0
        
        # 3. Verify normalization per group
        # Group weights by (region, parameter, lead_hours)
        from collections import defaultdict
        groups = defaultdict(list)
        for w in db_weights:
            groups[(w.region, w.parameter, w.lead_hours)].append(w.weight)
            
        for key, weights_list in groups.items():
            total = sum(weights_list)
            assert math.isclose(total, 1.0, rel_tol=1e-5), f"Group {key} sum is {total}, expected 1.0"
            
    finally:
        db.close()
