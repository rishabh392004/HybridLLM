from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, Literal
import json

from api.db.database import get_db
from api.db.cache import get_redis
from api.services.blend_service import get_blended_forecast
from api.schemas.api_schemas import BlendResponse

router = APIRouter()

@router.get("", response_model=BlendResponse)
def get_blend(
    region: str,
    parameter: Literal["rainfall", "temperature", "wind"],
    lead_hours: int,
    ts: Optional[datetime] = None,
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis)
):
    cache_key = f"blend:{region}:{parameter}:{lead_hours}:{ts.isoformat() if ts else 'latest'}"
    
    # Try fetching from cache
    if redis_client:
        try:
            cached_result = redis_client.get(cache_key)
            if cached_result:
                return json.loads(cached_result)
        except Exception as e:
            # Catch any unexpected Redis errors during get
            pass

    # Compute result
    result = get_blended_forecast(db, region=region, parameter=parameter, lead_hours=lead_hours, ts=ts)
    
    # Try saving to cache
    if redis_client:
        try:
            from api.core.config import settings
            redis_client.setex(cache_key, settings.CACHE_TTL, result.model_dump_json())
        except Exception:
            pass
            
    return result
