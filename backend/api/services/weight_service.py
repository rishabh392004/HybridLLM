from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from api.db.models import SkillScore, Weight
from api.services.weights import calculate_inverse_rmse_weights, smooth_weights, generate_weight_reason

def compute_and_store_weights(db: Session, season: str = "ALL"):
    # 1. Retrieve all skill scores for the season
    skill_scores = db.query(SkillScore).filter(SkillScore.season == season).all()
    
    # 2. Retrieve all existing weights (to be used as previous_weight)
    existing_weights_records = db.query(Weight).filter(Weight.season == season).all()
    
    # Group by region, parameter, lead_hours
    from collections import defaultdict
    grouped_skills = defaultdict(dict)
    for ss in skill_scores:
        key = (ss.region, ss.parameter, ss.lead_hours)
        if ss.rmse is not None:
            grouped_skills[key][ss.source] = ss.rmse
            
    existing_weights = defaultdict(dict)
    for w in existing_weights_records:
        key = (w.region, w.parameter, w.lead_hours)
        existing_weights[key][w.source] = w.weight

    weights_to_upsert = []
    
    for (region, parameter, lead_hours), source_rmses in grouped_skills.items():
        if not source_rmses:
            continue
            
        try:
            # Calculate computed weights using inverse RMSE
            computed = calculate_inverse_rmse_weights(source_rmses)
            
            # Retrieve previous weights for smoothing
            prev = existing_weights.get((region, parameter, lead_hours), {})
            
            # Smooth weights
            final_weights = smooth_weights(computed, prev)
            
            # Prepare records
            for source, final_weight in final_weights.items():
                reason = generate_weight_reason(source, computed[source], computed)
                
                weights_to_upsert.append({
                    "region": region,
                    "season": season,
                    "lead_hours": lead_hours,
                    "parameter": parameter,
                    "source": source,
                    "weight": final_weight,
                    "previous_weight": prev.get(source),
                    "reason": reason,
                    "updated_on": datetime.utcnow()
                })
        except ValueError:
            pass # Invalid RMSE skip
            
    if weights_to_upsert:
        dialect_name = getattr(db.bind.dialect, "name", "") if db.bind else ""
        if dialect_name == "postgresql":
            from sqlalchemy.dialects.postgresql import insert as pg_insert
            stmt = pg_insert(Weight).values(weights_to_upsert)
            stmt = stmt.on_conflict_do_update(
                constraint="uix_weight_unique",
                set_={
                    "weight": stmt.excluded.weight,
                    "previous_weight": stmt.excluded.previous_weight,
                    "reason": stmt.excluded.reason,
                    "updated_on": stmt.excluded.updated_on
                }
            )
            db.execute(stmt)
        else:
            for item in weights_to_upsert:
                existing = db.query(Weight).filter_by(
                    region=item["region"],
                    season=item["season"],
                    lead_hours=item["lead_hours"],
                    parameter=item["parameter"],
                    source=item["source"]
                ).first()
                if existing:
                    existing.weight = item["weight"]
                    existing.previous_weight = item["previous_weight"]
                    existing.reason = item["reason"]
                    existing.updated_on = item["updated_on"]
                else:
                    db.add(Weight(**item))
        db.commit()
        
    return len(weights_to_upsert)
