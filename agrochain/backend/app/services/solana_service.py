"""
Solana Service — Python интеграция со смарт-контрактами.
Использует anchorpy (Python Anchor client).

Документация: https://kevinheavey.github.io/anchorpy/
"""

import json
import logging
from typing import Optional
from pathlib import Path
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.hash import Hash
from anchorpy import Program, Provider, Wallet, Idl
from anchorpy.provider import DEFAULT_OPTIONS
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed

from app.config import get_settings

logger = logging.getLogger(__name__)

class SolanaService:
    """
    Клиент для взаимодействия с Solana смарт-контрактами AgroChain.
    """
    
    def __init__(self):
        self.settings = get_settings()
        self._client: Optional[AsyncClient] = None
        self._grain_registry_program: Optional[Program] = None
        self._trade_escrow_program: Optional[Program] = None
    
    async def _get_client(self) -> AsyncClient:
        if not self._client:
            self._client = AsyncClient(
                self.settings.solana_rpc_url,
                commitment=Confirmed,
            )
        return self._client
    
    async def _load_keypair(self) -> Keypair:
        """Загружает keypair оракула AgroChain."""
        keypair_path = Path(self.settings.solana_payer_keypair)
        if keypair_path.exists():
            with open(keypair_path) as f:
                secret = json.load(f)
            return Keypair.from_bytes(bytes(secret))
        
        # Для тестирования — генерируем новый
        logger.warning("Keypair не знайдено, генеруємо тестовий")
        return Keypair()
    
    async def _get_grain_registry_program(self) -> Program:
        """Инициализирует Anchor Program клиент для GrainLotRegistry."""
        if self._grain_registry_program:
            return self._grain_registry_program
        
        client = await self._get_client()
        keypair = await self._load_keypair()
        wallet = Wallet(keypair)
        provider = Provider(client, wallet, DEFAULT_OPTIONS)
        
        # Загружаем IDL (Interface Definition Language)
        # IDL генерируется командой: anchor build
        idl_path = Path("contracts/target/idl/grain_lot_registry.json")
        if not idl_path.exists():
            raise FileNotFoundError(
                f"IDL не знайдено: {idl_path}. "
                "Запустіть 'anchor build' у папці contracts/"
            )
        
        idl = Idl.from_json(idl_path.read_text())
        program_id = Pubkey.from_string(self.settings.grain_registry_program_id)
        
        self._grain_registry_program = Program(idl, program_id, provider)
        return self._grain_registry_program
    
    async def register_grain_lot(
        self,
        lot_id: str,
        kep_hash: bytes,
        cadastre_hash: bytes,
        farmer_rno_kpp: str,
        cadastre_number: str,
        farmer_pubkey: Optional[str] = None,
    ) -> str:
        """
        Регистрирует зерновой лот в GrainLotRegistry.
        
        Returns:
            Transaction signature (hash)
        """
        program = await self._get_grain_registry_program()
        
        # Вычисляем PDA для лота
        [grain_lot_pda, bump] = Pubkey.find_program_address(
            [b"grain_lot", lot_id.encode()],
            program.program_id,
        )
        
        # Конвертируем хэши в массивы байт (32 байта каждый)
        kep_hash_arr = list(kep_hash[:32])
        cadastre_hash_arr = list(cadastre_hash[:32])
        
        farmer_pk = (
            Pubkey.from_string(farmer_pubkey) 
            if farmer_pubkey 
            else program.provider.wallet.public_key
        )
        
        logger.info(f"Solana: регистрируем лот {lot_id} в {grain_lot_pda}")
        
        tx = await program.rpc["initialize_lot"](
            lot_id,
            kep_hash_arr,
            cadastre_hash_arr,
            farmer_rno_kpp,
            cadastre_number,
            ctx=program.type["Context"](
                accounts={
                    "grain_lot": grain_lot_pda,
                    "farmer": farmer_pk,
                    "agrochain_operator": program.provider.wallet.public_key,
                    "system_program": "11111111111111111111111111111111",
                }
            ),
        )
        
        logger.info(f"Solana TX: {tx}")
        return str(tx)
    
    async def add_ukas_verification(
        self,
        lot_id: str,
        ukas_hash: bytes,
        lab_cert_number: str,
        lab_name: str,
    ) -> str:
        program = await self._get_grain_registry_program()
        
        [grain_lot_pda, _] = Pubkey.find_program_address(
            [b"grain_lot", lot_id.encode()],
            program.program_id,
        )
        
        tx = await program.rpc["add_ukas_verification"](
            list(ukas_hash[:32]),
            lab_cert_number,
            lab_name,
            ctx=program.type["Context"](
                accounts={
                    "grain_lot": grain_lot_pda,
                    "authority": program.provider.wallet.public_key,
                }
            ),
        )
        
        return str(tx)
    
    async def add_phyto_certification(
        self,
        lot_id: str,
        phyto_hash: bytes,
        phyto_cert_number: str,
    ) -> str:
        program = await self._get_grain_registry_program()
        
        [grain_lot_pda, _] = Pubkey.find_program_address(
            [b"grain_lot", lot_id.encode()],
            program.program_id,
        )
        
        tx = await program.rpc["add_phyto_certification"](
            list(phyto_hash[:32]),
            phyto_cert_number,
            ctx=program.type["Context"](
                accounts={
                    "grain_lot": grain_lot_pda,
                    "authority": program.provider.wallet.public_key,
                }
            ),
        )
        
        return str(tx)
    
    async def confirm_border_crossing(
        self,
        lot_id: str,
        echerha_hash: bytes,
        crossed_at: int,
        checkpoint_id: int,
    ) -> str:
        program = await self._get_grain_registry_program()
        
        [grain_lot_pda, _] = Pubkey.find_program_address(
            [b"grain_lot", lot_id.encode()],
            program.program_id,
        )
        
        tx = await program.rpc["confirm_border_crossing"](
            list(echerha_hash[:32]),
            crossed_at,
            checkpoint_id,
            ctx=program.type["Context"](
                accounts={
                    "grain_lot": grain_lot_pda,
                    "oracle": program.provider.wallet.public_key,
                    "agrochain_oracle": program.provider.wallet.public_key,
                }
            ),
        )
        
        return str(tx)
    
    async def release_escrow_payment(self, lot_id: str, echerha_confirmation: bytes) -> str:
        # TODO: Implement escrow release when trade_escrow_program is loaded
        # For now return mock tx hash
        return "mock_tx_hash_for_release"
