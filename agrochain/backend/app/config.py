from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Cadastre
    cadastre_client_id: str
    cadastre_client_secret: str
    cadastre_token_url: str = "https://e.land.gov.ua/api/oauth/token"
    cadastre_api_base: str = "https://e.land.gov.ua/api/v1"
    
    # UKAS
    ukas_base_url: str = "https://certcheck.ukas.com"
    ukas_api_key: str = ""
    
    # Phyto
    phyto_api_base: str = "https://api.consumer.gov.ua/v1"
    phyto_api_key: str = ""
    
    # eCherha
    echerha_api_base: str = "https://echerha.gov.ua"
    echerha_login: str = ""
    echerha_password: str = ""
    
    # Solana
    solana_rpc_url: str = "https://api.devnet.solana.com"
    solana_payer_keypair: str = "keypair.json"
    grain_registry_program_id: str = ""
    trade_escrow_program_id: str = ""
    
    # MQTT
    mqtt_broker_host: str = "localhost"
    mqtt_broker_port: int = 8883
    mqtt_username: str = ""
    mqtt_password: str = ""
    
    # DB
    database_url: str = "postgresql+asyncpg://agrochain:password@localhost/agrochain"
    
    class Config:
        env_file = ".env"

@lru_cache
def get_settings() -> Settings:
    return Settings()
