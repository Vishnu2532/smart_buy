"""SMART BUY backend.

Zero-fake-data mandate:
- All product listings originate from SerpApi Google Shopping.
- All reviews originate from SerpApi Google Product API.
- Gemini (via Emergent LLM Key) only ANALYZES supplied real data; it never invents products or reviews.
- Every field that isn't present in the upstream response is stored/returned as null.
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("smart_buy")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
SERPAPI_KEY = os.environ.get("SERPAPI_KEY", "").strip()
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "").strip()

SERP_URL = "https://serpapi.com/search"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="SMART BUY API")
api = APIRouter(prefix="/api")


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------
def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def to_float(value: Any) -> Optional[float]:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        try:
            # Strip currency symbols / commas
            cleaned = "".join(ch for ch in str(value) if ch.isdigit() or ch == ".")
            return float(cleaned) if cleaned else None
        except (TypeError, ValueError):
            return None


def to_int(value: Any) -> Optional[int]:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        try:
            cleaned = "".join(ch for ch in str(value) if ch.isdigit())
            return int(cleaned) if cleaned else None
        except (TypeError, ValueError):
            return None


def normalize_shopping_item(item: dict) -> dict:
    """Normalize one SerpApi shopping_results entry. Never fabricate missing fields."""
    pid = item.get("product_id")
    pid = str(pid) if pid is not None else None
    title = item.get("title") or ""
    return {
        "product_id": pid,
        "external_id": pid,
        "product_name": title or None,
        "brand": None,  # Do not infer brand from title (heuristics are unreliable)
        "current_price": to_float(item.get("extracted_price")),
        "original_price": to_float(item.get("extracted_old_price")),
        "currency": "INR",
        "seller": item.get("source") or None,
        "rating": to_float(item.get("rating")),
        "review_count": to_int(item.get("reviews")),
        "product_url": item.get("product_link") or item.get("link") or None,
        "seller_url": item.get("link") or None,
        "image": item.get("thumbnail") or None,
        "delivery": item.get("delivery") or None,
        "availability": item.get("second_hand_condition") or item.get("stock") or None,
        "source": "serpapi_google_shopping",
        "retrieved_at": utcnow_iso(),
    }


async def record_price_observation(product: dict) -> None:
    """Store a real price observation for later price-history charting. De-duplicate identical
    consecutive observations recorded within the same minute."""
    pid = product.get("product_id")
    price = product.get("current_price")
    if not pid or price is None:
        return
    now_iso = utcnow_iso()
    # Dedup: skip if last observation for same seller+price is within 60 seconds
    last = await db.price_observations.find_one(
        {"product_id": pid, "seller": product.get("seller"), "price": price},
        sort=[("recorded_at", -1)],
    )
    if last:
        try:
            last_dt = datetime.fromisoformat(last["recorded_at"])
            if (datetime.now(timezone.utc) - last_dt).total_seconds() < 60:
                return
        except (KeyError, ValueError):
            pass
    await db.price_observations.insert_one(
        {
            "product_id": pid,
            "price": price,
            "currency": product.get("currency") or "INR",
            "seller": product.get("seller"),
            "source": product.get("source"),
            "recorded_at": now_iso,
        }
    )


async def upsert_product(product: dict) -> None:
    pid = product.get("product_id")
    if not pid:
        return
    await db.products.update_one(
        {"product_id": pid},
        {"$set": {**product, "last_seen_at": utcnow_iso()}, "$setOnInsert": {"first_seen_at": utcnow_iso()}},
        upsert=True,
    )


def compute_deal_label(current: Optional[float], observations: list[dict]) -> dict:
    """Deal detection from REAL observations only. No fabricated averages."""
    prices = [o["price"] for o in observations if isinstance(o.get("price"), (int, float))]
    if current is None or len(prices) < 3:
        return {
            "label": "Insufficient history",
            "tone": "neutral",
            "explanation": "Not enough price history to determine whether this is a good deal.",
            "observations": len(prices),
        }
    avg = sum(prices) / len(prices)
    minimum = min(prices)
    if current <= minimum * 1.02:
        return {
            "label": "Great Deal",
            "tone": "positive",
            "explanation": f"Current price is at or near the lowest observed price (₹{minimum:,.0f}).",
            "observations": len(prices),
        }
    if current < avg * 0.98:
        return {
            "label": "Good Price",
            "tone": "positive",
            "explanation": f"Current price is below the observed average (₹{avg:,.0f}).",
            "observations": len(prices),
        }
    if current > avg * 1.05:
        return {
            "label": "Price Above Average",
            "tone": "negative",
            "explanation": f"Current price is above the observed average (₹{avg:,.0f}).",
            "observations": len(prices),
        }
    return {
        "label": "Around Average",
        "tone": "neutral",
        "explanation": f"Current price is close to the observed average (₹{avg:,.0f}).",
        "observations": len(prices),
    }


# ---------------------------------------------------------------------------
# Pydantic request models
# ---------------------------------------------------------------------------
class AnalyzeRequest(BaseModel):
    product_id: str


class CompareRequest(BaseModel):
    product_ids: list[str] = Field(min_length=2, max_length=2)


class RecommendRequest(BaseModel):
    requirements: str = Field(min_length=5, max_length=600)
    query: Optional[str] = Field(default=None, max_length=160)


# ---------------------------------------------------------------------------
# Health & config
# ---------------------------------------------------------------------------
@api.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "serpapi_configured": bool(SERPAPI_KEY),
        "llm_configured": bool(EMERGENT_LLM_KEY),
        "server_time": utcnow_iso(),
    }


# ---------------------------------------------------------------------------
# SerpApi live search
# ---------------------------------------------------------------------------
@api.get("/search")
async def search(q: str, sort: str = "relevance", min_price: Optional[float] = None,
                 max_price: Optional[float] = None, min_rating: Optional[float] = None) -> dict:
    q = (q or "").strip()
    if len(q) < 2:
        raise HTTPException(400, "Query must be at least 2 characters.")
    if not SERPAPI_KEY:
        raise HTTPException(
            503,
            "Live shopping search is not configured. A SerpApi key is required to fetch real product data.",
        )

    params = {
        "engine": "google_shopping",
        "q": q,
        "api_key": SERPAPI_KEY,
        "gl": "in",
        "hl": "en",
        "google_domain": "google.co.in",
        "location": "India",
        "output": "json",
    }
    try:
        async with httpx.AsyncClient(timeout=30) as http:
            r = await http.get(SERP_URL, params=params)
    except httpx.HTTPError as exc:
        logger.exception("SerpApi network failure")
        raise HTTPException(502, f"Live shopping search is temporarily unavailable: {exc}")

    if r.status_code >= 400:
        # SerpApi returns useful JSON error bodies
        try:
            body = r.json()
            msg = body.get("error") or body.get("message") or r.text[:300]
        except ValueError:
            msg = r.text[:300]
        raise HTTPException(502, f"SerpApi error: {msg}")

    data = r.json()
    raw_items = data.get("shopping_results") or []
    products = [normalize_shopping_item(x) for x in raw_items if x.get("product_id")]

    # Apply filters
    if min_price is not None:
        products = [p for p in products if p["current_price"] is not None and p["current_price"] >= min_price]
    if max_price is not None:
        products = [p for p in products if p["current_price"] is not None and p["current_price"] <= max_price]
    if min_rating is not None:
        products = [p for p in products if p["rating"] is not None and p["rating"] >= min_rating]

    # Sort
    if sort == "price-asc":
        products.sort(key=lambda p: (p["current_price"] is None, p["current_price"] or 0))
    elif sort == "price-desc":
        products.sort(key=lambda p: (p["current_price"] is None, -(p["current_price"] or 0)))
    elif sort == "rating":
        products.sort(key=lambda p: (p["rating"] is None, -(p["rating"] or 0)))
    elif sort == "discount":
        def discount(p: dict) -> float:
            cur, orig = p["current_price"], p["original_price"]
            if cur is None or orig is None or orig <= 0:
                return 0.0
            return max(0.0, (orig - cur) / orig)
        products.sort(key=lambda p: -discount(p))

    # Persist snapshot + price observations (real data only)
    retrieved_at = utcnow_iso()
    for p in products:
        await upsert_product(p)
        await record_price_observation(p)
    await db.search_snapshots.insert_one(
        {"query": q, "count": len(products), "retrieved_at": retrieved_at, "item_ids": [p["product_id"] for p in products]}
    )

    return {
        "query": q,
        "count": len(products),
        "products": products,
        "retrieved_at": retrieved_at,
        "source": "serpapi_google_shopping",
    }


# ---------------------------------------------------------------------------
# Product detail
# ---------------------------------------------------------------------------
async def _fetch_reviews_from_serpapi(product_id: str) -> tuple[list[dict], Optional[float], Optional[int], Optional[str]]:
    """Fetch reviews via SerpApi google_product engine. Returns (reviews, agg_rating, agg_count, error_msg)."""
    if not SERPAPI_KEY:
        return [], None, None, "SerpApi key not configured."
    params = {
        "engine": "google_product",
        "product_id": product_id,
        "api_key": SERPAPI_KEY,
        "gl": "in",
        "hl": "en",
        "google_domain": "google.co.in",
        "reviews": "1",
        "output": "json",
    }
    try:
        async with httpx.AsyncClient(timeout=30) as http:
            r = await http.get(SERP_URL, params=params)
    except httpx.HTTPError as exc:
        return [], None, None, f"Network error: {exc}"
    if r.status_code >= 400:
        try:
            body = r.json()
            msg = body.get("error") or r.text[:200]
        except ValueError:
            msg = r.text[:200]
        return [], None, None, f"SerpApi error: {msg}"
    raw = r.json()
    block = (raw.get("reviews_results") or {})
    user_reviews_block = block.get("user_reviews") or {}
    raw_reviews = user_reviews_block.get("review") or block.get("reviews") or []
    reviews: list[dict] = []
    for v in raw_reviews:
        if not isinstance(v, dict):
            continue
        reviews.append({
            "product_id": product_id,
            "reviewer_name": v.get("user") or v.get("name") or None,
            "rating": to_float(v.get("rating")),
            "title": v.get("title") or None,
            "review_text": v.get("snippet") or v.get("content") or None,
            "review_date": v.get("date") or None,
            "source": v.get("source") or "google_shopping",
            "source_url": v.get("link") or None,
            "retrieved_at": utcnow_iso(),
        })
    agg_rating = to_float(block.get("rating"))
    agg_count = to_int(block.get("reviews"))
    return reviews, agg_rating, agg_count, None


@api.get("/products/{product_id}")
async def get_product(product_id: str) -> dict:
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(
            404,
            "No stored data for this product. Run a search on the home page to fetch real data from Google Shopping.",
        )
    observations = await db.price_observations.find(
        {"product_id": product_id}, {"_id": 0}
    ).sort("recorded_at", 1).to_list(500)
    reviews = await db.reviews.find(
        {"product_id": product_id}, {"_id": 0}
    ).sort("retrieved_at", -1).to_list(200)

    deal = compute_deal_label(product.get("current_price"), observations)

    return {
        "product": product,
        "price_observations": observations,
        "reviews": reviews,
        "deal": deal,
        "review_count_stored": len(reviews),
    }


@api.post("/products/{product_id}/refresh-reviews")
async def refresh_reviews(product_id: str) -> dict:
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(404, "Product not found in stored data. Search for it first.")
    reviews, agg_rating, agg_count, err = await _fetch_reviews_from_serpapi(product_id)
    # Replace stored reviews for this product with the fresh, real set
    if reviews:
        await db.reviews.delete_many({"product_id": product_id})
        await db.reviews.insert_many(reviews)
    # Update aggregate rating/count if provider actually reports them
    updates: dict[str, Any] = {}
    if agg_rating is not None:
        updates["rating"] = agg_rating
    if agg_count is not None:
        updates["review_count"] = agg_count
    if updates:
        await db.products.update_one({"product_id": product_id}, {"$set": updates})
    # Honest response about source availability. Google deprecated the public
    # product-page review endpoint (SerpApi 'google_product' is discontinued),
    # so full review text is often unavailable. We never fabricate reviews.
    source_unavailable = False
    friendly_note = None
    if err and not reviews:
        source_unavailable = True
        # Normalize provider message
        friendly_note = (
            "No full-text reviews are currently available for this product from Google Shopping. "
            "SMART BUY refuses to fabricate reviews, so this section stays empty until a real "
            "review source is connected. Aggregate rating and review count (when reported by "
            "Google Shopping) are still shown on the product page."
        )
    return {
        "product_id": product_id,
        "fetched": len(reviews),
        "aggregate_rating": agg_rating,
        "aggregate_review_count": agg_count,
        "source": "serpapi_google_product",
        "source_unavailable": source_unavailable,
        "note": friendly_note,
        "provider_error": err if source_unavailable else None,
        "retrieved_at": utcnow_iso(),
    }


# ---------------------------------------------------------------------------
# Gemini via Emergent LLM key
# ---------------------------------------------------------------------------
GEMINI_SYSTEM = (
    "You are SMART BUY, an India-focused shopping analyst. HARD RULES:\n"
    "- Analyze ONLY the products and reviews supplied in the user message.\n"
    "- Never invent, fabricate, or imply reviews, prices, specifications, or ratings that were not supplied.\n"
    "- If supplied data is insufficient (e.g. fewer than 2 real reviews), say so explicitly and stop.\n"
    "- Prices are in Indian Rupees (INR). Do not convert or estimate.\n"
    "- Return a valid JSON object matching the requested schema. Do not include any prose outside JSON."
)


async def call_gemini_json(prompt: str, schema_hint: str) -> dict:
    if not EMERGENT_LLM_KEY:
        raise HTTPException(503, "AI analysis is not configured (Emergent LLM key missing).")
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
    except Exception as exc:  # noqa: BLE001
        logger.exception("emergentintegrations import failure")
        raise HTTPException(500, f"AI integration unavailable: {exc}")
    try:
        chat = (
            LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"smart-buy-{utcnow_iso()}", system_message=GEMINI_SYSTEM)
            .with_model("gemini", "gemini-2.5-pro")
        )
        message = UserMessage(text=f"{schema_hint}\n\n{prompt}")
        reply = await chat.send_message(message)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Gemini call failed")
        raise HTTPException(502, f"AI analysis failed: {exc}")
    text = reply if isinstance(reply, str) else getattr(reply, "text", str(reply))
    # Strip common ``` fences
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        # remove language tag on first line
        first_newline = cleaned.find("\n")
        if first_newline != -1:
            cleaned = cleaned[first_newline + 1 :]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Return the raw text so callers can decide
        return {"raw": text, "warning": "Model did not return valid JSON."}


@api.post("/analyze-reviews")
async def analyze_reviews(req: AnalyzeRequest) -> dict:
    product = await db.products.find_one({"product_id": req.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(404, "Product not found in stored data.")
    reviews = await db.reviews.find(
        {"product_id": req.product_id, "review_text": {"$ne": None}}, {"_id": 0}
    ).to_list(50)
    if len(reviews) < 2:
        return {
            "insufficient": True,
            "message": "There isn't enough real review data to provide a reliable AI analysis. "
                       "At least 2 real reviews are required.",
            "review_count": len(reviews),
        }
    payload = {
        "product": {
            "name": product.get("product_name"),
            "brand": product.get("brand"),
            "seller": product.get("seller"),
            "rating": product.get("rating"),
            "review_count": product.get("review_count"),
        },
        "reviews": [
            {
                "index": i,
                "rating": r.get("rating"),
                "date": r.get("review_date"),
                "text": r.get("review_text"),
                "source": r.get("source"),
            }
            for i, r in enumerate(reviews)
        ],
    }
    schema = (
        "Return JSON: {\"overall_sentiment\": \"positive|mixed|negative\", "
        "\"summary\": string, "
        "\"positives\": [string], \"negatives\": [string], "
        "\"recurring_concerns\": [string], \"evidence\": [{\"claim\": string, \"review_indexes\": [int]}]}"
    )
    result = await call_gemini_json(json.dumps(payload, default=str), schema)
    doc = {
        "product_id": req.product_id,
        "analysis": result,
        "review_count_analyzed": len(reviews),
        "generated_at": utcnow_iso(),
        "model": "gemini-2.5-pro",
    }
    await db.ai_analyses.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@api.post("/compare")
async def compare_products(req: CompareRequest) -> dict:
    products = await db.products.find(
        {"product_id": {"$in": req.product_ids}}, {"_id": 0}
    ).to_list(2)
    if len(products) != 2:
        raise HTTPException(404, "Both products must exist in stored data.")
    schema = (
        "Return JSON: {\"winner_product_id\": string|null, \"verdict\": string, "
        "\"pros_a\": [string], \"cons_a\": [string], \"pros_b\": [string], \"cons_b\": [string], "
        "\"who_should_buy_a\": string, \"who_should_buy_b\": string, "
        "\"value_for_money\": string, \"insufficient_evidence\": boolean}"
    )
    payload = {"products": products}
    result = await call_gemini_json(json.dumps(payload, default=str), schema)
    return {"comparison": result, "generated_at": utcnow_iso(), "product_ids": req.product_ids}


@api.post("/recommend")
async def recommend(req: RecommendRequest) -> dict:
    # Use the user's search query (or requirements as query) to fetch REAL products
    query = (req.query or req.requirements).strip()[:120]
    try:
        live = await search(q=query, sort="relevance")
    except HTTPException as exc:
        # Propagate configuration/network errors honestly
        raise exc
    products = live["products"][:10]
    if not products:
        return {
            "no_real_products": True,
            "message": "No real products were found for your requirements. Try a different query.",
            "query": query,
        }
    schema = (
        "Return JSON: {\"recommended_product_id\": string, "
        "\"why\": string, \"strengths\": [string], \"weaknesses\": [string], "
        "\"price_assessment\": string, \"who_should_buy\": string, \"who_should_avoid\": string}"
    )
    payload = {
        "user_requirements": req.requirements,
        "products": [
            {
                "product_id": p["product_id"],
                "name": p["product_name"],
                "current_price": p["current_price"],
                "original_price": p["original_price"],
                "seller": p["seller"],
                "rating": p["rating"],
                "review_count": p["review_count"],
            }
            for p in products
        ],
    }
    result = await call_gemini_json(json.dumps(payload, default=str), schema)
    return {
        "recommendation": result,
        "candidates": products,
        "query": query,
        "generated_at": utcnow_iso(),
    }


# ---------------------------------------------------------------------------
# Recent products (real-only, from persisted snapshots)
# ---------------------------------------------------------------------------
@api.get("/recent-products")
async def recent_products(limit: int = 12) -> dict:
    docs = await db.products.find({}, {"_id": 0}).sort("last_seen_at", -1).to_list(min(limit, 30))
    return {"count": len(docs), "products": docs}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client() -> None:
    client.close()
