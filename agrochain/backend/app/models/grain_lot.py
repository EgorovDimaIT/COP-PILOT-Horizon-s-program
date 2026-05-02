from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime
import uuid

class LotStatus(str, Enum):
    DRAFT = "DRAFT"
    KEP_SIGNED = "KEP_SIGNED"
    CADASTRE_VERIFIED = "CADASTRE_VERIFIED"
    UKAS_VERIFIED = "UKAS_VERIFIED"
    EXPORT_READY = "EXPORT_READY"      # eFood/Phyto сертификат получен
    IN_TRANSIT = "IN_TRANSIT"          # GPS мониторинг активен
    AT_BORDER = "AT_BORDER"            # eCherha: в очереди
    BORDER_CROSSED = "BORDER_CROSSED"  # eCherha: пересечено
    PAYMENT_RELEASED = "PAYMENT_RELEASED"  # Деньги выплачены

class GrainLot(BaseModel):
    id: str = Field(default_factory=lambda: f"UA-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}")
    farmer_id: str                          # РНОКПП (ИНН) фермера
    farmer_kep_cert_serial: Optional[str]   # Серийный номер КЕП
    cadastre_number: str                    # Кадастровый номер поля
    cadastre_polygon: Optional[List]        # GPS-полигон из кадастра
    
    # Качество
    lab_cert_filename: Optional[str]
    lab_cert_hash_sha256: Optional[str]
    lab_accreditation_number: Optional[str]  # Номер аккредитации лаборатории
    ukas_verified: bool = False
    
    # Фитосанитар
    phyto_cert_number: Optional[str]
    phyto_cert_status: Optional[str]
    
    # Логистика
    truck_plate: Optional[str]
    echerha_queue_id: Optional[str]
    current_gps: Optional[dict] = None
    gps_track: List[dict] = []
    
    # Блокчейн
    solana_tx_registry: Optional[str] = None      # Транзакция регистрации
    solana_tx_escrow: Optional[str] = None       # Транзакция эскроу
    hash_chain: dict = {}                  # Цепочка хэшей
    
    # Платёж
    buyer_wallet: Optional[str] = None
    price_usdc: Optional[float] = None
    
    status: LotStatus = LotStatus.DRAFT
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CreateLotRequest(BaseModel):
    farmer_id: str
    cadastre_number: str
    truck_plate: str
    price_usdc: float
    # КЕП подпись будет передана отдельно как файл

class KepVerificationRequest(BaseModel):
    lot_id: str
    signed_data_base64: str   # PKCS#7 подписанный блок в Base64
    cert_serial: str
