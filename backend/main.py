import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from simulator.ships import tick_ships
from simulator.acoustics import tick_acoustics, trigger_spike, clear_spike
from engine.risk_engine import get_full_state
from data_loader import load_all
from api.datasets import router as datasets_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-load datasets at startup so first request is instant
    load_all()
    task = asyncio.create_task(simulation_loop())
    yield
    task.cancel()


async def simulation_loop():
    while True:
        tick_ships()
        tick_acoustics()
        await asyncio.sleep(1.2)


app = FastAPI(title="AquaSense AI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(datasets_router)


@app.get("/api/state")
def get_state():
    return get_full_state()


@app.post("/api/spike/{zone_id}")
def post_spike(zone_id: str):
    trigger_spike(zone_id)
    asyncio.get_event_loop().call_later(8, lambda: clear_spike(zone_id))
    return {"status": "triggered", "zone": zone_id}


@app.get("/api/health")
def health():
    return {"status": "ok"}
