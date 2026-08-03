"""
T15 — The Redis pub/sub bridge (cross-process half of the WebSocket layer).

The problem this solves
-----------------------
manager.py holds sockets in ONE process's memory. But in production you don't
run one process:

    uvicorn app.main:app --workers 4

Now imagine the user has a tab open, and that socket landed on worker #3.
A PATCH /applications/{id}/status request gets load-balanced to worker #1.
Worker #1 updates the row and calls manager.send_to_user(...) — and finds
nothing, because worker #1 has never seen that socket. The tab never updates.

The fix: don't send directly. Announce.

    worker #1  ──publish──►  Redis channel "ws:status_events"
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
                worker #1       worker #2       worker #3
                (no sockets)    (no sockets)   (has the socket → sends it)

Every process subscribes to the same channel. When an event lands, each one
tries to deliver it to its own sockets; the process that actually owns the
socket succeeds and the rest no-op. Correct with 1 worker, correct with 40.

Why Redis pub/sub and not RabbitMQ (which we already run)?
    Different job. RabbitMQ is a QUEUE — exactly one consumer gets each
    message, and it's stored durably until acked. That is right for email:
    send it once, never lose it.
    Redis pub/sub is a BROADCAST — every subscriber gets a copy, and if
    nobody is listening the message evaporates. That is right for live UI: a
    user with no tab open doesn't want a backlog of stale "status changed"
    popups replayed at them on login. Fire-and-forget is the correct
    semantic here, not a feature we gave up.

Two clients, on purpose
-----------------------
- publish() is called from ordinary sync service code -> uses the sync client.
- listen() runs inside FastAPI's event loop -> uses the async client, because
  a blocking pubsub.listen() would freeze every request in the process.
Both talk to the same Redis server.
"""

import asyncio
import json
import logging

from app.config import settings
from app.database import redis_client as async_redis  # redis.asyncio client
from app.redis_client import redis_client as sync_redis
from app.websockets.manager import manager

logger = logging.getLogger(__name__)


def publish_event(event: dict) -> None:
    """Announce an event to every API process. Never raises.

    Fail-open, exactly like the RabbitMQ publisher: if Redis is down the user
    should still be able to update their application. They lose the live
    refresh, not the write. A realtime nicety must never break the core API.
    """
    try:
        sync_redis.publish(settings.WS_EVENTS_CHANNEL, json.dumps(event))
    except Exception:
        logger.warning(
            "Could not publish WS event to Redis — live updates may be missed",
            exc_info=True,
        )


async def _consume(pubsub) -> None:
    """Read messages forever and hand each to the local ConnectionManager."""
    async for message in pubsub.listen():
        # listen() also yields subscribe/unsubscribe confirmations — skip those.
        if message.get("type") != "message":
            continue
        try:
            event = json.loads(message["data"])
        except (json.JSONDecodeError, TypeError):
            logger.error("Dropping malformed WS event: %r", message.get("data"))
            continue

        user_id = event.get("user_id")
        if not user_id:
            logger.error("Dropping WS event with no user_id: %r", event)
            continue

        # No-op in processes that don't hold this user's socket.
        await manager.send_to_user(str(user_id), event)


async def redis_listener() -> None:
    """Background task started on app startup; runs for the app's lifetime.

    Wrapped in a retry loop so a Redis restart degrades live updates for a few
    seconds instead of killing them until the next deploy.
    """
    while True:
        pubsub = None
        try:
            pubsub = async_redis.pubsub()
            await pubsub.subscribe(settings.WS_EVENTS_CHANNEL)
            logger.info(
                "WS listener subscribed to '%s'", settings.WS_EVENTS_CHANNEL
            )
            await _consume(pubsub)
        except asyncio.CancelledError:
            # Normal shutdown — let it propagate so the task actually stops.
            logger.info("WS listener stopping")
            raise
        except Exception:
            logger.warning("WS listener lost Redis, retrying in 5s...", exc_info=True)
            await asyncio.sleep(5)
        finally:
            if pubsub is not None:
                try:
                    await pubsub.aclose()
                except Exception:
                    pass
