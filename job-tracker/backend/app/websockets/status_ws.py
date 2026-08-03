"""
T15 — The WebSocket endpoint:  ws://localhost:8000/ws/status?token=<JWT>

Connect from a browser tab:

    const ws = new WebSocket(`ws://localhost:8000/ws/status?token=${jwt}`);
    ws.onmessage = (e) => console.log(JSON.parse(e.data));

Then PATCH a status in another tab and watch both tabs print the event.


Why the token is in the QUERY STRING and not a header
-----------------------------------------------------
Everywhere else in this API auth is "Authorization: Bearer <jwt>". Here it
can't be. The browser's native WebSocket constructor takes a URL and nothing
else — there is no API to set request headers on the handshake. So the token
has to ride in the URL.

That has a real cost, and you should be able to name it in an interview:
URLs get written to server access logs, proxy logs and browser history in a
way headers don't. Mitigations, in order of how much they help:
  - short JWT expiry (this project: 60 min) limits the blast radius
  - wss:// in production, so the URL is encrypted on the wire
  - the industry-standard fix is a single-use "ticket": a REST call returns a
    10-second token that is only good for opening one socket. Worth doing if
    this ever goes public; overkill for now.

Note we authenticate BEFORE accept(). An unauthenticated client never gets a
socket at all — Starlette answers the handshake with 403 instead.
"""

import logging

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.websockets.manager import manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websockets"])


def _user_from_token(db: Session, token: str) -> User | None:
    """Same checks as get_current_user, minus the HTTP-specific plumbing.

    We can't reuse get_current_user directly: it depends on HTTPBearer (reads
    a header that doesn't exist here) and raises HTTPException (meaningless on
    a socket — you close with a code, you don't return a status body).
    """
    try:
        payload = jwt.decode(
            token, settings.JWT_Secret_Key, algorithms=[settings.JWT_Algorithm]
        )
    except JWTError:
        return None  # bad signature, or expired

    user_identifier = payload.get("sub")
    if not user_identifier:
        return None

    # A valid token isn't enough — the user may have been deleted since it
    # was issued. Same rule as the REST path.
    return db.query(User).filter(User.id == user_identifier).first()


@router.websocket("/ws/status")
async def status_websocket(
    websocket: WebSocket,
    token: str = Query(..., description="JWT from /auth/login"),
    db: Session = Depends(get_db),
):
    user = _user_from_token(db, token)
    if user is None:
        # 1008 = policy violation. Closing before accept() makes Starlette
        # reject the handshake outright rather than opening then hanging up.
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = str(user.id)
    await manager.connect(user_id, websocket)

    try:
        # Tell the client the socket is live. Without this the frontend can't
        # distinguish "connected" from "connected but the server is wedged".
        await websocket.send_json({"event_type": "connected", "user_id": user_id})

        # This loop is NOT for reading data — the client has nothing to say;
        # all traffic flows server -> client. We await receive because that is
        # how Starlette surfaces the disconnect: when the tab closes,
        # receive_text() raises WebSocketDisconnect and we fall through to
        # cleanup. Without a receive loop the handler would return
        # immediately and the socket would be torn down on the spot.
        while True:
            message = await websocket.receive_text()
            # Application-level heartbeat. Useful because proxies happily kill
            # idle connections after ~60s and the client needs a cheap way to
            # prove the pipe is still open.
            if message == "ping":
                await websocket.send_json({"event_type": "pong"})

    except WebSocketDisconnect:
        pass  # normal: the tab was closed or navigated away
    except Exception:
        logger.exception("WS error for user %s", user_id)
    finally:
        # Must run on EVERY exit path. A socket left in the registry is a slow
        # memory leak, and every future broadcast pays to write to a dead pipe.
        manager.disconnect(user_id, websocket)
