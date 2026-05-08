from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import lots, payments, auth

app = FastAPI(
    title="AgroChain Ukraine API",
    version="1.0.0",
    description=(
        "Blockchain-based grain traceability & hybrid payment platform. "
        "COP-PILOT Cluster 3A — AgriTech Transformation & Sustainability."
    ),
)

# CORS — дозволяємо frontend та production domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3001",
        "https://agrochain-ukraine.org",
        "https://www.agrochain-ukraine.org",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(lots.router)
app.include_router(payments.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to AgroChain API", "docs": "/docs", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "agrochain-backend", "version": "1.0.0"}

@app.get("/ready")
def readiness_check():
    return {"status": "ready"}

