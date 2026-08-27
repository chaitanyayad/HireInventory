from fastapi import Depends, HTTPException, Request, status
from redis.asyncio import Redis

from app.config import settings
from app.database import get_redis
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.rate_limit_service import check_rate_limit


def _reject(result) -> None:
    raise HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail="Too many requests. Please try again shortly.",
        headers={
            "Retry-After": str(result.retry_after),
            "X-RateLimit-Limit": str(result.limit),
            "X-RateLimit-Remaining": "0",
        },
    )


def _client_identity(request: Request) -> str:
    if settings.TRUST_PROXY_HEADERS:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(scope: str, limit: int | None = None, window: int | None = None):
    effective_limit = limit or settings.REDIS_LIMIT_REQUESTS
    effective_window = window or settings.REDIS_WINDOW_TIME

    async def dependency(request: Request, redis: Redis = Depends(get_redis)) -> None:
        result = await check_rate_limit(
            redis=redis,
            scope=scope,
            identity=_client_identity(request),
            limit=effective_limit,
            window=effective_window,
        )
        if not result.allowed:
            _reject(result)

    return dependency


def rate_limit_user(scope: str, limit: int | None = None, window: int | None = None):
    """Same fixed-window counter, but keyed on the authenticated user id
    instead of the client IP.

    IP is the right key for /auth, where there's no user yet and the thing
    you're stopping is someone hammering the login form. For endpoints that
    eat into the Gemini free-tier quota (the AI ones), the thing you're
    stopping is one account burning the whole app's shared budget — and that
    account can move between IPs, or share one with everybody else behind a
    corporate NAT.
    """
    effective_limit = limit or settings.AI_LIMIT_REQUESTS
    effective_window = window or settings.AI_WINDOW_TIME

    async def dependency(
        current_user: User = Depends(get_current_user),
        redis: Redis = Depends(get_redis),
    ) -> None:
        result = await check_rate_limit(
            redis=redis,
            scope=scope,
            identity=str(current_user.id),
            limit=effective_limit,
            window=effective_window,
        )
        if not result.allowed:
            _reject(result)

    return dependency