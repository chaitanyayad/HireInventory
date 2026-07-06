# for reading credentials from env file for postgres ,redis, api keys anything

from pydantic_settings import BaseSettings

class Settings(BaseSettings):#reading from env file instead of validating python code like BaseModel does also for API_KEY SECRET_KEY DATABASE_URL REDIS_URL

    DATABASE_URL: str
    JWT_Secret_Key: str 
    JWT_Algorithm : str = "HS256"
    JWT_Expiration_Time: int = 60
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