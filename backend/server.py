import asyncio
import time
from contextlib import suppress
import httpx
from fastapi import FastAPI, APIRouter, Query, Request, HTTPException
from fastapi.responses import JSONResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# One entry per collection: every field a route filters, sorts or dedupes on. Add the index in the same edit as the query.
INDEXES: dict[str, list[IndexModel]] = {
    "status_checks": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("timestamp", DESCENDING)], name="timestamp_desc"),
    ],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:  # one at a time so a bad spec skips only itself
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:  # never block boot on an index; the log line names what to fix
                logging.getLogger(__name__).error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks(limit: int = Query(20, ge=1, le=100)):
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

TMDB_BASE = "https://api.themoviedb.org/3"
TMDB_IMG = "https://image.tmdb.org/t/p"
_tmdb_cache: dict[str, tuple[float, dict]] = {}
_tmdb_client: httpx.AsyncClient | None = None

TMDB_TTL_DEFAULT = 600  # 10 min for lists/details
TMDB_TTL_BY_PREFIX = {"genre": 86400, "search": 300}


def _tmdb_get_client() -> httpx.AsyncClient:
    global _tmdb_client
    if _tmdb_client is None:
        _tmdb_client = httpx.AsyncClient(timeout=10)
    return _tmdb_client


def _cache_get(key: str, ttl: int):
    hit = _tmdb_cache.get(key)
    if hit and time.time() - hit[0] < ttl:
        return hit[1]
    return None


def _cache_put(key: str, data: dict) -> None:
    if len(_tmdb_cache) > 500:
        _tmdb_cache.pop(next(iter(_tmdb_cache)))
    _tmdb_cache[key] = (time.time(), data)


@api_router.get("/tmdb/img/{size}/{file_path:path}")
async def tmdb_image(size: str, file_path: str):
    if not file_path:
        raise HTTPException(status_code=400, detail="missing image path")
    url = f"{TMDB_IMG}/{size}/{file_path}"
    try:
        res = await _tmdb_get_client().get(url)
    except Exception:
        raise HTTPException(status_code=502, detail="tmdb image unreachable")
    if res.status_code != 200:
        raise HTTPException(status_code=res.status_code, detail="image not found")
    return Response(
        content=res.content,
        media_type=res.headers.get("content-type", "image/jpeg"),
        headers={"Cache-Control": "public, max-age=604800"},
    )


@api_router.get("/tmdb/{path:path}")
async def tmdb_proxy(path: str, request: Request):
    if not request.query_params.get("api_key"):
        raise HTTPException(status_code=400, detail="missing api_key")
    ttl = TMDB_TTL_BY_PREFIX.get(path.split("/")[0], TMDB_TTL_DEFAULT)
    cache_key = f"{path}?{request.query_params}"
    cached = _cache_get(cache_key, ttl)
    if cached is not None:
        return JSONResponse(cached)
    url = f"{TMDB_BASE}/{path}"
    client = _tmdb_get_client()
    try:
        res = await client.get(url, params=dict(request.query_params))
        if res.status_code == 429:
            retry_after = float(res.headers.get("Retry-After", "2"))
            await asyncio.sleep(min(retry_after, 2))
            res = await client.get(url, params=dict(request.query_params))
        res.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail="tmdb error")
    except Exception:
        raise HTTPException(status_code=502, detail="tmdb unreachable")
    data = res.json()
    _cache_put(cache_key, data)
    return JSONResponse(data)


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def start_index_build():
    app.state.index_task = asyncio.create_task(ensure_indexes())  # background: a big index build must not block boot

@app.on_event("shutdown")
async def shutdown_tmdb_client():
    global _tmdb_client
    if _tmdb_client is not None:
        await _tmdb_client.aclose()
        _tmdb_client = None


@app.on_event("shutdown")
async def shutdown_db_client():
    app.state.index_task.cancel()  # stop a build still running before its client closes
    with suppress(asyncio.CancelledError):
        await app.state.index_task
    client.close()