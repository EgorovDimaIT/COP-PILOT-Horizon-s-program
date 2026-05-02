from fastapi import FastAPI
from app.routers import lots, payments

app = FastAPI(
    title="AgroChain Ukraine API",
    version="1.0.0",
    description=(
        "Blockchain-based grain traceability & hybrid payment platform. "
        "COP-PILOT Cluster 3A — AgriTech Transformation & Sustainability."
    ),
)

app.include_router(lots.router)
app.include_router(payments.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to AgroChain API", "docs": "/docs"}
