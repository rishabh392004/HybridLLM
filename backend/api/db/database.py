from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from api.core.config import settings

def get_engine():
    db_url = settings.DATABASE_URL
    # Normalize postgresql:// to postgresql+psycopg2:// if needed
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    connect_args = {}
    if "sqlite" in db_url:
        connect_args["check_same_thread"] = False

    try:
        eng = create_engine(
            db_url,
            connect_args=connect_args,
            pool_pre_ping=True
        )
        # Attempt quick probe
        with eng.connect() as conn:
            pass
        return eng
    except Exception:
        # Fallback to local SQLite if Postgres is unreachable or driver not installed locally
        return create_engine("sqlite:///./test.db", connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Auto-create tables on startup
try:
    from api.db.models import Base
    Base.metadata.create_all(bind=engine)
except Exception:
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
