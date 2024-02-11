import redis.asyncio
from app.config import Config

redis_cache = redis.asyncio.from_url(Config.REDIS_AUTH_HOST, decode_responses=True, db=1)
