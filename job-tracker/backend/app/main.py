
from fastapi import FastAPI
from sqlalchemy import text
from app.database import engine

app = FastAPI(title = "Job Tracker API")

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