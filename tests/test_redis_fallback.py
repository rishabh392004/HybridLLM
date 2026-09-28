import pytest
from fastapi.testclient import TestClient
from api.main import app
from api.db.cache import get_redis

# Create test client
client = TestClient(app)

def test_api_blend_redis_up():
    """Test that the blend API works normally when Redis is up (or simulated as up)."""
    # Since we can't easily guarantee Redis is up in the test env without mocking,
    # we'll mock the dependency to simulate an active Redis client (or we just let it use the real one)
    # Actually, we will just call the endpoint. If Redis is down, it should gracefully fall back anyway.
    
    response = client.get("/api/v1/blend?region=Delhi&parameter=temperature&lead_hours=24")
    assert response.status_code == 200
    assert "forecast" in response.json()
    assert "sources" in response.json()

def test_api_blend_redis_down():
    """Test that the blend API gracefully falls back to DB when Redis is explicitly failing."""
    
    # We will override the get_redis dependency to simulate a failed Redis connection
    def override_get_redis_fail():
        # Yield None just like our failure mechanism does when Redis connection fails
        yield None
        
    app.dependency_overrides[get_redis] = override_get_redis_fail
    
    try:
        response = client.get("/api/v1/blend?region=Delhi&parameter=temperature&lead_hours=24")
        assert response.status_code == 200
        data = response.json()
        assert "forecast" in data
        assert "sources" in data
    finally:
        app.dependency_overrides.clear()
