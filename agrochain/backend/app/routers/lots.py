"""
REST API для управления зерновыми лотами.
Полный жизненный цикл: создание → верификация → экспорт → оплата
"""

import hashlib
import base64
import asyncio
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Optional
import aiofiles
import os
from datetime import datetime

from app.models.grain_lot import (
    GrainLot, CreateLotRequest, LotStatus, KepVerificationRequest
)
from app.services.kep_service import KEPService, KEPVerificationError
from app.services.cadastre_service import CadastreService
from app.services.ukas_service import UKASService
from app.services.phyto_service import PhytoService
from app.services.echerha_service import ECherhaService
from app.services.solana_service import SolanaService
from app.ngsi.translator import NGSILDTranslator
from app.config import get_settings

router = APIRouter(prefix="/api/v1/lots", tags=["GrainLots"])

# In-memory storage для MVP (заменить на PostgreSQL)
lots_db: dict[str, GrainLot] = {}

# Dependency injection
def get_kep_service(): return KEPService()
def get_cadastre_service(): return CadastreService()
def get_ukas_service(): return UKASService()
def get_phyto_service(): return PhytoService()
def get_echerha_service(): return ECherhaService()
def get_solana_service(): return SolanaService()
def get_ngsi_translator(): return NGSILDTranslator()


# =============================================
# КРОК 1: Создание лота + КЕП подпись
# =============================================

@router.post("/create", response_model=dict, summary="Крок 1: Створення лоту та підписання КЕП")
async def create_lot(
    farmer_id: str = Form(..., description="РНОКПП фермера (10 цифр)"),
    cadastre_number: str = Form(..., description="Кадастровий номер поля"),
    truck_plate: str = Form(..., description="Номер вантажівки"),
    price_usdc: float = Form(..., description="Ціна в USDC"),
    signed_data_b64: str = Form(..., description="PKCS#7 підпис КЕП в Base64"),
    kep_service: KEPService = Depends(get_kep_service),
    cadastre_service: CadastreService = Depends(get_cadastre_service),
    solana_service: SolanaService = Depends(get_solana_service),
    ngsi: NGSILDTranslator = Depends(get_ngsi_translator),
):
    """
    Создаёт новый зерновой лот.
    
    Шаг 1: Верификация КЕП подписи фермера
    Шаг 2: Получение данных кадастра
    Шаг 3: Запись в Solana GrainLotRegistry
    Шаг 4: Публикация NGSI-LD в COP-PILOT
    
    Для подписания КЕП на фронтенде используйте:
    https://github.com/nicegood/euscp.js (украинская КЕП библиотека)
    """
    settings = get_settings()
    
    # --- Шаг 1: Верификация КЕП ---
    try:
        kep_result = await kep_service.verify_pkcs7_signature(
            signed_data_b64=signed_data_b64,
            expected_rno_kpp=farmer_id,
        )
    except KEPVerificationError as e:
        raise HTTPException(status_code=422, detail=f"КЕП невалідний: {e}")
    
    # --- Шаг 2: Получение данных кадастра ---
    try:
        parcel_data = await cadastre_service.get_parcel_geometry_wfs(cadastre_number)
    except Exception as e:
        raise HTTPException(
            status_code=422, 
            detail=f"Помилка кадастру: {e}"
        )
    
    # Проверяем что это с/х земля
    if not cadastre_service.verify_parcel_is_agricultural(parcel_data):
        raise HTTPException(
            status_code=422,
            detail="Ділянка не є сільськогосподарської призначення"
        )
    
    # --- Создаём объект лота ---
    lot = GrainLot(
        farmer_id=farmer_id,
        farmer_kep_cert_serial=kep_result["cert_serial"],
        cadastre_number=cadastre_number,
        cadastre_polygon=parcel_data.get("polygon"),
        truck_plate=truck_plate,
        price_usdc=price_usdc,
        status=LotStatus.CADASTRE_VERIFIED,
    )
    
    # --- Вычисляем хэши для цепочки ---
    kep_hash_bytes = bytes.fromhex(
        hashlib.sha256(signed_data_b64.encode()).hexdigest()
    )
    cadastre_hash_bytes = bytes.fromhex(
        hashlib.sha256(str(parcel_data).encode()).hexdigest()
    )
    
    lot.hash_chain = {
        "kep": hashlib.sha256(signed_data_b64.encode()).hexdigest(),
        "cadastre": hashlib.sha256(str(parcel_data).encode()).hexdigest(),
    }
    
    # --- Шаг 3: Запись в Solana ---
    try:
        tx_hash = await solana_service.register_grain_lot(
            lot_id=lot.id,
            kep_hash=kep_hash_bytes,
            cadastre_hash=cadastre_hash_bytes,
            farmer_rno_kpp=farmer_id,
            cadastre_number=cadastre_number,
        )
        lot.solana_tx_registry = tx_hash
        lot.status = LotStatus.KEP_SIGNED
    except Exception as e:
        # Логируем, но не блокируем (блокчейн может быть временно недоступен)
        import logging
        logging.getLogger(__name__).warning(f"Solana запис не вдався: {e}")
    
    # --- Сохраняем лот ---
    lots_db[lot.id] = lot
    
    # --- Шаг 4: Публикуем в NGSI-LD ---
    ngsi_entity = ngsi.grain_lot_to_ngsi_ld(lot)
    await ngsi.push_to_context_broker(ngsi_entity)
    
    return {
        "lot_id": lot.id,
        "status": lot.status.value,
        "kep_verified": kep_result,
        "cadastre_data": parcel_data,
        "solana_tx": lot.solana_tx_registry,
        "ngsi_ld_id": ngsi_entity["id"],
        "message": "Лот успішно створено та зареєстровано в Solana",
    }


# =============================================
# КРОК 2: Загрузка лабораторного сертификата + UKAS
# =============================================

@router.post("/{lot_id}/lab-certificate", summary="Крок 2: Верифікація лабораторного сертифікату через UKAS")
async def upload_lab_certificate(
    lot_id: str,
    cert_file: UploadFile = File(..., description="PDF сертифікат лабораторії"),
    accreditation_number: str = Form(..., description="Номер акредитації UKAS (напр. '8015')"),
    ukas_service: UKASService = Depends(get_ukas_service),
    solana_service: SolanaService = Depends(get_solana_service),
):
    """
    Загружает PDF сертификат качества и верифицирует лабораторию через UKAS CertCheck.
    
    UKAS CertCheck: https://certcheck.ukas.com
    Поиск по номеру аккредитации (не номеру сертификата лаборатории!).
    
    Номер аккредитации UKAS для украинских лабораторий, работающих с ЕС:
    Ищите на: https://www.ukas.com/find-an-organisation/
    """
    if lot_id not in lots_db:
        raise HTTPException(status_code=404, detail="Лот не знайдено")
    
    lot = lots_db[lot_id]
    
    # Сохраняем PDF
    upload_dir = f"/tmp/agrochain/certs/{lot_id}"
    os.makedirs(upload_dir, exist_ok=True)
    cert_path = f"{upload_dir}/lab_cert.pdf"
    
    async with aiofiles.open(cert_path, "wb") as f:
        content = await cert_file.read()
        await f.write(content)
    
    # Верифицируем через UKAS
    ukas_result = await ukas_service.verify_pdf_lab_cert(
        pdf_path=cert_path,
        expected_cert_number=accreditation_number,
    )
    
    # Обновляем лот
    lot.lab_cert_filename = cert_file.filename
    lot.lab_cert_hash_sha256 = ukas_result["pdf_sha256"]
    lot.lab_accreditation_number = accreditation_number
    lot.ukas_verified = ukas_result["ukas_verified"]
    
    if ukas_result["ukas_verified"]:
        lot.status = LotStatus.UKAS_VERIFIED
        lot.hash_chain["ukas"] = ukas_result["pdf_sha256"]
        
        # Обновляем Solana
        ukas_hash_bytes = bytes.fromhex(ukas_result["pdf_sha256"])
        try:
            await solana_service.add_ukas_verification(
                lot_id=lot_id,
                ukas_hash=ukas_hash_bytes,
                lab_cert_number=accreditation_number,
                lab_name=ukas_result.get("lab_name", ""),
            )
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Solana UKAS update failed: {e}")
    
    return {
        "lot_id": lot_id,
        "ukas_verified": ukas_result["ukas_verified"],
        "ukas_status": ukas_result.get("ukas_status"),
        "lab_name": ukas_result.get("lab_name"),
        "standards": ukas_result.get("standards", []),
        "pdf_sha256": ukas_result["pdf_sha256"],
        "lot_status": lot.status.value,
        "warning": (
            "UKAS акредитація не підтверджена. Перевірте номер акредитації."
            if not ukas_result["ukas_verified"] else None
        ),
    }


# =============================================
# КРОК 3: Фитосанитарный сертификат
# =============================================

@router.post("/{lot_id}/phyto-certificate", summary="Крок 3: Подача заявки на фітосанітарний сертифікат")
async def request_phyto_certificate(
    lot_id: str,
    grain_type: str = Form(..., description="Тип зерна: wheat/corn/sunflower/barley"),
    quantity_tons: float = Form(..., description="Кількість тонн"),
    destination_country: str = Form(..., description="Країна призначення (ISO): PL/DE/IT/..."),
    export_point: str = Form("Ягодин", description="Пункт пропуску"),
    phyto_service: PhytoService = Depends(get_phyto_service),
):
    """
    Подаёт заявку на фитосанитарный сертификат.
    
    Інтеграція: Держпродспоживслужба
    Портал: https://consumer.gov.ua/services/phyto
    
    Для EU-экспорта также нужна TRACES NT нотификация.
    TRACES NT: https://traces.ec.europa.eu
    """
    if lot_id not in lots_db:
        raise HTTPException(status_code=404, detail="Лот не знайдено")
    
    lot = lots_db[lot_id]
    
    if lot.status not in (LotStatus.UKAS_VERIFIED, LotStatus.CADASTRE_VERIFIED):
        raise HTTPException(
            status_code=422,
            detail=f"Неможливо подати заявку на фіто зі статусом {lot.status.value}"
        )
    
    result = await phyto_service.submit_phyto_application(
        lot_id=lot_id,
        farmer_id=lot.farmer_id,
        grain_type=grain_type,
        quantity_tons=quantity_tons,
        destination_country=destination_country,
        export_point=export_point,
    )
    
    lot.phyto_cert_number = result.get("application_id")
    lot.phyto_cert_status = result.get("status")
    
    return {
        "lot_id": lot_id,
        **result,
        "next_step": "Очікуйте підтвердження від Держпродспоживслужби (1-3 робочих дні)"
    }


@router.post("/{lot_id}/phyto-certificate/confirm", summary="Підтвердження фітосанітарного сертифікату")
async def confirm_phyto_certificate(
    lot_id: str,
    cert_number: str = Form(..., description="Номер виданого сертифікату"),
    solana_service: SolanaService = Depends(get_solana_service),
    ngsi: NGSILDTranslator = Depends(get_ngsi_translator),
):
    """
    Подтверждает получение фитосанитарного сертификата.
    Переводит лот в статус EXPORT_READY.
    Может вызвать инспектор или интеграция через вебхук.
    """
    if lot_id not in lots_db:
        raise HTTPException(status_code=404, detail="Лот не знайдено")
    
    lot = lots_db[lot_id]
    lot.phyto_cert_number = cert_number
    lot.phyto_cert_status = "APPROVED"
    lot.status = LotStatus.EXPORT_READY
    
    # Хэш фитосанитарного сертификата
    phyto_hash = hashlib.sha256(cert_number.encode()).digest()
    lot.hash_chain["phyto"] = phyto_hash.hex()
    
    # Обновляем Solana
    try:
        await solana_service.add_phyto_certification(
            lot_id=lot_id,
            phyto_hash=phyto_hash,
            phyto_cert_number=cert_number,
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Solana phyto update failed: {e}")
    
    # Обновляем NGSI-LD
    ngsi_entity = ngsi.grain_lot_to_ngsi_ld(lot)
    await ngsi.push_to_context_broker(ngsi_entity)
    
    return {
        "lot_id": lot_id,
        "status": "EXPORT_READY",
        "phyto_cert_number": cert_number,
        "message": "Лот готовий до експорту! Покупець може вносити оплату в ескроу.",
    }


# =============================================
# КРОК 4: Старт мониторинга GPS + eCherha
# =============================================

@router.post("/{lot_id}/start-transit", summary="Крок 4: Старт транзиту (GPS + eCherha моніторинг)")
async def start_transit(
    lot_id: str,
    checkpoint_id: int = Form(1, description="ID КПП (1=Ягодин, 2=Краківець...)"),
    echerha_queue_id: Optional[str] = Form(None, description="ID черги в eCherha"),
    echerha_service: ECherhaService = Depends(get_echerha_service),
    ngsi: NGSILDTranslator = Depends(get_ngsi_translator),
):
    """
    Запускает GPS мониторинг и eCherha наблюдение.
    
    После этого:
    - Водитель должен включить мобильное приложение AgroChain
    - Смартфон начнёт отправлять GPS через MQTT
    - Система будет опрашивать eCherha каждые 2 минуты
    """
    if lot_id not in lots_db:
        raise HTTPException(status_code=404, detail="Лот не знайдено")
    
    lot = lots_db[lot_id]
    
    if lot.status != LotStatus.EXPORT_READY:
        raise HTTPException(
            status_code=422,
            detail=f"Лот не EXPORT_READY. Поточний статус: {lot.status.value}"
        )
    
    lot.status = LotStatus.IN_TRANSIT
    lot.echerha_queue_id = echerha_queue_id
    
    # Запускаем фоновый мониторинг eCherha
    async def on_border_crossed(status: dict):
        """Callback при пересечении границы."""
        await handle_border_crossing(lot_id, status)
    
    # Создаём фоновую задачу
    asyncio.create_task(
        echerha_service.monitor_truck_until_crossing(
            truck_plate=lot.truck_plate,
            callback=on_border_crossed,
            poll_interval_seconds=120,
        )
    )
    
    # Получаем текущую нагрузку на КПП
    workload = await echerha_service.get_checkpoint_workload(checkpoint_id)
    
    # Обновляем NGSI-LD
    ngsi_entity = ngsi.grain_lot_to_ngsi_ld(lot)
    await ngsi.push_to_context_broker(ngsi_entity)
    
    return {
        "lot_id": lot_id,
        "status": "IN_TRANSIT",
        "checkpoint_workload": workload,
        "mqtt_topic": f"agrochain/gps/{lot_id}/{lot.truck_plate}",
        "mqtt_instructions": (
            "Водій повинен запустити AgroChain Driver App та "
            f"підключитися до MQTT топіку: agrochain/gps/{lot_id}/{lot.truck_plate}"
        ),
        "echerha_monitoring": "Активний. Опитування кожні 2 хвилини.",
    }


async def handle_border_crossing(lot_id: str, echerha_status: dict):
    """
    Обработчик события пересечения границы.
    Вызывается из фонового мониторинга eCherha.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    if lot_id not in lots_db:
        return
    
    lot = lots_db[lot_id]
    lot.status = LotStatus.BORDER_CROSSED
    
    # Хэш подтверждения eCherha
    echerha_confirmation = hashlib.sha256(
        str(echerha_status).encode()
    ).digest()
    lot.hash_chain["echerha"] = echerha_confirmation.hex()
    
    logger.info(f"🎉 BORDER CROSSED: Лот {lot_id}, хэш: {echerha_confirmation.hex()}")
    
    # Обновляем Solana
    solana = SolanaService()
    try:
        await solana.confirm_border_crossing(
            lot_id=lot_id,
            echerha_hash=echerha_confirmation,
            crossed_at=int(
                datetime.fromisoformat(
                    echerha_status.get("crossed_at", datetime.utcnow().isoformat())
                ).timestamp()
            ),
            checkpoint_id=echerha_status.get("checkpoint_id", 1),
        )
        
        # Триггерим релиз эскроу
        if lot.solana_tx_escrow:
            await solana.release_escrow_payment(
                lot_id=lot_id,
                echerha_confirmation=echerha_confirmation,
            )
            lot.status = LotStatus.PAYMENT_RELEASED
            logger.info(f"💰 PAYMENT RELEASED: Лот {lot_id}")
            
    except Exception as e:
        logger.error(f"Помилка Solana при crossing: {e}")
    
    # Обновляем NGSI-LD
    translator = NGSILDTranslator()
    ngsi_entity = translator.grain_lot_to_ngsi_ld(lot)
    await translator.push_to_context_broker(ngsi_entity)


# =============================================
# GET: Получить статус лота
# =============================================

@router.get("/{lot_id}", summary="Отримати деталі лоту")
async def get_lot(lot_id: str):
    if lot_id not in lots_db:
        raise HTTPException(status_code=404, detail="Лот не знайдено")
    
    lot = lots_db[lot_id]
    return {
        "lot_id": lot.id,
        "status": lot.status.value,
        "farmer_id": lot.farmer_id[:3] + "***" + lot.farmer_id[-2:],  # Маскуємо ІНН
        "cadastre_number": lot.cadastre_number,
        "ukas_verified": lot.ukas_verified,
        "phyto_cert_number": lot.phyto_cert_number,
        "truck_plate": lot.truck_plate,
        "price_usdc": lot.price_usdc,
        "solana_tx": lot.solana_tx_registry,
        "hash_chain": lot.hash_chain,
        "current_gps": lot.current_gps,
        "created_at": lot.created_at.isoformat(),
        "updated_at": lot.updated_at.isoformat(),
    }


@router.get("/{lot_id}/ngsi-ld", summary="Отримати NGSI-LD представлення лоту")
async def get_lot_ngsi_ld(
    lot_id: str,
    ngsi: NGSILDTranslator = Depends(get_ngsi_translator),
):
    """Возвращает NGSI-LD Entity для COP-PILOT интеграции."""
    if lot_id not in lots_db:
        raise HTTPException(status_code=404, detail="Лот не знайдено")
    
    entity = ngsi.grain_lot_to_ngsi_ld(lots_db[lot_id])
    return JSONResponse(
        content=entity,
        media_type="application/ld+json",
    )


@router.get("/", summary="Список всіх лотів (для Business Portal)")
async def list_lots(
    status: Optional[str] = None,
    ukas_verified: Optional[bool] = None,
):
    """
    Список лотов для покупателей в COP-PILOT Business Portal.
    Поддерживает фильтрацию.
    """
    result = []
    for lot in lots_db.values():
        if status and lot.status.value != status:
            continue
        if ukas_verified is not None and lot.ukas_verified != ukas_verified:
            continue
        result.append({
            "lot_id": lot.id,
            "status": lot.status.value,
            "cadastre_number": lot.cadastre_number,
            "ukas_verified": lot.ukas_verified,
            "price_usdc": lot.price_usdc,
            "truck_plate": lot.truck_plate,
        })
    
    return {"lots": result, "total": len(result)}
