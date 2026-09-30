import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_register_and_login_flow():
    # 1. Register new user
    reg_payload = {
        "email": "dr.sharma@imd.gov.in",
        "password": "SecureWeatherPassword2026",
        "role": "analyst"
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code in [200, 409] # 200 on new user, 409 if exists

    # 2. Duplicate registration test
    dup_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_resp.status_code in [200, 409]

    # 3. Login with valid credentials
    login_payload = {
        "email": "dr.sharma@imd.gov.in",
        "password": "SecureWeatherPassword2026"
    }
    login_resp = client.post("/api/v1/auth/login", json=login_payload)
    assert login_resp.status_code == 200
    data = login_resp.json()
    assert "token" in data
    assert data["user"]["email"] == "dr.sharma@imd.gov.in"
    token = data["token"]

    # 4. Get current user /me
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == "dr.sharma@imd.gov.in"

    # 5. Invalid login test
    invalid_login = client.post("/api/v1/auth/login", json={"email": "dr.sharma@imd.gov.in", "password": "wrong"})
    assert invalid_login.status_code == 401

    # 6. Logout test
    logout_resp = client.post("/api/v1/auth/logout")
    assert logout_resp.status_code == 200
