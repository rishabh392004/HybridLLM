import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./test.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    APP_ENV: str = "production"
    JWT_SECRET: str = "forecombine_super_secure_production_jwt_secret_2026_x89f"
    CACHE_TTL: int = 3600
    
    # ML Model Configuration
    MODEL_PATH: str = "models/best_blending_unet.pt"
    MODEL_META_PATH: str = "models/model_metadata.json"
    MODEL_VERSION: str = "v2.4.0-hybrid-unet"

    # CORS configuration
    CORS_ORIGINS: List[str] = ["*"]
    
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
