"""
Держгеокадастр API (e.land.gov.ua)
Документация: https://wikimap.dzk.gov.ua/wiki/API_%D0%95-%D1%81%D0%B5%D1%80%D0%B2%D1%96%D1%81%D0%B8
OAuth 2.0 + REST API

Шаги для получения доступа:
1. Зарегистрируйтесь на https://e.land.gov.ua
2. Перейдите в "Налаштування API" → "Зареєструвати сервіс"
3. Заполните форму → получите client_id и secret_id
"""

import httpx
import logging
from datetime import datetime, timedelta
from typing import Optional
from app.config import get_settings

logger = logging.getLogger(__name__)

class CadastreService:
    """
    Интеграция с API Держгеокадастру (Публічна кадастрова карта).
    
    Доступные данные по кадастровому номеру:
    - GPS-полигон (границы участка)
    - Целевое назначение
    - Площадь
    - Статус регистрации
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.http = httpx.AsyncClient(timeout=30.0)
        self._access_token: Optional[str] = None
        self._token_expires: Optional[datetime] = None
    
    async def _get_access_token(self) -> str:
        """Получает OAuth 2.0 токен (Client Credentials flow)."""
        if (self._access_token and self._token_expires 
                and datetime.utcnow() < self._token_expires):
            return self._access_token
        
        logger.info("Получаем новый OAuth токен от Держгеокадастру")
        
        response = await self.http.post(
            self.settings.cadastre_token_url,
            data={
                "grant_type": "client_credentials",
                "client_id": self.settings.cadastre_client_id,
                "client_secret": self.settings.cadastre_client_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code != 200:
            raise Exception(
                f"Ошибка авторизации в Держгеокадастр: "
                f"{response.status_code} {response.text}"
            )
        
        token_data = response.json()
        self._access_token = token_data["access_token"]
        expires_in = token_data.get("expires_in", 3600)
        self._token_expires = datetime.utcnow() + timedelta(seconds=expires_in - 60)
        
        return self._access_token
    
    async def get_parcel_by_cadastre_number(self, cadastre_number: str) -> dict:
        """
        Получает данные земельного участка по кадастровому номеру.
        
        Кадастровый номер формата: XXXXXXXXXX:XX:XXX:XXXX
        Пример: 6310138500:10:012:0045
        
        Args:
            cadastre_number: Кадастровый номер поля
        
        Returns:
            dict с полигоном, площадью, целевым назначением
        """
        token = await self._get_access_token()
        
        # Запрос к API кадастра
        # Endpoint взят из публичной документации wikimap.dzk.gov.ua
        url = f"{self.settings.cadastre_api_base}/parcels/{cadastre_number}"
        
        response = await self.http.get(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/json",
                "Accept-Language": "uk",
            }
        )
        
        if response.status_code == 404:
            raise Exception(f"Земельна ділянка {cadastre_number} не знайдена в ДЗК")
        
        if response.status_code != 200:
            raise Exception(
                f"Помилка API кадастру: {response.status_code} {response.text}"
            )
        
        parcel_data = response.json()
        
        # Также можно использовать WFS-сервис ПКК (публичный, без авторизации)
        # для получения геометрии:
        return self._parse_parcel_response(parcel_data, cadastre_number)
    
    async def get_parcel_geometry_wfs(self, cadastre_number: str) -> dict:
        """
        Альтернативный метод: WFS (Web Feature Service) Публічної Кадастрової Карти.
        Работает без авторизации для публичных данных.
        
        Endpoint: https://map.land.gov.ua/geowebcache/service/wfs
        """
        # Кадастровый номер кодируем для WFS-запроса
        encoded_number = cadastre_number.replace(":", "_")
        
        wfs_url = "https://map.land.gov.ua/geowebcache/service/wfs"
        params = {
            "service": "WFS",
            "version": "2.0.0",
            "request": "GetFeature",
            "typeName": "kadastr:parcel",
            "outputFormat": "application/json",
            "CQL_FILTER": f"cadnum='{cadastre_number}'",
            "count": "1",
        }
        
        response = await self.http.get(wfs_url, params=params, timeout=15.0)
        
        if response.status_code != 200:
            # Fallback: используем публичный API ПКК
            return await self._get_parcel_pkk_fallback(cadastre_number)
        
        geojson = response.json()
        
        if not geojson.get("features"):
            raise Exception(f"Ділянка {cadastre_number} не знайдена у WFS")
        
        feature = geojson["features"][0]
        return {
            "cadastre_number": cadastre_number,
            "polygon": feature["geometry"],  # GeoJSON Polygon
            "properties": feature["properties"],
            "area_ha": feature["properties"].get("area", 0),
            "purpose": feature["properties"].get("purpose_name", ""),
            "verified": True,
            "source": "WFS_PKK",
        }
    
    async def _get_parcel_pkk_fallback(self, cadastre_number: str) -> dict:
        """
        Fallback через публичный API ПКК.
        Endpoint: https://map.land.gov.ua/kadastrova-karta/find-parcel
        """
        url = "https://map.land.gov.ua/kadastrova-karta/find-parcel"
        
        response = await self.http.get(
            url,
            params={"cadnum": cadastre_number},
            headers={"Accept": "application/json"},
            timeout=15.0,
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "cadastre_number": cadastre_number,
                "polygon": data.get("geometry"),
                "area_ha": data.get("area"),
                "purpose": data.get("purpose"),
                "verified": True,
                "source": "PKK_FALLBACK",
            }
        
        raise Exception(f"Не вдалося отримати дані ділянки: {cadastre_number}")
    
    def _parse_parcel_response(self, data: dict, cadastre_number: str) -> dict:
        """Нормализует ответ API кадастра."""
        return {
            "cadastre_number": cadastre_number,
            "polygon": data.get("geometry"),
            "area_ha": data.get("area"),
            "purpose": data.get("purpose_name"),
            "owner_type": data.get("owner_type"),
            "registration_date": data.get("registration_date"),
            "verified": True,
            "source": "CADASTRE_API_V1",
        }
    
    def verify_parcel_is_agricultural(self, parcel_data: dict) -> bool:
        """
        Проверяет что участок имеет сельскохозяйственное назначение.
        Коды целевого назначения (Класифікатор цільового призначення):
        01.XX - Землі сільськогосподарського призначення
        """
        purpose = parcel_data.get("purpose", "")
        # Украинские с/х земли начинаются с кода 01
        return purpose.startswith("01") or "сільськогосподарськ" in purpose.lower()
    
    async def close(self):
        await self.http.aclose()
