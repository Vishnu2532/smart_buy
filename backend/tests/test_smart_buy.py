"""Backend tests for SMART BUY - real SerpApi + Gemini."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://live-pricing-hub-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def search_results(session):
    r = session.get(f"{API}/search", params={"q": "iphone 15"}, timeout=60)
    assert r.status_code == 200, r.text
    data = r.json()
    return data


# ---------- Health ----------
def test_health(session):
    r = session.get(f"{API}/health", timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d["serpapi_configured"] is True
    assert d["llm_configured"] is True


# ---------- Search ----------
def test_search_basic(search_results):
    d = search_results
    assert d["count"] > 0
    assert d["source"] == "serpapi_google_shopping"
    assert "retrieved_at" in d
    for p in d["products"]:
        assert p["product_id"]
        assert p["product_name"]
        assert p["currency"] == "INR"


def test_search_short_query(session):
    r = session.get(f"{API}/search", params={"q": "a"}, timeout=15)
    assert r.status_code == 400


def test_search_sort_price_asc(session):
    r = session.get(f"{API}/search", params={"q": "iphone 15", "sort": "price-asc"}, timeout=60)
    assert r.status_code == 200
    prods = r.json()["products"]
    prices = [p["current_price"] for p in prods if p["current_price"] is not None]
    assert prices == sorted(prices)
    # nulls last
    seen_null = False
    for p in prods:
        if p["current_price"] is None:
            seen_null = True
        else:
            assert not seen_null, "Non-null price after null found"


def test_search_filters(session):
    r = session.get(f"{API}/search", params={"q": "iphone 15", "min_price": 50000, "max_price": 100000}, timeout=60)
    assert r.status_code == 200
    for p in r.json()["products"]:
        assert p["current_price"] is None or (50000 <= p["current_price"] <= 100000)


# ---------- Recent products ----------
def test_recent_products(session, search_results):
    r = session.get(f"{API}/recent-products", timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d["count"] > 0


# ---------- Product detail ----------
def test_product_detail(session, search_results):
    pid = search_results["products"][0]["product_id"]
    r = session.get(f"{API}/products/{pid}", timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d["product"]["product_id"] == pid
    assert len(d["price_observations"]) >= 1
    assert d["reviews"] == []
    assert d["deal"]["tone"] == "neutral"
    assert d["deal"]["label"] == "Insufficient history"


def test_product_not_found(session):
    r = session.get(f"{API}/products/does-not-exist", timeout=15)
    assert r.status_code == 404


# ---------- Refresh reviews ----------
def test_refresh_reviews_honest(session, search_results):
    pid = search_results["products"][0]["product_id"]
    r = session.post(f"{API}/products/{pid}/refresh-reviews", timeout=45)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["fetched"] == 0
    assert d["source_unavailable"] is True
    assert d["note"] and len(d["note"]) > 10


# ---------- Analyze reviews ----------
def test_analyze_reviews_insufficient(session, search_results):
    pid = search_results["products"][0]["product_id"]
    r = session.post(f"{API}/analyze-reviews", json={"product_id": pid}, timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert d.get("insufficient") is True
    assert d.get("review_count") == 0


# ---------- Compare (Gemini) ----------
def test_compare_two(session, search_results):
    prods = search_results["products"]
    if len(prods) < 2:
        pytest.skip("Need >=2 products")
    ids = [prods[0]["product_id"], prods[1]["product_id"]]
    r = session.post(f"{API}/compare", json={"product_ids": ids}, timeout=90)
    assert r.status_code == 200, r.text
    d = r.json()
    comp = d["comparison"]
    # Either structured JSON or raw fallback
    assert isinstance(comp, dict)
    if "raw" not in comp:
        assert "verdict" in comp
        assert "pros_a" in comp
        assert "pros_b" in comp


# ---------- Recommend ----------
def test_recommend(session):
    r = session.post(
        f"{API}/recommend",
        json={"requirements": "best noise cancelling headphones under 30000"},
        timeout=120,
    )
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("candidates") and len(d["candidates"]) > 0
    rec = d.get("recommendation") or {}
    assert isinstance(rec, dict)
    # Must have 'why' or 'raw'
    assert "why" in rec or "raw" in rec
