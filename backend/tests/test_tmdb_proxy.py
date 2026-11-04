import os

import pytest
import requests


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
TMDB_KEY = os.environ.get("REACT_APP_TMDB_KEY", "")


@pytest.mark.skipif(not BASE_URL or not TMDB_KEY, reason="public URL or TMDB key is not configured")
def test_health_and_tmdb_search_proxy():
    health = requests.get(f"{BASE_URL}/api/", timeout=20)
    assert health.status_code == 200
    assert health.json().get("message") == "Hello World"

    response = requests.get(
        f"{BASE_URL}/api/tmdb/search/multi",
        params={"api_key": TMDB_KEY, "query": "anime"},
        timeout=30,
    )
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload.get("results"), list)
    assert payload["results"]


@pytest.mark.skipif(not BASE_URL, reason="public URL is not configured")
def test_image_proxy_success_and_missing_image():
    good = requests.get(
        f"{BASE_URL}/api/tmdb/img/w342/3icyRAqgakNcQn6aDVz9libFmBA.jpg", timeout=30
    )
    assert good.status_code == 200
    assert good.headers.get("content-type", "").startswith("image/")
    assert len(good.content) > 100

    missing = requests.get(
        f"{BASE_URL}/api/tmdb/img/w342/nonexistent123.jpg", timeout=30
    )
    assert missing.status_code != 200


@pytest.mark.skipif(not BASE_URL, reason="public URL is not configured")
def test_tmdb_proxy_rejects_missing_api_key():
    response = requests.get(f"{BASE_URL}/api/tmdb/search/multi", timeout=20)
    assert response.status_code == 400
