
import asyncio

from fastapi import FastAPI
from sqlalchemy import text
from app.database import engine
from app.database import Base, engine
from app.models import User, JobApplication
from app.routers import auth , application, dashboard, ai
from app.websockets import broker, status_ws


app = FastAPI(title = "Job Tracker API")
app.include_router(auth.router)
app.include_router(application.router)
app.include_router(dashboard.router)
app.include_router(ai.router)
app.include_router(status_ws.router)

# Handle on the background Redis-subscriber task, so shutdown can cancel it.
_ws_listener_task: asyncio.Task | None = None


@app.on_event("startup")
def verify_db_connection():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connected")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")


@app.on_event("startup")
async def start_ws_listener():
    # Runs for the lifetime of the process: subscribes to the Redis channel and
    # forwards events to whichever sockets THIS process happens to hold.
    global _ws_listener_task
    _ws_listener_task = asyncio.create_task(broker.redis_listener())
    # Plain ASCII on purpose — see the note about the emoji prints above;
    # this line has to survive being redirected to a log file.
    print("WebSocket listener started")


@app.on_event("shutdown")
async def stop_ws_listener():
    # Without this the task is killed mid-await and asyncio logs a noisy
    # "Task was destroyed but it is pending!" on every reload.
    if _ws_listener_task is None:
        return
    _ws_listener_task.cancel()
    try:
        await _ws_listener_task
    except asyncio.CancelledError:
        pass

@app.get("/ping")
def ping():
    return {"message": "pong"}

