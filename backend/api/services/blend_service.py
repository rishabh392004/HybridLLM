from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Dict, List

from api.db.models import Forecast, Weight
from api.services.blend import calculate_blend
from api.schemas.api_schemas import BlendResponse, SourceContribution

def get_blended_forecast(
    db: Session,
    region: str,
    parameter: str,
    lead_hours: int,
    ts: datetime = None
) -> BlendResponse:
    # 1. If timestamp not provided, find the most recent forecast timestamp for this combination
    if ts is None:
        latest_fcst = db.query(Forecast).filter(
            Forecast.region == region,
            Forecast.parameter == parameter,
            Forecast.lead_hours == lead_hours
        ).order_by(Forecast.ts.desc()).first()
        
        if not latest_fcst:
            raise HTTPException(status_code=404, detail="No forecast data found for requested combination")
        ts = latest_fcst.ts
        
    # 2. Retrieve forecasts
    forecasts = db.query(Forecast).filter(
        Forecast.region == region,
        Forecast.parameter == parameter,
        Forecast.lead_hours == lead_hours,
        Forecast.ts == ts
    ).all()
    
    if not forecasts:
        raise HTTPException(status_code=404, detail="No forecast data found for requested combination and timestamp")
        
    # 3. Retrieve weights (assuming latest season="ALL" for the prototype)
    weights = db.query(Weight).filter(
        Weight.region == region,
        Weight.parameter == parameter,
        Weight.lead_hours == lead_hours,
        Weight.season == "ALL"
    ).all()
    
    if not weights:
        raise HTTPException(status_code=404, detail="No weight data found for requested combination")
        
    f_dict = {f.source: f.value for f in forecasts}
    w_dict = {w.source: w.weight for w in weights}
    w_reason_dict = {w.source: w.reason for w in weights}
    
    # 4. Calculate blend
    try:
        blended_value = calculate_blend(f_dict, w_dict)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"Blend calculation error: {str(e)}")
        
    # 5. Build response
    sources = []
    for src, f_val in f_dict.items():
        w_val = w_dict[src]
        contrib = f_val * w_val
        sources.append(
            SourceContribution(
                source=src,
                forecast=round(f_val, 4),
                weight=round(w_val, 4),
                contribution=round(contrib, 4),
                reason=w_reason_dict.get(src)
            )
        )
        
    return BlendResponse(
        region=region,
        parameter=parameter,
        lead_hours=lead_hours,
        timestamp=ts,
        forecast=round(blended_value, 4),
        sources=sources
    )
