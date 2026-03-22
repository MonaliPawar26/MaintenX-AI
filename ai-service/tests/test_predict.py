"""Tests for MaintenX AI Service"""
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_predict_high_risk():
    r = client.post("/predict", json={"usage_hours": 9000, "past_failures": 10, "age_months": 100, "last_maintenance_days": 200})
    assert r.status_code == 200
    d = r.json()
    assert d["risk_level"] in ("high", "medium", "low")
    assert 0 <= d["risk_score"] <= 100
    assert d["estimated_failure_days"] >= 1

def test_predict_low_risk():
    r = client.post("/predict", json={"usage_hours": 100, "past_failures": 0, "age_months": 2, "last_maintenance_days": 7})
    assert r.status_code == 200
    assert r.json()["risk_level"] in ("low", "medium")

def test_chat_printer():
    r = client.post("/chat", json={"message": "The printer is jammed and making noise"})
    assert r.status_code == 200
    d = r.json()
    assert d["equipment_hint"] == "Printer"

def test_chat_urgent():
    r = client.post("/chat", json={"message": "CNC machine has totally stopped working — urgent!"})
    assert r.status_code == 200
    assert r.json()["priority"] in ("High", "Critical")

def test_batch_predict():
    r = client.post("/predict/batch", json=[
        {"id": "eq1", "usage_hours": 5000, "past_failures": 5},
        {"id": "eq2", "usage_hours": 200,  "past_failures": 0}
    ])
    assert r.status_code == 200
    assert len(r.json()["data"]) == 2
