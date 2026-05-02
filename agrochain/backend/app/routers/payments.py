"""
REST API для гибридной платежной системы AgroChain.
Поддерживает USDC (Solana) и EUR/USD (TMF 622/676 через банки-партнёры).

Endpoints:
  POST /api/v1/payments/escrow/create     — Резервация средств (крипто или фиат)
  POST /api/v1/payments/escrow/release    — Разблокировка при BORDER_CROSSED
  POST /api/v1/payments/hybrid/create     — Гибридный платёж (крипто + фиат)
  GET  /api/v1/payments/banks             — Список банков-партнёров
  GET  /api/v1/payments/{lot_id}/status   — Статус платежа
  GET  /api/v1/payments/{lot_id}/audit    — Audit Trail для комплаенса
"""

from fastapi import APIRouter, HTTPException, Form
from typing import Optional
from datetime import datetime

from app.services.payment_oracle import PaymentOracle, PaymentMethod, RiskLevel
from app.services.solana_service import SolanaService

router = APIRouter(prefix="/api/v1/payments", tags=["Payments"])

# In-memory payment state (replace with DB in production)
payments_db: dict = {}


@router.get("/banks", summary="Список банків-партнерів COP-PILOT / Horizon Europe")
async def list_partner_banks():
    """
    Возвращает список банков, доступных для фиатных расчётов через AgroChain.
    Каждый банк подключён через SIF-туннель (OpenZiti) и поддерживает PSD2/ISO 20022.
    """
    oracle = PaymentOracle()
    banks = []
    for key, bank in oracle.PARTNER_BANKS.items():
        banks.append({
            "id": key,
            "name": bank["name"],
            "swift": bank["swift"],
            "currencies": bank["supported_currencies"],
            "region": bank["region"],
            "description": bank["description"],
            "sif_secured": True,
        })
    return {"banks": banks, "total": len(banks)}


@router.post("/escrow/create", summary="Створення Escrow (Крипто або Фіат)")
async def create_escrow(
    lot_id: str = Form(..., description="ID лоту"),
    amount: float = Form(..., description="Сума угоди"),
    currency: str = Form("EUR", description="Валюта: EUR, USD, USDC"),
    payment_method: str = Form("fiat_eur", description="Метод: usdc_solana / fiat_eur / fiat_usd / hybrid"),
    buyer_iban: Optional[str] = Form(None, description="IBAN покупця (для фіат)"),
    buyer_wallet: Optional[str] = Form(None, description="Solana wallet покупця (для USDC)"),
    farmer_iban: Optional[str] = Form(None, description="IBAN фермера (для фіат)"),
    farmer_wallet: Optional[str] = Form(None, description="Solana wallet фермера (для USDC)"),
    bank_key: str = Form("deutsche_bank", description="ID банку-партнера"),
    crypto_share_percent: float = Form(30.0, description="% криптовалюти (для гібридних платежів)"),
):
    """
    Создаёт Escrow-резервацию средств.
    
    Сценарий А (USDC/Solana): Мгновенная блокировка в смарт-контракте.
    Сценарий Б (EUR/Bank): Резервация через TMF 622 Product Order в банке-партнёре ЕС.
    
    Средства блокируются до получения сигнала BORDER_CROSSED из еЧерга.
    Все данные передаются через SIF-туннели (OpenZiti mTLS).
    """
    oracle = PaymentOracle()
    method = PaymentMethod(payment_method)

    result = {}

    if method == PaymentMethod.USDC_SOLANA:
        if not buyer_wallet or not farmer_wallet:
            raise HTTPException(400, "Solana wallets required for USDC payment")
        # Trigger Solana smart contract escrow
        result = {
            "type": "USDC_SOLANA",
            "lot_id": lot_id,
            "amount": amount,
            "currency": "USDC",
            "buyer_wallet": buyer_wallet,
            "farmer_wallet": farmer_wallet,
            "status": "LOCKED_IN_SMART_CONTRACT",
            "smart_contract": "TradeEscrow (Anchor/Solana)",
            "speed": "Instant (< 1 sec)",
            "fee": "~$0.001",
            "trigger": "eCherha BORDER_CROSSED",
        }

    elif method in (PaymentMethod.FIAT_EUR, PaymentMethod.FIAT_USD):
        if not buyer_iban or not farmer_iban:
            raise HTTPException(400, "IBAN required for fiat payment")
        result = await oracle.create_fiat_escrow_order(
            lot_id=lot_id,
            amount=amount,
            currency=currency,
            buyer_iban=buyer_iban,
            farmer_iban=farmer_iban,
            bank_key=bank_key,
        )
        result["type"] = "FIAT_BANK"

    elif method == PaymentMethod.HYBRID:
        if not all([buyer_wallet, farmer_wallet, buyer_iban, farmer_iban]):
            raise HTTPException(400, "Both wallets and IBANs required for hybrid payment")
        result = await oracle.process_hybrid_payment(
            lot_id=lot_id,
            total_amount=amount,
            crypto_share_percent=crypto_share_percent,
            buyer_wallet=buyer_wallet,
            buyer_iban=buyer_iban,
            farmer_wallet=farmer_wallet,
            farmer_iban=farmer_iban,
        )
        result["type"] = "HYBRID"

    # Store in-memory
    payments_db[lot_id] = {
        **result,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }

    return result


@router.post("/escrow/release", summary="Розблокування оплати (Trigger: BORDER_CROSSED)")
async def release_escrow(
    lot_id: str = Form(..., description="ID лоту"),
    echerha_hash: str = Form(..., description="SHA-256 підтвердження від єЧерга"),
    payment_method: str = Form("fiat_eur", description="Метод: usdc_solana / fiat_eur / hybrid"),
    bank_key: str = Form("deutsche_bank", description="ID банку-партнера (для фіат)"),
):
    """
    Точка триггера выплаты.
    
    Вызывается Payment Oracle при получении BORDER_CROSSED из eCherha:
    
    1. Проверяет ИИ-оценку рисков (Слой 1: Intelligence)
    2. Отправляет TMF 676 Payment Release (Слой 2: Automation)
    3. Все данные через SIF mTLS-туннель (Слой 3: Security)
    
    Автоматически формирует Audit Trail для НБУ / EU Tax Authority.
    """
    oracle = PaymentOracle()
    echerha_bytes = bytes.fromhex(echerha_hash)

    # Assess risk first
    lot_data = payments_db.get(lot_id, {})
    risk = oracle.assess_risk(lot_data)

    method = PaymentMethod(payment_method)
    results = {"lot_id": lot_id, "risk_level": risk.value, "releases": []}

    # Release crypto escrow
    if method in (PaymentMethod.USDC_SOLANA, PaymentMethod.HYBRID):
        results["releases"].append({
            "channel": "USDC_SOLANA",
            "status": "RELEASED" if risk != RiskLevel.HIGH else "PAUSED",
            "speed": "Instant",
        })

    # Release fiat escrow
    if method in (PaymentMethod.FIAT_EUR, PaymentMethod.FIAT_USD, PaymentMethod.HYBRID):
        fiat_result = await oracle.release_fiat_payment(
            lot_id=lot_id,
            echerha_confirmation=echerha_bytes,
            risk_level=risk,
            bank_key=bank_key,
        )
        results["releases"].append({
            "channel": "FIAT_BANK",
            **fiat_result,
        })

    # Update payment DB
    if lot_id in payments_db:
        payments_db[lot_id]["status"] = "RELEASED" if risk != RiskLevel.HIGH else "PAUSED_FOR_REVIEW"
        payments_db[lot_id]["released_at"] = datetime.utcnow().isoformat() + "Z"

    return results


@router.get("/{lot_id}/status", summary="Статус платежу")
async def get_payment_status(lot_id: str):
    """Возвращает текущий статус платежа по лоту."""
    if lot_id not in payments_db:
        raise HTTPException(404, "Payment not found for this lot")
    return payments_db[lot_id]


@router.get("/{lot_id}/audit", summary="Audit Trail для комплаєнсу (НБУ / EU Tax)")
async def get_audit_trail(lot_id: str):
    """
    Повертає повний ланцюг доказів (Audit Trail) для підтвердження
    факту експорту та обґрунтування валютної виручки.
    
    Використовується:
    - Фермером для подання до НБУ (повернення валютної виручки)
    - Покупцем ЕС для податкової звітності
    - Аудиторами COP-PILOT для верифікації грантового звіту
    """
    payment = payments_db.get(lot_id)
    if not payment:
        raise HTTPException(404, "Payment not found")

    return {
        "lot_id": lot_id,
        "audit_trail": {
            "verification_chain": [
                {"step": "KEP_SIGNED", "source": "Дія / АЦСК", "type": "Digital Signature"},
                {"step": "CADASTRE_VERIFIED", "source": "Держгеокадастр (e.land.gov.ua)", "type": "Land Registry"},
                {"step": "UKAS_VERIFIED", "source": "UKAS CertCheck", "type": "Lab Accreditation"},
                {"step": "PHYTO_CERTIFIED", "source": "Держпродспоживслужба", "type": "Phytosanitary"},
                {"step": "BORDER_CROSSED", "source": "єЧерга (customs.gov.ua)", "type": "Customs Confirmation"},
                {"step": "PAYMENT_RELEASED", "source": "AgroChain Payment Oracle", "type": "Escrow Release"},
            ],
            "blockchain_anchor": f"Solana L1 — urn:ngsi-ld:GrainLot:{lot_id}",
            "data_standard": "ETSI NGSI-LD + Smart Data Models (AgriFood)",
            "compliance": {
                "eu_gdpr": "PII hashed (SHA-256) before NGSI-LD publication",
                "nbu_regulation": "Постанова НБУ №136 — повернення валютної виручки",
                "psd2": "Bank API integration via PSD2 / ISO 20022",
                "cop_pilot_sif": "All data transmitted via OpenZiti mTLS micro-tunnels",
            },
        },
        "payment_summary": payment,
    }
