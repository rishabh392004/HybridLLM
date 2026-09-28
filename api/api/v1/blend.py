from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from api.db.database import get_db
from api.services.blend_service import get_blended_forecast
from api.schemas.api_schemas import BlendResponse

router = APIRouter()

@router.get("", response_model=BlendResponse)
def get_blend(
    region: str,
    parameter: str,
    lead_hours: int,
    ts: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    return get_blended_forecast(db, region=region, parameter=parameter, lead_hours=lead_hours, ts=ts)
