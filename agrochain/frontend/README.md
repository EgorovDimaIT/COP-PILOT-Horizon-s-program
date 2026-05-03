# AgroChain Ukraine — Frontend App 🌾🇪🇺

[🇷🇺 Читать на русском ниже](#русская-версия)

This is the client-side (Frontend) of the **AgroChain Ukraine** platform, developed as part of the **COP-PILOT Horizon Europe (Cluster 3A)** initiative.

The application serves as a modern, responsive, and blazing-fast interface for farmers (Ukraine) and agricultural buyers (EU), built with the latest web development standards.

---

## 🎯 Project Purpose

The AgroChain frontend acts as a unified B2B portal for managing the lifecycle of export grain lots. 
It integrates complex smart contract operations (Solana), GPS tracking, and document workflows into a seamless user interface.

### Main Dashboards:
1. **UA Farmer Dashboard**
   - Create new Grain Lots.
   - Attach digital signatures (KEP).
   - Track verification statuses in state registries (Derzhgeocadastre, UKAS, eFood).
   - Monitor the TradeEscrow smart contract and track incoming funds.
   
2. **EU Buyer Dashboard**
   - Browse available grain lots with deep provenance checks.
   - Initiate hybrid payments via TMF 622 (Solana USDC + Bank EUR transfers).
   - Track GPS routes of trucks crossing the border via the `eCherha` customs API.
   - Access the immutable Audit Trail for EU tax and compliance reporting.

---

## 🛠️ Tech Stack

- **Framework:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** [Vite](https://vitejs.dev/) (provides instant HMR)
- **Styling:** Vanilla CSS with custom variables (CSS Variables) and modern UI patterns (Glassmorphism, Dark/Light modes).
- **Icons:** [Lucide React](https://lucide.dev/)
- **Localization:** `react-i18next` (Supports Ukrainian 🇺🇦 and English 🇬🇧)
- **Routing:** `react-router-dom`

---

## 📂 Project Structure

```text
agrochain/frontend/
├── public/                 # Static assets (images, favicons)
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Navigation.tsx  # Header (language, wallet connection)
│   │   ├── Sidebar.tsx     # Side menu
│   │   ├── Modals.tsx      # Popups (lot details, documents)
│   │   └── MapWidget.tsx   # GPS map integration
│   ├── pages/              # Application pages (screens)
│   │   ├── FarmerDashboard.tsx
│   │   ├── BuyerDashboard.tsx
│   │   └── LotDetails.tsx  # Detailed page for a specific grain lot
│   ├── i18n.ts             # Localization config (EN/UA)
│   ├── App.tsx             # Entry point and routing
│   ├── index.css           # Global application styles
│   └── main.tsx            # React DOM mounting
├── Dockerfile              # Docker/K8s deployment config
├── package.json            # Project dependencies
└── vite.config.ts          # Vite bundler configuration
```

---

## 🚀 How to Run Locally

### Option 1: Via Docker (Recommended)
If you run via the global `docker-compose.yml` in the root of the project, the frontend spins up automatically.
The app will be available at: http://localhost:5173

### Option 2: Local Build (NPM)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   By default, the backend is expected at `http://localhost:8000`.
   Create a `.env` file if necessary:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 in your browser.

4. **Production Build:**
   ```bash
   npm run build
   ```
   Compiled static files will be generated in the `dist/` folder.

---

## 🔒 Security & Web3
- The application does not store Private Keys. 
- A browser extension (e.g., Phantom Wallet) is required to sign Solana transactions (USDC Escrow).
- All sensitive information (PII) is processed strictly on the secure FastAPI backend via SIF OpenZiti micro-tunnels.

<br><br>

---
---

<a name="русская-версия"></a>
# AgroChain Ukraine — Frontend App (Русская версия) 🌾🇪🇺

Это клиентская часть (Frontend) платформы **AgroChain Ukraine**, разработанной в рамках инициативы **COP-PILOT Horizon Europe (Cluster 3A)**.

Приложение представляет собой современный, адаптивный и быстрый интерфейс для фермеров (Украина) и покупателей сельскохозяйственной продукции (ЕС), построенный с использованием новейших стандартов веб-разработки.

---

## 🎯 Общее назначение системы

Фронтенд-приложение AgroChain выполняет роль единого окна (B2B портала) для управления жизненным циклом экспортных партий зерна. 
Оно интегрирует сложные блокчейн-операции (Solana), GPS-трекинг и документооборот в удобный и интуитивно понятный пользовательский интерфейс.

### Основные Панели (Dashboards):
1. **Панель Фермера (UA Farmer Dashboard)**
   - Создание новых партий (Grain Lots).
   - Загрузка и прикрепление электронных цифровых подписей (КЕП / Дія.Підпис).
   - Отслеживание статуса верификации в государственных реестрах (Держгеокадастр, UKAS, eFood).
   - Мониторинг смарт-контракта эскроу (TradeEscrow) и автоматического получения средств.
   
2. **Панель Покупателя (EU Buyer Dashboard)**
   - Просмотр доступных партий зерна с глубокой проверкой их происхождения.
   - Инициация гибридных платежей TMF 622 (Smart Contract USDC + Банковские переводы EUR).
   - Трекинг GPS-маршрута грузовиков через таможенную систему `єЧерга`.
   - Доступ к Audit Trail (цепочке аудита) для европейской налоговой отчетности.

---

## 🛠️ Стек технологий

- **Фреймворк:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Сборщик:** [Vite](https://vitejs.dev/) (обеспечивает мгновенную горячую перезагрузку HMR)
- **Стилизация:** Чистый CSS с использованием кастомных переменных (CSS Variables) и современных UI-паттернов (Glassmorphism, Dark/Light modes).
- **Иконки:** [Lucide React](https://lucide.dev/)
- **Локализация:** `react-i18next` (поддержка Украинского 🇺🇦 и Английского 🇬🇧 языков)
- **Роутинг:** `react-router-dom`

---

## 📂 Структура проекта

```text
agrochain/frontend/
├── public/                 # Статические файлы (картинки, фавиконки)
├── src/
│   ├── components/         # Переиспользуемые UI-компоненты
│   │   ├── Navigation.tsx  # Верхняя панель (язык, кошелек)
│   │   ├── Sidebar.tsx     # Боковое меню
│   │   ├── Modals.tsx      # Всплывающие окна (детали лота, документы)
│   │   └── MapWidget.tsx   # Интеграция GPS-карт
│   ├── pages/              # Страницы (экраны) приложения
│   │   ├── FarmerDashboard.tsx
│   │   ├── BuyerDashboard.tsx
│   │   └── LotDetails.tsx  # Детальная страница конкретной партии
│   ├── i18n.ts             # Конфигурация локализации (EN/UA)
│   ├── App.tsx             # Точка входа приложения и роутинг
│   ├── index.css           # Глобальные стили приложения
│   └── main.tsx            # Монтирование React-дерева
├── Dockerfile              # Конфигурация для запуска в Docker/K8s
├── package.json            # Зависимости проекта
└── vite.config.ts          # Конфигурация Vite-сборщика
```

---

## 🚀 Как запустить локально

### Вариант 1: Через Docker (Рекомендуемый)
Если вы запускаете через общий `docker-compose.yml` в корне проекта, фронтенд поднимается автоматически.
Приложение будет доступно по адресу: http://localhost:5173

### Вариант 2: Локальная сборка (NPM)

1. **Установите зависимости:**
   ```bash
   npm install
   ```

2. **Создайте файл окружения:**
   Скопируйте настройки (например, API бэкенда). Бэкенд по умолчанию ожидается на `http://localhost:8000`.
   В `.env` файле (если требуется):
   ```env
   VITE_API_URL=http://localhost:8000
   ```

3. **Запустите режим разработчика:**
   ```bash
   npm run dev
   ```
   Откройте http://localhost:5173 в браузере.

4. **Сборка для продакшена (Production Build):**
   ```bash
   npm run build
   ```
   Готовые статические файлы будут сгенерированы в папке `dist/`.

---

## 🔒 Безопасность и Web3
- Приложение не хранит приватные ключи (Private Keys). 
- Для подписания Solana-транзакций (эскроу USDC) предполагается подключение расширения браузера (например, Phantom Wallet).
- Вся чувствительная информация (PII) обрабатывается только на защищенном FastAPI бэкенде (через микро-туннели SIF OpenZiti).
