import logging
import time
from dataclasses import dataclass

from redis.asyncio import Redis
from redis.exceptions import RedisError

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RateLimitResult:
    allowed: bool
    limit: int
    remaining: int
    retry_after: int  # seconds until the current window closes


async def check_rate_limit(
    redis: Redis,
    scope: str,
    identity: str,
    limit: int,
    window: int,
) -> RateLimitResult:
    """Fixed-window counter.

    The window index is part of the key, so counters reset by expiring
    rather than by being reset. One INCR + EXPIRE per request, sent in a
    single pipeline so a crash can never leave a key without a TTL.
    """
    now = int(time.time())
    window_index = now // window
    key = f"ratelimit:{scope}:{identity}:{window_index}"

    window_ends_at = (window_index + 1) * window
    retry_after = max(window_ends_at - now, 1)

    try:
        pipe = redis.pipeline()
        pipe.incr(key)
        pipe.expire(key, window)
        current, _ = await pipe.execute()
    except RedisError:
        # Fail open: a cache outage must not take down authentication.
        logger.warning("Rate limit check failed for %s; allowing request", key,
                       exc_info=True)
        return RateLimitResult(
            allowed=True, limit=limit, remaining=limit, retry_after=0
        )

    return RateLimitResult(
        allowed=current <= limit,
        limit=limit,
        remaining=max(limit - current, 0),
        retry_after=retry_after,
    )