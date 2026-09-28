from pydantic import BaseModel, ConfigDict
from typing import List, Optional
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
