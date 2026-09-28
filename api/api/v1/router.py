from fastapi import APIRouter
from api.api.v1 import blend, forecasts, skill, weights, alerts

api_router = APIRouter()
api_router.include_router(blend.router, prefix="/blend", tags=["blend"])
api_router.include_router(forecasts.router, prefix="/forecasts", tags=["forecasts"])
api_router.include_router(skill.router, prefix="/skill", tags=["skill"])
api_router.include_router(weights.router, prefix="/weights", tags=["weights"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
