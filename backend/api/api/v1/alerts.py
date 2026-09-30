from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, Literal

from api.db.database import get_db
from api.db.models import Alert
from api.schemas.api_schemas import AlertListResponse, AlertResponse

router = APIRouter()

@router.get("", response_model=AlertListResponse)
def get_alerts(
    region: Optional[str] = None,
    parameter: Optional[Literal["rainfall", "temperature", "wind"]] = None,
    severity: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    
    if region:
        query = query.filter(Alert.region == region)
    if parameter:
        query = query.filter(Alert.parameter == parameter)
    if severity:
        query = query.filter(Alert.severity == severity)
        
    records = query.order_by(Alert.timestamp.desc()).limit(limit).all()
    
    if not records:
        raise HTTPException(status_code=404, detail="No alerts found")
        
    alerts = [
        AlertResponse(
            region=r.region,
            parameter=r.parameter,
            timestamp=r.timestamp,
            lead_hours=r.lead_hours,
            value=r.value,
            threshold=r.threshold,
            condition=r.condition,
            severity=r.severity,
            message=r.message
        ) for r in records
    ]
    
    return AlertListResponse(alerts=alerts)

@router.patch("/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.acknowledged = 1 # Assuming 1 is true
    db.commit()
    return {"status": "success", "message": "Alert acknowledged"}
