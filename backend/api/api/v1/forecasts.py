from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from api.db.database import get_db
from api.db.models import Forecast
from api.schemas.api_schemas import ForecastResponse

router = APIRouter()

@router.get("", response_model=List[ForecastResponse])
def get_forecasts(
    region: Optional[str] = None,
    parameter: Optional[str] = None,
    lead_hours: Optional[int] = None,
    source: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    query = db.query(Forecast)
    
    if region:
        query = query.filter(Forecast.region == region)
    if parameter:
        query = query.filter(Forecast.parameter == parameter)
    if lead_hours is not None:
        query = query.filter(Forecast.lead_hours == lead_hours)
    if source:
        query = query.filter(Forecast.source == source)
        
    records = query.order_by(Forecast.ts.desc()).offset(skip).limit(limit).all()
    
    if not records and skip == 0:
        raise HTTPException(status_code=404, detail="No forecasts found")
        
    return records
