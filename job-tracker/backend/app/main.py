from fastapi import FastAPI

app = FastAPI(title="Job Tracker API")

@app.get("/ping")
def ping():
    return {"message": "pong"}