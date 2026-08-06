# for reading credentials from env file for postgres ,redis, api keys anything

from pydantic_settings import BaseSettings

class Settings(BaseSettings):#reading from env file instead of validating python code like BaseModel does also for API_KEY SECRET_KEY DATABASE_URL REDIS_URL

    DATABASE_URL: str
    JWT_Secret_Key: str 
    JWT_Algorithm : str = "HS256"
    JWT_Expiration_Time: int = 60
    REDIS_URL : str
    REDIS_LIMIT_REQUESTS : int=20
    REDIS_WINDOW_TIME : int = 60
    TRUST_PROXY_HEADERS: bool = False

    # RabbitMQ — where the broker lives and which queue status events go to.
    # %2F is the url-encoded default vhost "/"
    RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672/%2F"
    STATUS_EVENTS_QUEUE: str = "status_events"

    # WebSockets — the Redis pub/sub channel every API process subscribes to,
    # so a status change handled by one worker reaches a socket held by another.
    WS_EVENTS_CHANNEL: str = "ws:status_events"

    # SMTP — used by the notification worker to send emails.
    # EMAILS_ENABLED=False means the worker just prints the email to the
    # console instead of sending it (so you can test without real SMTP creds).
    EMAILS_ENABLED: bool = False
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = ""

    # Claude API — used for AI insights, cover letters, and interview prep.
    ANTHROPIC_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-sonnet-4-20250514"

    """
    BaseSettings enables reading configuration from environment sources.
    Config tells it which environment sources to use.
    BaseSettings is programmed to look for a nested class named Config.
    """
    class Config: #tell pydanhtic to look for databse_url and JWT-secret_key in env file 
        env_file = ".env"

settings = Settings()

"""
or 

# app/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

settings = Settings()
"""