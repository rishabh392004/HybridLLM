from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class GridMetadata(BaseModel):
    lat_min: float = 8.0
    lat_max: float = 38.0
    lon_min: float = 68.0
    lon_max: float = 98.0
    resolution_steps: int = 35

class BlendRequest(BaseModel):
    variable: str = Field(default="temperature", description="'temperature' or 'precipitation'")
    lead_time_hrs: int = Field(default=48, ge=6, le=240)
    apply_bias_correction: bool = Field(default=True)
    enable_xai: bool = Field(default=False)
    # Optional raw incoming grids; defaults to operational cache if null
    custom_temp_m1: Optional[List[List[float]]] = None
    custom_temp_m2: Optional[List[List[float]]] = None

class VerificationStatus(BaseModel):
    rolling_rmse_m1: float
    rolling_rmse_m2: float
    weight_allocation_m1: float
    weight_allocation_m2: float

class BlendResponse(BaseModel):
    status: str
    variable: str
    lead_time_hrs: int
    conformal_margin: float = Field(description="Radius (+/-) of 90% confidence interval")
    verification: VerificationStatus
    grid_meta: GridMetadata
    geojson: Dict[str, Any]
    attribution_geojson: Optional[Dict[str, Any]] = None

class PointForecastResponse(BaseModel):
    latitude: float
    longitude: float
    nearest_grid_coord: List[float]
    blended_temperature_c: float
    temperature_ci_90: List[float]
    blended_precipitation_mm: float
    precipitation_ci_90: List[float]
    model_weight_distribution: Dict[str, float]
    primary_driver_feature: str

class AlertItem(BaseModel):
    node: str
    sector: str
    blended_temp: str
    blended_rain: str
    flood_index: float
    alert_level: str
    action_directive: str

class AlertResponse(BaseModel):
    status: str
    total_alerts: int
    summary: Dict[str, int]
    alerts: List[AlertItem]