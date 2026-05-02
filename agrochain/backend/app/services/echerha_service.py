"""
eCherha API Integration
Офіційний сайт: https://echerha.gov.ua
Публичный endpoint нагрузки: https://echerha.gov.ua/workload/{checkpoint_id}/{direction}

РЕАЛЬНОСТЬ:
- Официального документированного REST API нет
- Сайт использует внутренний API (можно наблюдать в DevTools Network)
- Авторизованные эндпоинты требуют JWT токен от сайта
- Публичные данные (нагрузка на КПП) доступны без авторизации

СТРАТЕГИЯ:
1. Публичные данные о нагрузке — без авторизации
2. Статус конкретного грузовика — требует авторизации
3. Для боевого применения — официальный запрос на интеграцию:
   support@echerha.gov.ua

Нумерация КПП (checkpoint_id):
1 = Ягодин / Yahodyn (UA-PL)
2 = Краківець / Krakivets (UA-PL) 
3 = Шегині / Shehyni (UA-PL)
4 = Рава-Руська / Rava-Ruska (UA-PL)
5 = Устилуг / Ustyluh (UA-PL)
... и другие
"""

import httpx
import logging
import asyncio
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.config import get_settings

logger = logging.getLogger(__name__)

# Справочник КПП
CHECKPOINTS = {
    1:  {"name": "Ягодин",      "border": "UA-PL", "city": "Yahodyn"},
    2:  {"name": "Краківець",   "border": "UA-PL", "city": "Krakivets"},
    3:  {"name": "Шегині",      "border": "UA-PL", "city": "Shehyni"},
    4:  {"name": "Рава-Руська", "border": "UA-PL", "city": "Rava-Ruska"},
    5:  {"name": "Устилуг",     "border": "UA-PL", "city": "Ustyluh"},
    6:  {"name": "Грушів",      "border": "UA-PL", "city": "Hrushiv"},
    7:  {"name": "Угринів",     "border": "UA-PL", "city": "Uhryniv"},
    8:  {"name": "Смільниця",   "border": "UA-SK", "city": "Smilnytsia"},
    9:  {"name": "Ужгород",     "border": "UA-SK", "city": "Uzhhorod"},
    10: {"name": "Чоп",         "border": "UA-HU", "city": "Chop"},
}

# Направления
DIRECTION_EXPORT = 1  # З України
DIRECTION_IMPORT = 2  # В Україну

class ECherhaService:
    """
    Сервис мониторинга статуса грузовиков в системе eCherha.
    
    Используем для:
    1. Получения нагрузки на КПП (публично)
    2. Мониторинга статуса конкретного грузовика (авторизованно)
    3. Триггера смарт-контракта при факте пересечения границы
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.http = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; AgroChain/2.0)",
                "Accept": "application/json, */*",
                "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8",
                "Referer": "https://echerha.gov.ua/",
            },
            follow_redirects=True,
        )
        self._auth_token: Optional[str] = None
    
    async def authenticate(self) -> str:
        """
        Авторизуется в eCherha.
        
        Для получения аккаунта транспортной компании:
        https://echerha.gov.ua/registration
        
        Эндпоинт входа (из анализа сетевых запросов браузера):
        POST https://echerha.gov.ua/api/auth/login
        """
        if self._auth_token:
            return self._auth_token
        
        # Метод 1: Прямой API (анализ XHR через DevTools)
        login_url = f"{self.settings.echerha_api_base}/api/auth/login"
        
        response = await self.http.post(
            login_url,
            json={
                "login": self.settings.echerha_login,
                "password": self.settings.echerha_password,
            },
            headers={"Content-Type": "application/json"},
        )
        
        if response.status_code == 200:
            data = response.json()
            self._auth_token = data.get("token") or data.get("access_token")
            logger.info("eCherha: авторизация успешна")
            return self._auth_token
        
        raise Exception(
            f"eCherha авторизация не удалась: {response.status_code} {response.text}"
        )
    
    async def get_checkpoint_workload(
        self, 
        checkpoint_id: int = 1,
        direction: int = DIRECTION_EXPORT
    ) -> dict:
        """
        Получает данные о нагрузке на КПП (публичные данные).
        
        URL: https://echerha.gov.ua/workload/{checkpoint_id}/{direction}
        
        Args:
            checkpoint_id: ID КПП (1 = Ягодин)
            direction: 1 = экспорт, 2 = импорт
        
        Returns:
            dict с данными о нагрузке и очереди
        """
        url = f"{self.settings.echerha_api_base}/workload/{checkpoint_id}/{direction}"
        
        # Также пробуем JSON API endpoint
        api_url = f"{self.settings.echerha_api_base}/api/workload/{checkpoint_id}/{direction}"
        
        try:
            # Сначала пробуем API endpoint
            response = await self.http.get(api_url)
            
            if response.status_code == 200:
                content_type = response.headers.get("content-type", "")
                if "application/json" in content_type:
                    return response.json()
        except Exception:
            pass
        
        # Fallback: HTML парсинг с публичной страницы
        response = await self.http.get(url)
        
        if response.status_code != 200:
            logger.warning(f"eCherha workload недоступен: {response.status_code}")
            return {"error": "Unavailable", "checkpoint_id": checkpoint_id}
        
        # Парсим HTML если нет JSON
        return self._parse_workload_html(response.text, checkpoint_id, direction)
    
    def _parse_workload_html(
        self, 
        html: str, 
        checkpoint_id: int,
        direction: int
    ) -> dict:
        """Извлекает данные о нагрузке из HTML страницы eCherha."""
        from html.parser import HTMLParser
        import re
        
        # Ищем JSON в HTML (React может рендерить данные через __NEXT_DATA__ или window.__data__)
        json_pattern = re.search(r'window\.__data__\s*=\s*({.+?});', html)
        if json_pattern:
            import json
            try:
                return json.loads(json_pattern.group(1))
            except Exception:
                pass
        
        # Ищем числа в HTML
        trucks_pattern = re.search(r'(\d+)\s+(?:вантажів|автомобілів|trucks)', html)
        
        checkpoint_info = CHECKPOINTS.get(checkpoint_id, {})
        
        return {
            "checkpoint_id": checkpoint_id,
            "checkpoint_name": checkpoint_info.get("name", "Unknown"),
            "direction": "export" if direction == 1 else "import",
            "trucks_in_queue": int(trucks_pattern.group(1)) if trucks_pattern else None,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "html_parse",
        }
    
    async def get_truck_status(self, truck_plate: str) -> dict:
        """
        Получает текущий статус грузовика в системе eCherha.
        
        Требует авторизации транспортной компании.
        
        Args:
            truck_plate: Номер грузовика (напр. "АА1234ВВ")
        
        Returns:
            dict со статусом: queue_position, checkpoint, estimated_time, 
                             border_crossed (True/False), crossed_at (timestamp)
        """
        try:
            token = await self.authenticate()
        except Exception as e:
            logger.error(f"Не удалось авторизоваться в eCherha: {e}")
            return {"error": str(e), "truck_plate": truck_plate}
        
        # Запрос статуса грузовика
        # Endpoint из анализа API (может требовать уточнения):
        endpoints_to_try = [
            f"/api/vehicles/{truck_plate}/status",
            f"/api/queue/vehicle/{truck_plate}",
            f"/api/trucks/status?plate={truck_plate}",
        ]
        
        for endpoint in endpoints_to_try:
            try:
                response = await self.http.get(
                    f"{self.settings.echerha_api_base}{endpoint}",
                    headers={"Authorization": f"Bearer {token}"},
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return self._normalize_truck_status(data, truck_plate)
                    
            except Exception as e:
                logger.debug(f"Endpoint {endpoint} failed: {e}")
                continue
        
        # Если все эндпоинты не сработали
        logger.warning(f"Не удалось получить статус грузовика {truck_plate} из eCherha")
        return {
            "truck_plate": truck_plate,
            "status": "UNKNOWN",
            "border_crossed": False,
            "source": "not_available",
            "note": "Свяжитесь с support@echerha.gov.ua для API доступа",
        }
    
    def _normalize_truck_status(self, data: dict, truck_plate: str) -> dict:
        """Нормализует ответ API к стандартному формату AgroChain."""
        
        # Маппинг украинских статусов eCherha
        status_map = {
            "В очереди":        "IN_QUEUE",
            "Очікує":           "WAITING",
            "На KPP":           "AT_CHECKPOINT",
            "Проходить митний": "CUSTOMS_INSPECTION",
            "Перетнув кордон":  "BORDER_CROSSED",
            "Completed":        "BORDER_CROSSED",
            "crossed":          "BORDER_CROSSED",
        }
        
        raw_status = data.get("status", data.get("state", ""))
        normalized_status = status_map.get(raw_status, raw_status.upper())
        
        return {
            "truck_plate": truck_plate,
            "queue_id": data.get("queue_id") or data.get("id"),
            "status": normalized_status,
            "checkpoint_id": data.get("checkpoint_id") or data.get("crossing_id"),
            "checkpoint_name": data.get("checkpoint_name", ""),
            "queue_position": data.get("position") or data.get("queue_position"),
            "estimated_crossing_time": data.get("estimated_time"),
            "border_crossed": normalized_status == "BORDER_CROSSED",
            "crossed_at": data.get("crossed_at") or data.get("completion_time"),
            "cargo_type": data.get("cargo_type"),
            "raw": data,  # Сохраняем оригинал для отладки
        }
    
    async def monitor_truck_until_crossing(
        self,
        truck_plate: str,
        callback,  # async callable(truck_status: dict)
        poll_interval_seconds: int = 120,  # 2 минуты
        max_polls: int = 500,  # ~16 часов максимум
    ) -> None:
        """
        Мониторит грузовик до момента пересечения границы.
        При пересечении вызывает callback (для триггера смарт-контракта).
        
        Args:
            truck_plate: Номер грузовика
            callback: Async функция, вызываемая при пересечении
            poll_interval_seconds: Интервал опроса
            max_polls: Максимальное количество запросов
        """
        logger.info(f"Начинаем мониторинг eCherha для грузовика {truck_plate}")
        
        for i in range(max_polls):
            try:
                status = await self.get_truck_status(truck_plate)
                
                logger.debug(
                    f"eCherha [{i+1}/{max_polls}] {truck_plate}: {status.get('status')}"
                )
                
                if status.get("border_crossed"):
                    logger.info(
                        f"🎉 Грузовик {truck_plate} пересёк границу! "
                        f"Время: {status.get('crossed_at')}"
                    )
                    await callback(status)
                    return
                
                # Пауза между запросами
                await asyncio.sleep(poll_interval_seconds)
                
            except Exception as e:
                logger.error(f"Ошибка мониторинга eCherha: {e}")
                await asyncio.sleep(poll_interval_seconds * 2)  # Увеличиваем паузу
        
        logger.warning(f"Мониторинг {truck_plate} завершён по таймауту")
    
    async def close(self):
        await self.http.aclose()
