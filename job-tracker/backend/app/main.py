
from fastapi import FastAPI
from sqlalchemy import text
from app.database import engine
from app.database import Base, engine
from app.models import User, JobApplication
from app.routers import auth , application, dashboard


app = FastAPI(title = "Job Tracker API")
app.include_router(auth.router)
app.include_router(application.router)
app.include_router(dashboard.router)



@app.on_event("startup")
def verify_db_connection():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connected")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")

@app.get("/ping")
def ping():
    return {"message": "pong"}

