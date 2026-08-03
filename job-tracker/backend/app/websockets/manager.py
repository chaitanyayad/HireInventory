"""
T15 — The connection registry (in-process half of the WebSocket layer).

A WebSocket is a long-lived TCP connection. Unlike a REST request — which
arrives, is answered, and dies — a socket sits open for as long as the tab is
open. So *something* has to remember every open socket, otherwise there is
nobody to push a message to later.

That "something" is this class. It is deliberately dumb: a dict from
user_id -> the set of sockets that user currently has open.

Why a SET and not a single socket?
    One user = many tabs. Open the dashboard in two tabs and you have two
    sockets for one user_id. Both should light up on a status change — that
    is literally the feature ("reflects live across all open tabs").

Why keyed by user and not global?
    Broadcasting every event to everyone would leak one user's job
    applications to every other logged-in user. Events are addressed to the
    user they belong to and nobody else.

IMPORTANT — this registry lives in ONE process's memory.
    If you run uvicorn with 2+ workers, worker A holds some sockets and
    worker B holds others. A status change handled by A must still reach the
    tab attached to B. That cross-process hop is what broker.py solves; this
    file only ever handles the sockets it personally owns.
"""

import logging

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        # user_id (str) -> set of that user's open sockets in THIS process
        self._connections: dict[str, set[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        """Complete the WebSocket handshake and start tracking the socket."""
        await websocket.accept()
        self._connections.setdefault(user_id, set()).add(websocket)
        logger.info(
            "WS connected: user=%s (%d socket(s) for this user here)",
            user_id, len(self._connections[user_id]),
        )

    def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        """Stop tracking a socket. Safe to call twice."""
        sockets = self._connections.get(user_id)
        if not sockets:
            return
        sockets.discard(websocket)
        # Drop the empty set so the dict doesn't grow forever with dead users.
        if not sockets:
            del self._connections[user_id]
        logger.info("WS disconnected: user=%s", user_id)

    async def send_to_user(self, user_id: str, message: dict) -> None:
        """Push a JSON message to every socket this user has open here.

        A socket can die between "still in the dict" and "actually writable"
        (laptop lid closed, network dropped) — the OS may not have told us
        yet. So a failed send is normal, not exceptional: we collect the dead
        ones and evict them rather than letting one broken tab take down the
        broadcast for the others.
        """
        sockets = self._connections.get(user_id)
        if not sockets:
            return  # user isn't connected to this process — perfectly normal

        dead: list[WebSocket] = []
        # Iterate a copy: send failures mutate the set via disconnect().
        for websocket in list(sockets):
            try:
                await websocket.send_json(message)
            except Exception:
                dead.append(websocket)

        for websocket in dead:
            self.disconnect(user_id, websocket)

    def connected_users(self) -> int:
        """Number of distinct users with a socket open here (for /ping-style debug)."""
        return len(self._connections)


# One shared instance for the whole process. Both the endpoint (which
# registers sockets) and the Redis listener (which pushes to them) import
# THIS object — two managers would mean the listener talks to an empty dict.
manager = ConnectionManager()
