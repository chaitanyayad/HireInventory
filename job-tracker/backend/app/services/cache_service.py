import json
from app.redis_client import redis_client

STATS_TTL :int = 60

def _stats_key(user_id : int) ->str :
    return f"dashboard:stats:user:{user_id}"

def get_cached_stats(user_id : int ) -> dict | None :
    raw = redis_client.get(_stats_key(user_id))
    if raw is None:
        return None
    return json.loads(raw)

def set_cached_stats(user_id: int, stats: dict) -> None:
    redis_client.set(
        _stats_key(user_id),
        json.dumps(stats),
        ex=STATS_TTL,
    )
    
def invalidate_stats(user_id: int) -> None:
    redis_client.delete(_stats_key(user_id))

    