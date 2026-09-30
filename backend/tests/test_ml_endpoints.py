import sys
import os
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)



def test_root_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model_loaded" in data

def test_ml_health():
    response = client.get("/api/v1/ml/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["model_loaded"] is True
    assert "device" in data

def test_ml_predict_single():
    payload = {
        "variable": "temperature",
        "lead_time_hrs": 48,
        "apply_bias_correction": True,
        "enable_xai": False
    }
    response = client.post("/api/v1/ml/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["variable"] == "temperature"
    assert "conformal_margin" in data
    assert "geojson" in data

def test_ml_predict_batch():
    payload = {
        "requests": [
            {"variable": "temperature", "lead_time_hrs": 24},
            {"variable": "precipitation", "lead_time_hrs": 48}
        ]
    }
    response = client.post("/api/v1/ml/predict/batch", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["total_processed"] == 2
    assert len(data["results"]) == 2

def test_ml_point_forecast():
    response = client.get("/api/v1/ml/forecast/point?lat=28.61&lon=77.20")
    assert response.status_code == 200
    data = response.json()
    assert data["latitude"] == 28.61
    assert data["longitude"] == 77.20
    assert "blended_temperature_c" in data
    assert "blended_precipitation_mm" in data

def test_ml_alerts():
    response = client.get("/api/v1/ml/alerts")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "total_alerts" in data
    assert "summary" in data
    assert "alerts" in data

if __name__ == "__main__":
    print("Running ML API tests...")
    test_root_health()
    print("[PASS] test_root_health passed")
    test_ml_health()
    print("[PASS] test_ml_health passed")
    test_ml_predict_single()
    print("[PASS] test_ml_predict_single passed")
    test_ml_predict_batch()
    print("[PASS] test_ml_predict_batch passed")
    test_ml_point_forecast()
    print("[PASS] test_ml_point_forecast passed")
    test_ml_alerts()
    print("[PASS] test_ml_alerts passed")
    print("All ML API tests passed successfully!")


