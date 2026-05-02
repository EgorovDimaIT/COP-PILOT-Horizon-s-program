"""
NGSI-LD Транслятор для COP-PILOT
Стандарт: ETSI GS CIM 009 (NGSI-LD)
Context Broker: FIWARE Orion-LD

Документация:
- NGSI-LD Spec: https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/
- FIWARE: https://fiware-orion.readthedocs.io/en/master/
- Smart Data Models: https://smartdatamodels.org/
"""

from typing import Any, Optional
from datetime import datetime
from app.models.grain_lot import GrainLot, LotStatus

# NGSI-LD Context для AgroChain
# Расширяет базовый FIWARE AgriFood контекст
AGROCHAIN_CONTEXT = [
    "https://uri.fiware.org/ns/data-models/agrifood",  # FIWARE базовый
    "https://schema.org/",
    {
        # Кастомные термины AgroChain
        "GrainLot": "https://agrochain.ua/ontology/GrainLot",
        "kepHash": "https://agrochain.ua/ontology/kepHash",
        "cadastreNumber": "https://agrochain.ua/ontology/cadastreNumber",
        "ukasVerified": "https://agrochain.ua/ontology/ukasVerified",
        "echerhaStatus": "https://agrochain.ua/ontology/echerhaStatus",
        "solanaRegistry": "https://agrochain.ua/ontology/solanaRegistry",
        "chainRootHash": "https://agrochain.ua/ontology/chainRootHash",
        "farmerRnoKpp": "https://agrochain.ua/ontology/farmerRnoKpp",
        "phytoCertNumber": "https://agrochain.ua/ontology/phytoCertNumber",
        "borderCrossedAt": "https://agrochain.ua/ontology/borderCrossedAt",
        "priceUsdc": "https://agrochain.ua/ontology/priceUsdc",
    }
]

class NGSILDTranslator:
    """
    Преобразует внутренние данные GrainLot в стандартный 
    формат NGSI-LD для COP-PILOT Context Broker.
    """
    
    def grain_lot_to_ngsi_ld(self, lot: GrainLot) -> dict:
        """
        Конвертирует объект GrainLot в NGSI-LD Entity.
        
        Пример вывода:
        {
            "@context": [...],
            "id": "urn:ngsi-ld:GrainLot:UA-2026-X89",
            "type": "GrainLot",
            "location": { "type": "GeoProperty", ... },
            "customs_status": { "type": "Property", "value": "BORDER_CROSSED" },
            ...
        }
        """
        entity = {
            "@context": AGROCHAIN_CONTEXT,
            "id": f"urn:ngsi-ld:GrainLot:{lot.id}",
            "type": "GrainLot",
            
            # Статус лота
            "status": self._property(lot.status.value),
            
            # Фермер (РНОКПП хэширован для приватности)
            "farmerRnoKpp": self._property(
                self._hash_pii(lot.farmer_id)  # Хэшируем ПИИ
            ),
            
            # Кадастровый номер
            "cadastreNumber": self._property(lot.cadastre_number),
            
            # Геолокация из кадастра
            "location": self._geo_property(
                lot.current_gps or self._get_centroid(lot.cadastre_polygon)
            ),
            
            # Полигон поля
            "fieldPolygon": self._geo_property(lot.cadastre_polygon, is_polygon=True),
            
            # Верификация качества
            "labCertHash": self._property(lot.lab_cert_hash_sha256),
            "ukasVerified": self._property(lot.ukas_verified),
            "ukasLabCertNumber": self._property(lot.lab_accreditation_number),
            
            # Фитосанитар
            "phytoCertNumber": self._property(lot.phyto_cert_number),
            "phytoCertStatus": self._property(lot.phyto_cert_status),
            
            # Таможня
            "echerhaStatus": self._property(
                "BORDER_CROSSED" if lot.status == LotStatus.BORDER_CROSSED
                else lot.status.value
            ),
            
            # Blockchain
            "solanaTxRegistry": self._property(lot.solana_tx_registry),
            "chainRootHash": self._property(
                lot.hash_chain.get("chain_root")
            ),
            
            # Цена
            "priceUsdc": self._property(lot.price_usdc),
            
            # GPS трек (последние 10 точек)
            "gpsTrack": self._geo_property_multipoint(lot.gps_track[-10:]),
            
            # Временные метки
            "createdAt": {
                "type": "Property",
                "value": {
                    "@type": "DateTime",
                    "@value": lot.created_at.isoformat() + "Z"
                }
            },
            "modifiedAt": {
                "type": "Property",
                "value": {
                    "@type": "DateTime",
                    "@value": lot.updated_at.isoformat() + "Z"
                }
            },
        }
        
        # Убираем None значения
        entity = self._remove_none_values(entity)
        
        return entity
    
    def _property(self, value: Any, unit: Optional[str] = None) -> dict:
        """Создаёт NGSI-LD Property."""
        if value is None:
            return None
        prop = {"type": "Property", "value": value}
        if unit:
            prop["unitCode"] = unit
        return prop
    
    def _relationship(self, object_id: str) -> dict:
        """Создаёт NGSI-LD Relationship."""
        return {
            "type": "Relationship",
            "object": object_id,
        }
    
    def _geo_property(
        self, 
        location_data: Any, 
        is_polygon: bool = False
    ) -> Optional[dict]:
        """Создаёт NGSI-LD GeoProperty."""
        if not location_data:
            return None
        
        if isinstance(location_data, dict):
            # Уже GeoJSON
            return {
                "type": "GeoProperty",
                "value": location_data,
            }
        
        if isinstance(location_data, list) and not is_polygon:
            # GPS точка [lat, lon] или {"lat": ..., "lon": ...}
            if isinstance(location_data[0], dict):
                lat = location_data[-1].get("lat")
                lon = location_data[-1].get("lon")
            else:
                lat, lon = location_data[0], location_data[1]
            
            return {
                "type": "GeoProperty",
                "value": {
                    "type": "Point",
                    "coordinates": [lon, lat],  # GeoJSON: [lon, lat]
                }
            }
        
        return None
    
    def _geo_property_multipoint(self, gps_track: list) -> Optional[dict]:
        """Создаёт GeoProperty типа MultiPoint из GPS трека."""
        if not gps_track:
            return None
        
        coords = [
            [p.get("lon", 0), p.get("lat", 0)]
            for p in gps_track
            if p.get("lat") and p.get("lon")
        ]
        
        if not coords:
            return None
        
        return {
            "type": "GeoProperty",
            "value": {
                "type": "MultiPoint",
                "coordinates": coords,
            }
        }
    
    def _get_centroid(self, polygon: Optional[list]) -> Optional[dict]:
        """Вычисляет центроид полигона поля."""
        if not polygon:
            return None
        
        try:
            # Предполагаем GeoJSON Polygon
            if isinstance(polygon, dict):
                coords = polygon.get("coordinates", [[]])[0]
            else:
                coords = polygon
            
            if not coords:
                return None
            
            avg_lon = sum(c[0] for c in coords) / len(coords)
            avg_lat = sum(c[1] for c in coords) / len(coords)
            
            return {
                "type": "Point",
                "coordinates": [avg_lon, avg_lat],
            }
        except Exception:
            return None
    
    def _hash_pii(self, value: str) -> str:
        """Хэширует персональные данные (РНОКПП) для приватности."""
        import hashlib
        return "sha256:" + hashlib.sha256(
            f"agrochain_pii_{value}".encode()
        ).hexdigest()[:16]
    
    def _remove_none_values(self, d: dict) -> dict:
        """Рекурсивно удаляет None значения из словаря."""
        return {
            k: self._remove_none_values(v) if isinstance(v, dict) else v
            for k, v in d.items()
            if v is not None
        }
    
    async def push_to_context_broker(
        self, 
        entity: dict,
        broker_url: str = "http://orion-ld:1026"
    ) -> bool:
        """
        Публикует NGSI-LD Entity в FIWARE Orion-LD Context Broker.
        
        Orion-LD настройка (docker-compose):
        orion-ld:
          image: fiware/orion-ld:1.4.0
          ports:
            - "1026:1026"
          environment:
            ORION_MONGO_HOST: mongo
        """
        import httpx
        
        entity_id = entity["id"]
        
        async with httpx.AsyncClient() as client:
            # Сначала проверяем существование
            check = await client.get(
                f"{broker_url}/ngsi-ld/v1/entities/{entity_id}",
                headers={"Accept": "application/ld+json"},
            )
            
            if check.status_code == 200:
                # Обновляем существующую entity
                response = await client.patch(
                    f"{broker_url}/ngsi-ld/v1/entities/{entity_id}/attrs",
                    json=entity,
                    headers={
                        "Content-Type": "application/ld+json",
                        "Link": f'<{AGROCHAIN_CONTEXT[0]}>; rel="http://www.w3.org/ns/json-ld#context"',
                    },
                )
            else:
                # Создаём новую entity
                response = await client.post(
                    f"{broker_url}/ngsi-ld/v1/entities",
                    json=entity,
                    headers={"Content-Type": "application/ld+json"},
                )
            
            success = response.status_code in (200, 201, 204)
            if not success:
                import logging
                logging.getLogger(__name__).error(
                    f"NGSI-LD broker error: {response.status_code} {response.text}"
                )
            
            return success
