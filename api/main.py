from fastapi import FastAPI
from api.core.config import settings
from api.core.logging import logger
from api.api.v1.router import api_router

app = FastAPI(title="ForeCombine API")

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    logger.info("Health check requested")
    return {"status": "ok"}
