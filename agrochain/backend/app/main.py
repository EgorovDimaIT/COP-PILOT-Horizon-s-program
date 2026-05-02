from fastapi import FastAPI
from app.routers import lots

app = FastAPI(title="AgroChain API", version="1.0.0")

app.include_router(lots.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to AgroChain API"}
