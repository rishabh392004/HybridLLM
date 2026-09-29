from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ForecastResponse(BaseModel):
    id: int
    region: str
    ts: datetime
    lead_hours: int
    parameter: str
    source: str
    value: float

    model_config = ConfigDict(from_attributes=True)
    
class SkillSourceResponse(BaseModel):
    source: str
    rmse: Optional[float]
    mae: Optional[float]

class SkillGroupResponse(BaseModel):
    region: str
    parameter: str
    lead_hours: int
    skills: List[SkillSourceResponse]

class WeightSourceResponse(BaseModel):
    source: str
    weight: float
    previous_weight: Optional[float]
    reason: Optional[str]

class WeightGroupResponse(BaseModel):
    region: str
    parameter: str
    lead_hours: int
    weights: List[WeightSourceResponse]

class SourceContribution(BaseModel):
    source: str
    forecast: float
    weight: float
    contribution: float
    reason: Optional[str]

class BlendResponse(BaseModel):
    region: str
    parameter: str
    lead_hours: int
    timestamp: datetime
    forecast: float
    sources: List[SourceContribution]

class AlertResponse(BaseModel):
    region: str
    parameter: str
    timestamp: datetime
    lead_hours: int
    value: float
    threshold: float
    condition: str
    severity: str
    message: str

class AlertListResponse(BaseModel):
    alerts: List[AlertResponse]
class MLGridMetadata(BaseModel):
    lat_min: float = 8.0
    lat_max: float = 38.0
    lon_min: float = 68.0
    lon_max: float = 98.0
    resolution_steps: int = 35

class MLBlendRequest(BaseModel):
    variable: str = Field(default="temperature", description="'temperature' or 'precipitation'")
    lead_time_hrs: int = Field(default=48, ge=6, le=240)
    apply_bias_correction: bool = Field(default=True)
    enable_xai: bool = Field(default=False)
    custom_temp_m1: Optional[List[List[float]]] = None
    custom_temp_m2: Optional[List[List[float]]] = None

class MLVerificationStatus(BaseModel):
    rolling_rmse_m1: float
    rolling_rmse_m2: float
    weight_allocation_m1: float
    weight_allocation_m2: float

class MLBlendResponse(BaseModel):
    status: str
    variable: str
    lead_time_hrs: int
    conformal_margin: float = Field(description="Radius (+/-) of 90% confidence interval")
    verification: MLVerificationStatus
    grid_meta: MLGridMetadata
    geojson: Dict[str, Any]
    attribution_geojson: Optional[Dict[str, Any]] = None

class MLPointForecastResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    latitude: float
    longitude: float
    nearest_grid_coord: List[float]
    blended_temperature_c: float
    temperature_ci_90: List[float]
    blended_precipitation_mm: float
    precipitation_ci_90: List[float]
    model_weight_distribution: Dict[str, float]
    primary_driver_feature: str

class MLAlertItem(BaseModel):
    node: str
    sector: str
    blended_temp: str
    blended_rain: str
    flood_index: float
    alert_level: str
    action_directive: str

class MLAlertResponse(BaseModel):
    status: str
    total_alerts: int
    summary: Dict[str, int]
    alerts: List[MLAlertItem]
