import redis
from typing import Generator
import logging
from api.core.config import settings

logger = logging.getLogger(__name__)

def get_redis() -> Generator[redis.Redis, None, None]:
    """Dependency to get Redis connection. Returns None if Redis is unavailable."""
    client = None
    try:
        client = redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=1)
        client.ping()
        yield client
    except (redis.exceptions.ConnectionError, redis.exceptions.TimeoutError) as e:
        logger.warning(f"Redis cache unavailable: {str(e)}. Falling back to PostgreSQL computation.")
        yield None
    finally:
        if client:
            client.close()
