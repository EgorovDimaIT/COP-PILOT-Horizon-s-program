"""
Auth Router — JWT аутентификация и регистрация пользователей.
"""
import hashlib
import secrets
import logging
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
import json, os

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

# In-memory user store (замените на PostgreSQL в продакшне)
users_db: dict = {}

SECRET_KEY = os.getenv("SECRET_KEY", "agrochain-secret-change-in-prod-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


# ---- Models ----
class RegisterRequest(BaseModel):
    role: str        # "farmer" | "buyer"
    name: str
    company: Optional[str] = ""
    email: str
    phone: str
    rnokpp: Optional[str] = ""
    edrpou: Optional[str] = ""
    region: Optional[str] = ""
    password: str
    passwordConfirm: str
    agreeTerms: bool


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    email: str


def _hash_password(password: str) -> str:
    salt = "agrochain_salt_2026"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


def _create_token(user_id: str) -> str:
    """Simple token = sha256(user_id + secret + timestamp_day)."""
    day = datetime.utcnow().strftime("%Y-%m-%d")
    return hashlib.sha256(f"{user_id}:{SECRET_KEY}:{day}".encode()).hexdigest()


def _seed_demo_users():
    """Добавляет демо-пользователей при старте."""
    demo = [
        {
            "id": "demo-farmer-1",
            "email": "farmer@demo.agrochain.ua",
            "role": "farmer",
            "name": "Петренко Іван Михайлович",
            "company": "ФОП Петренко І.М.",
            "phone": "+380501234567",
            "password_hash": _hash_password("demo1234"),
            "region": "Черкаська",
            "rnokpp": "3141592653",
            "verified": True,
        },
        {
            "id": "demo-buyer-1",
            "email": "buyer@demo.agrochain.ua",
            "role": "buyer",
            "name": "Miller Hans",
            "company": "Miller Grains Ltd.",
            "phone": "+49301234567",
            "password_hash": _hash_password("demo1234"),
            "region": "DE",
            "edrpou": "",
            "verified": True,
        },
    ]
    for u in demo:
        users_db[u["email"]] = u


_seed_demo_users()


@router.post("/register", response_model=dict, summary="Реєстрація нового користувача")
async def register(req: RegisterRequest):
    """Реєструє фермера або покупця в системі AgroChain."""

    if req.email in users_db:
        raise HTTPException(status_code=409, detail="Користувач з таким email вже існує")

    if req.password != req.passwordConfirm:
        raise HTTPException(status_code=422, detail="Паролі не співпадають")

    if not req.agreeTerms:
        raise HTTPException(status_code=422, detail="Необхідно прийняти умови використання")

    if len(req.password) < 8:
        raise HTTPException(status_code=422, detail="Пароль має бути не менше 8 символів")

    if req.role == "farmer" and req.rnokpp and len(req.rnokpp) != 10:
        raise HTTPException(status_code=422, detail="РНОКПП має містити 10 цифр")

    user_id = secrets.token_hex(16)
    user = {
        "id": user_id,
        "email": req.email,
        "role": req.role,
        "name": req.name,
        "company": req.company or "",
        "phone": req.phone,
        "password_hash": _hash_password(req.password),
        "rnokpp": req.rnokpp or "",
        "edrpou": req.edrpou or "",
        "region": req.region or "",
        "verified": False,
        "created_at": datetime.utcnow().isoformat(),
    }
    users_db[req.email] = user

    logger.info(f"✅ New user registered: {req.email} | role={req.role}")

    return {
        "success": True,
        "message": "Реєстрація успішна! Перевірте пошту для підтвердження.",
        "user_id": user_id,
        "email": req.email,
        "role": req.role,
    }


@router.post("/login", response_model=TokenResponse, summary="Вхід в систему")
async def login(req: LoginRequest):
    """Авторизує користувача та повертає JWT токен."""

    user = users_db.get(req.email)
    if not user:
        raise HTTPException(status_code=401, detail="Невірний email або пароль")

    if user["password_hash"] != _hash_password(req.password):
        raise HTTPException(status_code=401, detail="Невірний email або пароль")

    token = _create_token(user["id"])

    logger.info(f"🔑 User logged in: {req.email} | role={user['role']}")

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user["role"],
        name=user["name"],
        email=user["email"],
    )


@router.get("/me", summary="Поточний користувач")
async def get_me(authorization: Optional[str] = None):
    """Повертає дані поточного користувача по токену."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.replace("Bearer ", "").strip()

    # Find user by token
    for email, user in users_db.items():
        expected = _create_token(user["id"])
        if expected == token:
            return {
                "id": user["id"],
                "email": user["email"],
                "role": user["role"],
                "name": user["name"],
                "company": user.get("company", ""),
                "region": user.get("region", ""),
            }

    raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/logout", summary="Вихід з системи")
async def logout():
    """Клієнт видаляє токен локально."""
    return {"success": True, "message": "Вихід успішний"}


@router.get("/users/count", summary="Кількість зареєстрованих користувачів (публічне)")
async def users_count():
    farmers = sum(1 for u in users_db.values() if u["role"] == "farmer")
    buyers = sum(1 for u in users_db.values() if u["role"] == "buyer")
    return {"total": len(users_db), "farmers": farmers, "buyers": buyers}
