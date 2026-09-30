from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from api.db.models import Alert
from api.services.blend_service import get_blended_forecast
from api.services.extreme_weather import ExtremeWeatherDetector
from fastapi import HTTPException

def check_and_generate_alerts_for_blend(
    db: Session,
    region: str,
    parameter: str,
    lead_hours: int,
    ts=None
):
    """
    Retrieves the blended forecast, evaluates rules, and creates an alert if extreme.
    Returns the created/updated Alert object if detected, otherwise None.
    """
    try:
        blend_result = get_blended_forecast(db, region, parameter, lead_hours, ts)
    except HTTPException:
        # No forecast data or weights available
        return None
        
    detected, severity, condition, threshold = ExtremeWeatherDetector.evaluate(parameter, blend_result.forecast)
    
    if detected:
        message = ExtremeWeatherDetector.generate_message(condition, severity)
        
        # Upsert alert to avoid duplicates (using ON CONFLICT DO UPDATE)
        alert_dict = {
            "region": region,
            "parameter": parameter,
            "timestamp": blend_result.timestamp,
            "lead_hours": lead_hours,
            "value": blend_result.forecast,
            "threshold": threshold,
            "condition": condition,
            "severity": severity,
            "message": message
        }
        
        stmt = insert(Alert).values([alert_dict])
        stmt = stmt.on_conflict_do_update(
            constraint="uix_alert_unique",
            set_={
                "value": stmt.excluded.value,
                "threshold": stmt.excluded.threshold,
                "severity": stmt.excluded.severity,
                "message": stmt.excluded.message
            }
        ).returning(Alert)
        
        result = db.execute(stmt)
        db.commit()
        return result.scalar_one()
        
    return None
