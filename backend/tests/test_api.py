import pytest
import math
from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_api_blend():
    # We query Delhi rainfall at 24h
    response = client.get("/api/v1/blend?region=Delhi&parameter=rainfall&lead_hours=24")
    assert response.status_code == 200
    data = response.json()
    
    assert data["region"] == "Delhi"
    assert data["parameter"] == "rainfall"
    assert data["lead_hours"] == 24
    
    # Check blend arithmetic
    blended_forecast = data["forecast"]
    sources = data["sources"]
    
    calculated_sum = 0.0
    weight_sum = 0.0
    for s in sources:
        assert "source" in s
        assert "forecast" in s
        assert "weight" in s
        assert "contribution" in s
        assert "reason" in s
        
        calculated_sum += s["contribution"]
        weight_sum += s["weight"]
        
        assert math.isclose(s["forecast"] * s["weight"], s["contribution"], rel_tol=1e-3)
        
    assert math.isclose(weight_sum, 1.0, rel_tol=1e-3)
    assert math.isclose(calculated_sum, blended_forecast, rel_tol=1e-3)

def test_api_blend_no_data():
    response = client.get("/api/v1/blend?region=FakeCity&parameter=rainfall&lead_hours=24")
    assert response.status_code == 404

def test_api_forecasts():
    response = client.get("/api/v1/forecasts?region=Delhi&parameter=rainfall&lead_hours=24")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["region"] == "Delhi"
    assert data[0]["parameter"] == "rainfall"
    assert data[0]["lead_hours"] == 24

def test_api_skill():
    response = client.get("/api/v1/skill?region=Delhi&parameter=rainfall&lead_hours=24")
    assert response.status_code == 200
    data = response.json()
    assert data["region"] == "Delhi"
    assert len(data["skills"]) == 4

def test_api_weights():
    response = client.get("/api/v1/weights?region=Delhi&parameter=rainfall&lead_hours=24")
    assert response.status_code == 200
    data = response.json()
    assert data["region"] == "Delhi"
    assert len(data["weights"]) == 4
    
    sum_weights = sum(w["weight"] for w in data["weights"])
    assert math.isclose(sum_weights, 1.0, rel_tol=1e-3)

def test_api_alerts():
    response = client.get("/api/v1/alerts?limit=10")
    assert response.status_code in [200, 404]
    
    if response.status_code == 200:
        data = response.json()
        assert "alerts" in data
        
        # Test filters
        if len(data["alerts"]) > 0:
            first_alert = data["alerts"][0]
            region = first_alert["region"]
            
            resp2 = client.get(f"/api/v1/alerts?region={region}")
            assert resp2.status_code == 200
            for a in resp2.json()["alerts"]:
                assert a["region"] == region
