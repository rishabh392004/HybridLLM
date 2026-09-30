from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Literal

from api.db.database import get_db
from api.db.models import SkillScore
from api.schemas.api_schemas import SkillGroupResponse, SkillSourceResponse

router = APIRouter()

@router.get("", response_model=SkillGroupResponse)
def get_skill(
    region: str,
    parameter: Literal["rainfall", "temperature", "wind"],
    lead_hours: int,
    season: str = "ALL",
    db: Session = Depends(get_db)
):
    records = db.query(SkillScore).filter(
        SkillScore.region == region,
        SkillScore.parameter == parameter,
        SkillScore.lead_hours == lead_hours,
        SkillScore.season == season
    ).all()
    
    if not records:
        raise HTTPException(status_code=404, detail="No skill data found")
        
    skills = [
        SkillSourceResponse(
            source=r.source,
            rmse=r.rmse,
            mae=r.mae
        ) for r in records
    ]
    
    return SkillGroupResponse(
        region=region,
        parameter=parameter,
        lead_hours=lead_hours,
        skills=skills
    )
