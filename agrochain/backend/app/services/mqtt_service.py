"""
MQTT GPS Service
Протокол: MQTT over TLS (port 8883)
Broker: Eclipse Mosquitto / EMQX / HiveMQ

Топики:
  agrochain/gps/{lot_id}/{truck_plate}  — GPS данные
  agrochain/status/{lot_id}             — Статусы лота

Формат сообщения GPS:
{
    "lat": 50.4547,
    "lon": 30.5238,
    "speed_kmh": 65.3,
    "accuracy_m": 5.2,
    "timestamp": "2026-05-01T12:34:56Z",
    "battery_pct": 87
}
"""

import asyncio
import json
import logging
from typing import Callable, Dict, Optional
from datetime import datetime
import asyncio_mqtt as aiomqtt
from app.config import get_settings

logger = logging.getLogger(__name__)

class MQTTGPSService:
    """
    MQTT сервис для приёма GPS данных от смартфона водителя.
    
    Broker настройка (docker-compose):
    mosquitto:
      image: eclipse-mosquitto:2
      ports:
        - "8883:8883"
      volumes:
        - ./mosquitto.conf:/mosquitto/config/mosquitto.conf
        - ./certs:/mosquitto/certs
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.gps_callbacks: Dict[str, Callable] = {}
        self._client: Optional[aiomqtt.Client] = None
    
    async def start(self):
        """Запускает MQTT подписку."""
        tls_params = None
        if self.settings.mqtt_tls:
            import ssl
            tls_params = aiomqtt.TLSParameters(
                certfile=None,
                keyfile=None,
                ca_certs="/certs/ca.crt",  # CA certificate
                cert_reqs=ssl.CERT_REQUIRED,
                tls_version=ssl.PROTOCOL_TLSv1_2,
            )
        
        async with aiomqtt.Client(
            hostname=self.settings.mqtt_broker_host,
            port=self.settings.mqtt_broker_port,
            username=self.settings.mqtt_username,
            password=self.settings.mqtt_password,
            tls_params=tls_params,
        ) as client:
            self._client = client
            
            # Подписываемся на все GPS топики AgroChain
            await client.subscribe("agrochain/gps/#")
            logger.info("MQTT: подписка на agrochain/gps/# активна")
            
            async for message in client.messages:
                await self._handle_message(message)
    
    async def _handle_message(self, message):
        """Обрабатывает входящее MQTT сообщение."""
        try:
            # Парсим топик: agrochain/gps/{lot_id}/{truck_plate}
            topic_parts = str(message.topic).split("/")
            
            if len(topic_parts) != 4 or topic_parts[1] != "gps":
                return
            
            lot_id = topic_parts[2]
            truck_plate = topic_parts[3]
            
            # Парсим payload
            payload = json.loads(message.payload.decode())
            
            gps_point = {
                "lat": payload["lat"],
                "lon": payload["lon"],
                "speed_kmh": payload.get("speed_kmh", 0),
                "accuracy_m": payload.get("accuracy_m", 0),
                "timestamp": payload.get("timestamp", datetime.utcnow().isoformat()),
                "battery_pct": payload.get("battery_pct", 100),
            }
            
            logger.debug(
                f"GPS: lot={lot_id} truck={truck_plate} "
                f"pos=({gps_point['lat']:.4f}, {gps_point['lon']:.4f})"
            )
            
            # Вызываем зарегистрированные callback-и
            callback_key = f"{lot_id}:{truck_plate}"
            if callback_key in self.gps_callbacks:
                await self.gps_callbacks[callback_key](gps_point)
            
            # Глобальный callback
            if "global" in self.gps_callbacks:
                await self.gps_callbacks["global"](lot_id, truck_plate, gps_point)
                
        except Exception as e:
            logger.error(f"Ошибка обработки MQTT сообщения: {e}")
    
    def register_gps_callback(
        self, 
        lot_id: str, 
        truck_plate: str, 
        callback: Callable
    ):
        """Регистрирует callback для конкретного грузовика."""
        self.gps_callbacks[f"{lot_id}:{truck_plate}"] = callback
    
    def register_global_callback(self, callback: Callable):
        """Регистрирует глобальный callback для всех GPS обновлений."""
        self.gps_callbacks["global"] = callback
    
    async def publish_lot_status(self, lot_id: str, status: str, data: dict = None):
        """Публикует статус лота для подписчиков (напр. мобильного приложения)."""
        if not self._client:
            return
        
        payload = json.dumps({
            "lot_id": lot_id,
            "status": status,
            "timestamp": datetime.utcnow().isoformat(),
            **(data or {})
        })
        
        await self._client.publish(
            f"agrochain/status/{lot_id}",
            payload=payload.encode(),
            qos=1,  # At least once delivery
            retain=True,
        )
