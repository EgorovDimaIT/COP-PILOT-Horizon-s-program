# AgroChain Ukraine 🌾🇺🇦

**AgroChain Ukraine** is an end-to-end blockchain-based grain traceability and **hybrid escrow payment** platform, developed as part of the **COP-PILOT Open Call #1 (Cluster 3A — AgriTech Transformation & Sustainability)**.

It solves the structural exclusion of SME agri-exporters by connecting IoT sensors, Ukrainian state APIs (Derzhgeocadastre, SSUFSCP eFood, eCherha), and UKAS certifications to an immutable Solana Layer-1 escrow protocol — securely delivering provenance and payments into the EU single market.

---

## 🌟 Key Features

### 🔗 Blockchain Traceability
- **Digital Grain Passports (Solana L1):** Every step (KEP digital signatures → lab checks → border crossing) is cryptographically hashed and anchored to Solana.
- **Immutable Audit Trail:** Full chain of SHA-256 hashes from farm to EU customs for compliance with both Ukrainian (NBU) and EU regulations.

### 💰 Hybrid Payment System (Data-Driven Escrow)
| Feature | USDC (Solana) | EUR/USD (Bank Partners) |
|---------|--------------|------------------------|
| Speed | Instant (< 1 sec) | 1-2 business days |
| Fee | ~$0.001 | 0.1-0.3% |
| Trigger | eCherha BORDER_CROSSED | eCherha BORDER_CROSSED |
| Standard | Anchor Smart Contract | TMF 622/676 API |
| Best for | Small/medium farmers | Large EU importers |

- **Scenario A (USDC):** Buyer locks USDC in Solana smart contract → eCherha confirms border crossing → instant release to farmer.
- **Scenario B (EUR/USD):** Buyer reserves EUR in partner bank escrow (Deutsche Bank, Credit Agricole, Raiffeisen, Revolut Business) → eCherha confirms → TMF 676 Payment Release.
- **Scenario C (Hybrid):** Split payment — e.g. 30% USDC + 70% EUR — both released simultaneously on BORDER_CROSSED.

### 🛡️ AI Risk Assessment (COP-PILOT Intelligence Layer)
- GPS route deviation detection
- Transaction amount thresholds
- Farmer history scoring
- Transit time anomaly detection
- High-risk payments automatically paused for manual review

### ☁️ COP-PILOT Cloud-Native Architecture
- **LLM-assisted Onboarding:** TMF 633 Service Catalog for COP-PILOT Business Portal AI discovery.
- **NGSI-LD:** Real-time data translation to ETSI standard for FIWARE Orion Context Broker.
- **Secure Integration Fabric (SIF):** Helm charts with OpenZiti mTLS Zero-Trust micro-tunnels.
- **GitOps:** Automated CI/CD via GitHub Actions for COP-PILOT Kubernetes deployment.

### 🌐 Bilingual Dashboard (React + TypeScript)
- Full Farmer panel (document uploads, GPS tracking, escrow balance, revenue analytics)
- Full Buyer panel (lot browsing, filters, deal initiation, payment status)
- Ukrainian 🇺🇦 / English 🇬🇧 localization

---

## 🏗️ Project Architecture

```
agrochain/
├── backend/                           # Python FastAPI
│   ├── app/
│   │   ├── models/                    # GrainLot, NGSI-LD schemas
│   │   ├── routers/
│   │   │   ├── lots.py                # Grain lot lifecycle API
│   │   │   └── payments.py            # Hybrid payment API (USDC + Fiat)
│   │   └── services/
│   │       ├── payment_oracle.py      # TMF 622/676 Payment Oracle
│   │       ├── fiat_escrow_service.py # EU bank escrow integration
│   │       ├── solana_service.py      # Solana RPC client
│   │       ├── kep_service.py         # Ukrainian digital signature (KEP)
│   │       ├── cadastre_service.py    # Derzhgeocadastre WFS
│   │       ├── ukas_service.py        # UKAS CertCheck
│   │       ├── phyto_service.py       # SSUFSCP Phytosanitary
│   │       └── echerha_service.py     # eCherha Customs queue
│   ├── Dockerfile
│   └── requirements.txt
├── contracts/                         # Solana Anchor Smart Contracts (Rust)
│   ├── grain-lot-registry/            # Immutable hash chain per lot
│   └── trade-escrow/                  # Hybrid escrow (USDC + fiat reference)
│       └── src/lib.rs                 # pause / resume / dispute / refund
├── frontend/                          # React + Vite + TypeScript
│   └── src/
│       ├── components/                # Sidebar, TopBar, GPS, Modals
│       ├── pages/                     # BuyerDashboard, FarmerDashboard
│       └── i18n.tsx                   # UA/EN translations
├── cop-pilot-onboarding/              # COP-PILOT integration artifacts
│   ├── helm/agrochain-ukraine/        # Helm charts (SIF config included)
│   └── tmf633_service_spec.json       # LLM Business Portal descriptor
├── tests/                             # Anchor E2E tests (TypeScript)
└── Anchor.toml
```

---

## 💳 Payment API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/payments/banks` | List COP-PILOT partner banks |
| `POST` | `/api/v1/payments/escrow/create` | Create escrow (USDC / EUR / Hybrid) |
| `POST` | `/api/v1/payments/escrow/release` | Release payment on BORDER_CROSSED |
| `GET` | `/api/v1/payments/{lot_id}/status` | Payment status |
| `GET` | `/api/v1/payments/{lot_id}/audit` | Full audit trail (NBU / EU Tax) |

### Partner Banks
| Bank | Region | Currencies | Use Case |
|------|--------|-----------|----------|
| Deutsche Bank | EU | EUR, USD | Primary EU Escrow Agent |
| Credit Agricole Ukraine | UA | EUR, USD, UAH | Agri-sector leader, farmer payouts |
| Raiffeisen Bank Aval | UA | EUR, USD, UAH | PSD2-compatible, forex returns |
| Revolut Business | EU | EUR, USD, GBP | Fast micro-transfers (< €50K) |

---

## 🚀 Getting Started

### 1. Frontend (UI)
```bash
cd frontend
npm install
npm run dev
```

### 2. Backend (API)
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

### 3. Smart Contracts (Solana Devnet)
```bash
cd contracts
anchor build
anchor deploy --provider.cluster devnet
```

---

## 📜 Compliance & Security

- **GDPR:** All PII (RNOKPP) is SHA-256 hashed before NGSI-LD publication or blockchain anchoring.
- **NBU Regulation №136:** Audit trail auto-generates proof of export for Ukrainian forex return compliance.
- **PSD2 / ISO 20022:** Bank API integration follows EU payment standards.
- **SIF (OpenZiti):** All bank credentials and payment data transmitted via Zero-Trust mTLS micro-tunnels.
- **COP-PILOT Annex III (Ethics):** No critical personal data exposed to LLM portal or public blockchain.

---

## 🤝 License

Released under the **Apache 2.0** License. All code open-sourced on GitHub.

---

*Built for COP-PILOT Horizon Europe Open Call #1 — Cluster 3A ATSI Testbed.*
