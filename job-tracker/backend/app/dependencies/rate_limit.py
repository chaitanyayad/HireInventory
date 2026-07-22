from fastapi import Depends, HTTPException, Request, status
from redis.asyncio import Redis

from app.config import settings
from app.database import get_redis
from app.services.rate_limit_service import check_rate_limit


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
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again shortly.",
                headers={
                    "Retry-After": str(result.retry_after),
                    "X-RateLimit-Limit": str(result.limit),
                    "X-RateLimit-Remaining": "0",
                },
            )

    return dependency