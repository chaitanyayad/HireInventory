# for reading credentials from env file for postgres ,redis, api keys anything

from pydantic_settings import BaseSettings

class Settings(BaseSettings):#reading from env file instead of validating python code like BaseModel does also for API_KEY SECRET_KEY DATABASE_URL REDIS_URL

    DATABASE_URL: str
    """
    BaseSettings enables reading configuration from environment sources.
    Config tells it which environment sources to use.
    BaseSettings is programmed to look for a nested class named Config.
    """
    class Config: #tell pydanhtic to look for databse_url in env file 
        env_file = ".env"

settings = Settings()