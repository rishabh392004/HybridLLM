from fastapi import APIRouter
from api.api.v1 import blend, forecasts, skill, weights, alerts, ml_model

api_router = APIRouter()
api_router.include_router(blend.router, prefix="/blend", tags=["blend"])
api_router.include_router(forecasts.router, prefix="/forecasts", tags=["forecasts"])
api_router.include_router(skill.router, prefix="/skill", tags=["skill"])
api_router.include_router(weights.router, prefix="/weights", tags=["weights"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(ml_model.router, prefix="/ml", tags=["ml_model"])
api_router.add_api_route("/copilot/query", ml_model.copilot_briefing, methods=["POST"], response_model=ml_model.CopilotQueryResponse, tags=["Operational Copilot"])

