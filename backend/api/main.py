from fastapi import FastAPI
from api.core.config import settings
from api.core.logging import logger
from api.api.v1.router import api_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ForeCombine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/v1")


@app.get("/health")
def health_check():
    logger.info("Health check requested")
    return {"status": "ok"}
