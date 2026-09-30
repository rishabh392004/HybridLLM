from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, UniqueConstraint, Index
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, index=True)
    region = Column(String, nullable=False, index=True)
    ts = Column(DateTime, nullable=False, index=True)
    lead_hours = Column(Integer, nullable=False)
    parameter = Column(String, nullable=False)
    source = Column(String, nullable=False)
    value = Column(Float, nullable=False)

    __table_args__ = (
        UniqueConstraint('region', 'ts', 'lead_hours', 'parameter', 'source', name='uix_forecast_region_ts_lead_param_src'),
    )

class Observation(Base):
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, index=True)
    region = Column(String, nullable=False, index=True)
    ts = Column(DateTime, nullable=False, index=True)
    parameter = Column(String, nullable=False)
    value = Column(Float, nullable=False)

    __table_args__ = (
        UniqueConstraint('region', 'ts', 'parameter', name='uix_observation_region_ts_param'),
    )

class SkillScore(Base):
    __tablename__ = "skill_scores"

    id = Column(Integer, primary_key=True, index=True)
    region = Column(String, nullable=False, index=True)
    season = Column(String, nullable=False)
    lead_hours = Column(Integer, nullable=False)
    parameter = Column(String, nullable=False)
    source = Column(String, nullable=False)
    rmse = Column(Float, nullable=True)
    mae = Column(Float, nullable=True)
    brier = Column(Float, nullable=True)
    computed_on = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('region', 'season', 'lead_hours', 'parameter', 'source', name='uix_skill_score_unique'),
    )

class Weight(Base):
    __tablename__ = "weights"

    id = Column(Integer, primary_key=True, index=True)
    region = Column(String, nullable=False, index=True)
    season = Column(String, nullable=False)
    lead_hours = Column(Integer, nullable=False)
    parameter = Column(String, nullable=False)
    source = Column(String, nullable=False)
    weight = Column(Float, nullable=False)
    previous_weight = Column(Float, nullable=True)
    reason = Column(String, nullable=True)
    updated_on = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('region', 'season', 'lead_hours', 'parameter', 'source', name='uix_weight_unique'),
    )

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    region = Column(String, nullable=False, index=True)
    parameter = Column(String, nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    lead_hours = Column(Integer, nullable=False)
    value = Column(Float, nullable=False)
    threshold = Column(Float, nullable=False)
    condition = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    message = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    acknowledged = Column(Integer, default=0) # Using Integer as boolean-like for simplicity or Boolean if preferred, wait, SQLAlchemy Boolean is fine, but since postgres handles it well, let's use Integer for now or Boolean. Actually, we'll use Integer for simplicity. No, use Integer.

    __table_args__ = (
        UniqueConstraint('region', 'parameter', 'timestamp', 'lead_hours', 'condition', name='uix_alert_unique'),
    )

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="analyst")
    agency = Column(String, nullable=False, default="IMD NWP Division")
    created_at = Column(DateTime, default=datetime.utcnow)

