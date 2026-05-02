# AgroChain Ukraine 🌾🇺🇦

**AgroChain Ukraine** is an end-to-end blockchain-based grain traceability and export verification platform, developed as part of the **COP-PILOT Open Call #1 (Cluster 3A)**.

It solves the structural exclusion of SME agri-exporters by connecting local Internet of Things (IoT) sensors, Ukrainian state APIs (Derzhgeocadastre, SSUFSCP eFood, eCherha), and UKAS certifications to an immutable Solana Layer-1 escrow protocol – securely delivering provenance into the EU single market.

## 🌟 Key Features

1. **Digital Grain Passports (Solana L1):** Every step (from KEP digital signatures, to laboratory checks, to border crossing) is cryptographically hashed and anchored to the Solana blockchain.
2. **Automated Escrow & Payments:** Smart contracts release USDC stablecoin payments instantaneously back to the farmer the moment the truck successfully crosses the border (via eCherha integration).
3. **COP-PILOT Cloud-Native Architecture:** 
   * **LLM-assisted Onboarding:** Fully compatible with COP-PILOT's LLM Business Portal via TMForum (TMF 633) standard APIs.
   * **Semantic Operability:** Real-time data transliteration into ETSI NGSI-LD standard (`GrainLot` Smart Data Models) for the FIWARE Orion Context Broker.
   * **Secure Integration Fabric (SIF):** Ships with Helm configurations orchestrating Zero-Trust mTLS micro-tunnels via OpenZiti.
4. **Bilingual Frontend Dashboard (React):** A sleek, fully functional "Green Business" dashboard for Farmers (providing document uploads & GPS tracking) and EU Buyers (handling transparent cross-border acquisitions).

---

## 🏗️ Project Architecture

```plaintext
agrochain/
├── backend/                        # Python FastAPI (API & Verification Service)
│   ├── app/
│   │   ├── models/                 # GrainLot schema, ETSI NGSI-LD Translator
│   │   ├── routers/                # REST API endpoints (lots, status, TMF sync)
│   │   └── services/               # Integrations (Solana, UKAS, eCherha, Cadastre)
│   ├── Dockerfile                  # Base image for COP-PILOT orchestration
│   └── requirements.txt
├── contracts/                      # Solana Anchor Smart Contracts (Rust)
│   ├── programs/trade-escrow/      # Escrow vault & validation logic
│   └── tests/                      # Local validator deployments
├── frontend/                       # React + TypeScript + Vite (Dashboard)
│   └── src/
│       ├── components/             # Grain Lot Modals, GPS tracking, Timelines
│       ├── pages/                  # Buyer & Farmer UX Panels
│       └── i18n.tsx                # Ukrainian & English Localization
└── cop-pilot-onboarding/           # COP-PILOT CI/CD & Service Descriptor
    ├── helm/agrochain-ukraine/     # Helm charts (SIF Zero-Trust config incl.)
    └── tmf633_service_spec.json    # Payload for the LLM Business Portal
```

---

## 🚀 Getting Started

### 1. Run the Frontend (UI)
```bash
cd frontend
npm install
npm run dev
```

### 2. Run the Backend (API)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # (or `venv\Scripts\activate` on Windows)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

### 3. Deploy Smart Contracts (Solana Devnet)
```bash
cd contracts
anchor build
anchor deploy --provider.cluster devnet
# *Ensure you configure your Provider ID in backend/.env
```

---

## 🌐 COP-PILOT GitOps Onboarding
The application automatically handles its own COP-PILOT platform deployment workflow via GitHub Actions (`.github/workflows/cop-pilot-onboarding.yml`):
* Packs and registers the FastAPI Container logic.
* Triggers OpenSlice (OSL) endpoints.
* Provisions resources and Zero-Trust networks on the specified K8s node based on `values.yaml`.

## 📜 Privacy & Ethics 
Fully GDPR compliant. All farmers' Personally Identifiable Information (PII) such as the RNOKPP (Tax ID) is strictly stripped and obfuscated via an aggressive SHA-256 cryptographic hash trapdoor *before* any payload touches the NGSI-LD context broker or public Solana blockchain.

## 🤝 License
Released under the MIT License.
