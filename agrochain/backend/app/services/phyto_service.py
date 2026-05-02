"""
Фитосанитарний Контроль України
Правильный сервис: Держпродспоживслужба (DPSS)
Портал: https://consumer.gov.ua
Система сертификации: ISAMIT / TRACES NT (ЕС)

Путь получения API доступа:
1. Обратитесь в Держпродспоживслужбу: https://consumer.gov.ua
2. Для TRACES NT (экспорт в ЕС): https://traces.ec.europa.eu

NOTE: На момент написания — официальный REST API находится в разработке.
Реализуем через:
  a) Веб-форму подачи документов (selenium/playwright)
  b) Email-интеграцию (автоматическая подача)
  c) API-запрос при наличии ключа
"""

import httpx
import logging
from typing import Optional
from datetime import datetime
from app.config import get_settings

logger = logging.getLogger(__name__)

class PhytoService:
    """
    Интеграция с Держпродспоживслужбою для получения
    фитосанитарных сертификатов на экспортируемое зерно.
    
    Для экспорта зерна в ЕС требуется:
    - Фітосанітарний сертифікат (Phytosanitary Certificate)
    - Certificate of Origin
    - Quality Certificate
    
    Статусы сертификата:
    - PENDING: На рассмотрении
    - INSPECTION_SCHEDULED: Назначена проверка
    - APPROVED: Одобрен, лот EXPORT_READY
    - REJECTED: Отказано
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.http = httpx.AsyncClient(
            timeout=30.0,
            headers={"User-Agent": "AgroChain-Ukraine/2.0 (support@agrochain.ua)"}
        )
    
    async def submit_phyto_application(
        self,
        lot_id: str,
        farmer_id: str,
        grain_type: str,  # напр. "wheat", "corn", "sunflower"
        quantity_tons: float,
        destination_country: str,  # напр. "PL", "DE", "IT"
        export_point: str,  # напр. "Ягодин" / "Яготин"
    ) -> dict:
        """
        Подаёт заявку на фитосанитарный сертификат.
        
        В реальной реализации это будет либо:
        1. POST-запрос к API Держпродспоживслужби (когда появится)
        2. Заполнение веб-формы через Playwright
        """
        application_data = {
            "applicant_id": farmer_id,
            "lot_reference": lot_id,
            "commodity_description": f"Зерно ({grain_type})",
            "quantity": quantity_tons,
            "units": "metric_tons",
            "country_of_destination": destination_country,
            "point_of_exit": export_point,
            "application_date": datetime.utcnow().isoformat(),
        }
        
        # Попытка через API (если доступен)
        if self.settings.phyto_api_key:
            try:
                response = await self.http.post(
                    f"{self.settings.phyto_api_base}/phyto/applications",
                    json=application_data,
                    headers={
                        "Authorization": f"Bearer {self.settings.phyto_api_key}",
                        "Content-Type": "application/json",
                    }
                )
                if response.status_code in (200, 201):
                    data = response.json()
                    return {
                        "application_id": data.get("id") or data.get("application_id"),
                        "status": "PENDING",
                        "submitted_at": datetime.utcnow().isoformat(),
                        "source": "API",
                    }
            except Exception as e:
                logger.warning(f"Phyto API недоступен: {e}")
        
        # Мануальный режим: создаём задачу в системе для ручной обработки
        logger.info(f"Phyto заявка для лота {lot_id} создана в ручном режиме")
        
        return {
            "application_id": f"PHYTO-{lot_id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            "status": "PENDING_MANUAL",
            "submitted_at": datetime.utcnow().isoformat(),
            "source": "MANUAL",
            "instructions": (
                "Зверніться до місцевого відділу Держпродспоживслужби. "
                "Портал: https://consumer.gov.ua/services/phyto"
            ),
        }
    
    async def check_certificate_status(self, application_id: str) -> dict:
        """
        Проверяет статус фитосанитарного сертификата.
        
        TRACES NT Integration (для экспорта в ЕС):
        Европейская система TRACES NT доступна через:
        https://webgate.ec.europa.eu/tracesnt/help/Content/A_-_User_guides/API_TRACES_NT.htm
        
        Для прямой интеграции с TRACES NT нужна регистрация
        как competent authority.
        """
        if self.settings.phyto_api_key:
            try:
                response = await self.http.get(
                    f"{self.settings.phyto_api_base}/phyto/applications/{application_id}",
                    headers={"Authorization": f"Bearer {self.settings.phyto_api_key}"}
                )
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "application_id": application_id,
                        "status": data.get("status", "UNKNOWN"),
                        "cert_number": data.get("certificate_number"),
                        "valid_until": data.get("valid_until"),
                        "inspector_name": data.get("inspector_name"),
                        "export_ready": data.get("status") == "APPROVED",
                    }
            except Exception as e:
                logger.warning(f"Ошибка проверки статуса phyto: {e}")
        
        # Возвращаем статус из локальной БД
        return {
            "application_id": application_id,
            "status": "PENDING_MANUAL",
            "export_ready": False,
        }
    
    async def close(self):
        await self.http.aclose()
