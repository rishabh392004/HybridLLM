from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.db.database import get_db
from api.db.models import Weight
from api.schemas.api_schemas import WeightGroupResponse, WeightSourceResponse

router = APIRouter()

@router.get("", response_model=WeightGroupResponse)
def get_weights(
    region: str,
    parameter: str,
    lead_hours: int,
    db: Session = Depends(get_db)
):
    records = db.query(Weight).filter(
        Weight.region == region,
        Weight.parameter == parameter,
        Weight.lead_hours == lead_hours,
        Weight.season == "ALL"
    ).all()
    
    if not records:
        raise HTTPException(status_code=404, detail="No weight data found")
        
    weights = [
        WeightSourceResponse(
            source=r.source,
            weight=r.weight,
            previous_weight=r.previous_weight,
            reason=r.reason
        ) for r in records
    ]
    
    return WeightGroupResponse(
        region=region,
        parameter=parameter,
        lead_hours=lead_hours,
        weights=weights
    )
