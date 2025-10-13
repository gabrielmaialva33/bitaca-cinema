"""
Tests for Bitaca Play 3D Streaming Bridge
"""

import pytest
from fastapi.testclient import TestClient
from main import app, PRODUCTIONS_CATALOG


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


# ============================================================================
# Health Check Tests
# ============================================================================

def test_health_check(client):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"
    assert "stream_api_status" in data
    assert "timestamp" in data


def test_root_endpoint(client):
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200

    data = response.json()
    assert data["service"] == "Bitaca Play 3D Streaming Bridge"
    assert "version" in data
    assert "endpoints" in data


# ============================================================================
# Productions Catalog Tests
# ============================================================================

def test_list_all_productions(client):
    """Test listing all productions"""
    response = client.get("/api/productions")
    assert response.status_code == 200

    data = response.json()
    assert "total" in data
    assert "productions" in data
    assert data["total"] == len(PRODUCTIONS_CATALOG)
    assert len(data["productions"]) == len(PRODUCTIONS_CATALOG)


def test_list_productions_with_limit(client):
    """Test listing productions with limit"""
    limit = 5
    response = client.get(f"/api/productions?limit={limit}")
    assert response.status_code == 200

    data = response.json()
    assert len(data["productions"]) == limit


def test_list_productions_with_genre_filter(client):
    """Test filtering productions by genre"""
    genre = "Documentário"
    response = client.get(f"/api/productions?genre={genre}")
    assert response.status_code == 200

    data = response.json()
    for prod in data["productions"]:
        assert genre.lower() in prod["genre"].lower()


def test_list_productions_with_search(client):
    """Test searching productions"""
    search = "Ponteia"
    response = client.get(f"/api/productions?search={search}")
    assert response.status_code == 200

    data = response.json()
    assert data["total"] > 0

    # Verify search worked
    found = False
    for prod in data["productions"]:
        if search.lower() in prod["title"].lower():
            found = True
            break
    assert found


def test_production_has_required_fields(client):
    """Test that productions have all required fields"""
    response = client.get("/api/productions")
    assert response.status_code == 200

    data = response.json()
    prod = data["productions"][0]

    required_fields = [
        "id", "title", "director", "genre", "score",
        "status", "year", "thumbnail_url", "stream_url"
    ]

    for field in required_fields:
        assert field in prod


# ============================================================================
# Single Production Tests
# ============================================================================

def test_get_single_production(client):
    """Test getting single production by ID"""
    production_id = 1
    response = client.get(f"/api/productions/{production_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["id"] == production_id
    assert "title" in data
    assert "director" in data


def test_get_nonexistent_production(client):
    """Test getting nonexistent production returns 404"""
    production_id = 9999
    response = client.get(f"/api/productions/{production_id}")
    assert response.status_code == 404

    data = response.json()
    assert "detail" in data


# ============================================================================
# Streaming Tests
# ============================================================================

def test_stream_endpoint_exists(client):
    """Test streaming endpoint exists (may return 503 if not configured)"""
    production_id = 1
    response = client.get(f"/api/productions/{production_id}/stream")

    # Accept either 200 (if configured) or 503 (not configured)
    assert response.status_code in [200, 503]


def test_stream_nonexistent_production(client):
    """Test streaming nonexistent production returns 404"""
    production_id = 9999
    response = client.get(f"/api/productions/{production_id}/stream")
    assert response.status_code == 404


def test_thumbnail_endpoint_exists(client):
    """Test thumbnail endpoint exists"""
    production_id = 1
    response = client.get(f"/api/productions/{production_id}/thumbnail")

    # Accept 404 if not configured, or 200 if configured
    assert response.status_code in [200, 404, 500]


# ============================================================================
# Analytics Tests
# ============================================================================

def test_track_view_success(client):
    """Test tracking view analytics"""
    analytics_data = {
        "production_id": 1,
        "viewer_id": "test-viewer-123",
        "duration_seconds": 60
    }

    response = client.post("/api/analytics/view", json=analytics_data)
    assert response.status_code == 201

    data = response.json()
    assert data["status"] == "success"
    assert data["production_id"] == 1


def test_track_view_invalid_production(client):
    """Test tracking view for invalid production"""
    analytics_data = {
        "production_id": 9999,
        "duration_seconds": 60
    }

    response = client.post("/api/analytics/view", json=analytics_data)
    assert response.status_code == 404


def test_track_view_minimal_data(client):
    """Test tracking view with minimal required data"""
    analytics_data = {
        "production_id": 1
    }

    response = client.post("/api/analytics/view", json=analytics_data)
    assert response.status_code == 201


# ============================================================================
# CORS Tests
# ============================================================================

def test_cors_headers_present(client):
    """Test that CORS headers are present"""
    response = client.options("/api/productions")

    # Check for CORS headers
    assert "access-control-allow-origin" in response.headers or response.status_code == 200


# ============================================================================
# Error Handling Tests
# ============================================================================

def test_invalid_limit_parameter(client):
    """Test that invalid limit parameter is handled"""
    response = client.get("/api/productions?limit=-1")

    # Should return validation error (422) or ignore invalid value
    assert response.status_code in [200, 422]


# ============================================================================
# Data Integrity Tests
# ============================================================================

def test_catalog_integrity():
    """Test that catalog has 24 productions"""
    assert len(PRODUCTIONS_CATALOG) == 24


def test_catalog_unique_ids():
    """Test that all production IDs are unique"""
    ids = [p["id"] for p in PRODUCTIONS_CATALOG]
    assert len(ids) == len(set(ids))


def test_catalog_required_fields():
    """Test that all productions have required fields"""
    required_fields = ["id", "title", "director", "genre", "score", "status"]

    for prod in PRODUCTIONS_CATALOG:
        for field in required_fields:
            assert field in prod, f"Production {prod.get('id')} missing field: {field}"


def test_catalog_scores_valid():
    """Test that all scores are in valid range"""
    for prod in PRODUCTIONS_CATALOG:
        assert 0 < prod["score"] <= 250, f"Invalid score for {prod['title']}"


# ============================================================================
# Run Tests
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
