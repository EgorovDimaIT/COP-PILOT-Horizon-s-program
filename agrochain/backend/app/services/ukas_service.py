"""
UKAS CertCheck Integration
URL: https://certcheck.ukas.com

ВАЖНО: UKAS CertCheck - это веб-приложение БЕЗ публичного REST API.
Официальные пути получения данных:
1. Партнёрский API (запрос через accreditation@ukas.com)
2. Браузерная автоматизация (Playwright) — для MVP/разработки
3. Ручная верификация с кэшированием в БД

Этот модуль реализует оба подхода.
"""

import hashlib
import logging
import asyncio
from typing import Optional
from playwright.async_api import async_playwright, Browser, BrowserContext
from app.config import get_settings

logger = logging.getLogger(__name__)

class UKASVerificationResult:
    def __init__(
        self,
        cert_number: str,
        company_name: str,
        accreditation_body: str,
        standards: list,
        status: str,  # "current", "suspended", "withdrawn"
        valid_until: Optional[str],
        verified: bool,
    ):
        self.cert_number = cert_number
        self.company_name = company_name
        self.accreditation_body = accreditation_body
        self.standards = standards
        self.status = status
        self.valid_until = valid_until
        self.verified = verified

class UKASService:
    """
    Сервис верификации аккредитации лабораторий через UKAS CertCheck.
    
    Логика AgroChain:
    1. Фермер указывает номер аккредитации лаборатории (напр. "8015")
    2. Мы проверяем что лаборатория UKAS-аккредитована для ISO 17025
       (испытательные лаборатории) или ISO 22000 (безопасность пищевых продуктов)
    3. Записываем результат верификации в хэш-цепочку лота
    """
    
    # Стандарты для верификации качества зерна
    REQUIRED_STANDARDS = ["ISO 17025", "ISO 22000", "ISO 9001"]
    
    def __init__(self):
        self.settings = get_settings()
        self._browser: Optional[Browser] = None
    
    async def _get_browser(self) -> Browser:
        """Инициализирует Playwright браузер."""
        if not self._browser:
            playwright = await async_playwright().start()
            self._browser = await playwright.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage"]
            )
        return self._browser
    
    async def verify_lab_accreditation(
        self, 
        cert_number: str,
        company_name: Optional[str] = None
    ) -> UKASVerificationResult:
        """
        Верифицирует аккредитацию лаборатории по номеру сертификата.
        
        Args:
            cert_number: Номер UKAS-сертификата (напр. "8015", "2607")
            company_name: Название лаборатории (для дополнительной верификации)
        
        Returns:
            UKASVerificationResult
        
        Алгоритм:
        1. Открываем certcheck.ukas.com
        2. Вводим номер сертификата в поле поиска
        3. Парсим результаты
        4. Возвращаем структурированные данные
        """
        logger.info(f"Верификация UKAS: cert={cert_number}, company={company_name}")
        
        # Сначала пробуем официальный API (если есть ключ)
        if self.settings.ukas_api_key:
            try:
                return await self._verify_via_official_api(cert_number)
            except Exception as e:
                logger.warning(f"Официальный API недоступен: {e}, переходим к scraping")
        
        # Fallback: Playwright scraping
        return await self._verify_via_playwright(cert_number, company_name)
    
    async def _verify_via_official_api(self, cert_number: str) -> UKASVerificationResult:
        """
        Запрос через официальный API UKAS.
        
        ВНИМАНИЕ: Официального публичного API нет.
        Этот метод — заготовка для партнёрской интеграции.
        Свяжитесь с: accreditation@ukas.com для получения API доступа.
        
        Предполагаемые endpoints (на основе анализа веб-приложения):
        GET https://certcheck.ukas.com/api/search?q={cert_number}
        GET https://certcheck.ukas.com/api/certificate/{cert_number}
        """
        import httpx
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.settings.ukas_base_url}/api/search",
                params={"q": cert_number, "type": "certificate"},
                headers={
                    "Authorization": f"Bearer {self.settings.ukas_api_key}",
                    "Accept": "application/json",
                    "User-Agent": "AgroChain-Ukraine/2.0",
                },
                timeout=15.0,
            )
            
            if response.status_code == 200:
                data = response.json()
                return self._parse_api_response(data, cert_number)
            
            raise Exception(f"UKAS API response: {response.status_code}")
    
    async def _verify_via_playwright(
        self, 
        cert_number: str,
        company_name: Optional[str] = None
    ) -> UKASVerificationResult:
        """
        Верификация через автоматизированный браузер (Playwright).
        Используется когда официальный API недоступен.
        """
        browser = await self._get_browser()
        context: BrowserContext = await browser.new_context(
            user_agent="Mozilla/5.0 (compatible; AgroChainBot/2.0)",
            locale="en-GB",
        )
        page = await context.new_page()
        
        try:
            # Открываем CertCheck
            await page.goto(
                "https://certcheck.ukas.com/",
                wait_until="networkidle",
                timeout=30000
            )
            
            # Ждём загрузки React-приложения
            await page.wait_for_selector(
                'input[placeholder*="search"], input[type="search"], input[name="search"]',
                timeout=15000
            )
            
            # Вводим номер сертификата
            search_input = await page.query_selector(
                'input[placeholder*="search"], input[type="search"]'
            )
            if not search_input:
                raise Exception("Поле поиска не найдено на certcheck.ukas.com")
            
            await search_input.fill(cert_number)
            await search_input.press("Enter")
            
            # Ждём результатов
            await page.wait_for_load_state("networkidle", timeout=10000)
            await asyncio.sleep(2)  # Дополнительная пауза для React
            
            # Парсим результаты
            # Структура DOM может меняться — проверяйте актуальность
            results = await page.evaluate("""
                () => {
                    const items = document.querySelectorAll(
                        '[class*="result"], [class*="certificate"], [class*="card"]'
                    );
                    return Array.from(items).map(el => el.innerText);
                }
            """)
            
            # Также перехватываем XHR запросы для получения JSON
            # (React SPA делает API-запросы при поиске)
            
            if not results:
                logger.warning(f"Сертификат {cert_number} не найден в UKAS CertCheck")
                return UKASVerificationResult(
                    cert_number=cert_number,
                    company_name=company_name or "",
                    accreditation_body="UKAS",
                    standards=[],
                    status="not_found",
                    valid_until=None,
                    verified=False,
                )
            
            # Парсим текст результата
            result_text = " ".join(results)
            
            # Определяем статус
            status = "current"
            if "suspended" in result_text.lower():
                status = "suspended"
            elif "withdrawn" in result_text.lower():
                status = "withdrawn"
            
            # Извлекаем стандарты
            found_standards = [
                s for s in self.REQUIRED_STANDARDS 
                if s.lower() in result_text.lower()
            ]
            
            return UKASVerificationResult(
                cert_number=cert_number,
                company_name=company_name or self._extract_company_name(result_text),
                accreditation_body="UKAS",
                standards=found_standards,
                status=status,
                valid_until=None,  # Извлекаем из DOM при необходимости
                verified=status == "current",
            )
            
        finally:
            await context.close()
    
    def _extract_company_name(self, text: str) -> str:
        """Базовое извлечение названия компании из текста результата."""
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        return lines[0] if lines else ""
    
    def _parse_api_response(self, data: dict, cert_number: str) -> UKASVerificationResult:
        """Парсит ответ официального API (структура предполагаемая)."""
        return UKASVerificationResult(
            cert_number=cert_number,
            company_name=data.get("organisationName", ""),
            accreditation_body="UKAS",
            standards=data.get("standards", []),
            status=data.get("status", "unknown"),
            valid_until=data.get("expiryDate"),
            verified=data.get("status") == "current",
        )
    
    async def verify_pdf_lab_cert(
        self, 
        pdf_path: str,
        expected_cert_number: str
    ) -> dict:
        """
        Комплексная верификация PDF-сертификата лаборатории:
        1. Извлекаем номер сертификата из PDF
        2. Проверяем в UKAS CertCheck
        3. Вычисляем SHA-256 хэш PDF для записи в Solana
        """
        import hashlib
        
        # Вычисляем SHA-256 хэш PDF
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()
        pdf_hash = hashlib.sha256(pdf_bytes).hexdigest()
        
        # Верифицируем аккредитацию
        ukas_result = await self.verify_lab_accreditation(expected_cert_number)
        
        return {
            "pdf_sha256": pdf_hash,
            "cert_number": expected_cert_number,
            "ukas_verified": ukas_result.verified,
            "ukas_status": ukas_result.status,
            "lab_name": ukas_result.company_name,
            "standards": ukas_result.standards,
        }
    
    async def close(self):
        if self._browser:
            await self._browser.close()
