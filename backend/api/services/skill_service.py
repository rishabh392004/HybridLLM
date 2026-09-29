from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from api.db.models import Forecast, Observation, SkillScore
from api.services.skill import calculate_rmse, calculate_mae

def compute_and_store_historical_skill(db: Session, season: str = "ALL"):
    # Retrieve all pairs of Forecast and Observation matching (region, parameter, ts)
    # Group by region, parameter, lead_hours, source
    # We can do this with a join query
    
    results = db.query(
        Forecast.region,
        Forecast.parameter,
        Forecast.lead_hours,
        Forecast.source,
        Forecast.value.label("prediction"),
        Observation.value.label("observation")
    ).join(
        Observation,
        (Forecast.region == Observation.region) &
        (Forecast.parameter == Observation.parameter) &
        (Forecast.ts == Observation.ts)
    ).all()
    
    # Group results in python memory (data size is relatively small for prototypes)
    from collections import defaultdict
    grouped = defaultdict(lambda: {"preds": [], "obs": []})
    
    for row in results:
        key = (row.region, row.parameter, row.lead_hours, row.source)
        grouped[key]["preds"].append(row.prediction)
        grouped[key]["obs"].append(row.observation)
        
    skill_scores_to_upsert = []
    
    for (region, parameter, lead_hours, source), data in grouped.items():
        if not data["preds"]:
            continue
            
        try:
            rmse = calculate_rmse(data["preds"], data["obs"])
            mae = calculate_mae(data["preds"], data["obs"])
        except ValueError:
            continue
            
        skill_scores_to_upsert.append({
            "region": region,
            "season": season,
            "lead_hours": lead_hours,
            "parameter": parameter,
            "source": source,
            "rmse": rmse,
            "mae": mae,
            "computed_on": datetime.utcnow()
        })
        
    if skill_scores_to_upsert:
        stmt = insert(SkillScore).values(skill_scores_to_upsert)
        stmt = stmt.on_conflict_do_update(
            constraint="uix_skill_score_unique",
            set_={
                "rmse": stmt.excluded.rmse,
                "mae": stmt.excluded.mae,
                "computed_on": stmt.excluded.computed_on
            }
        )
        db.execute(stmt)
        db.commit()
        
    return len(skill_scores_to_upsert)
