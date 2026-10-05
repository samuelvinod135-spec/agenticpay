# Agentic Payments MVP (`agentic-payments-mvp`)

An end-to-end infrastructure system enabling autonomous AI agents (Eliza, LangChain, AutoGPT) to execute policy-enforced on-chain micropayments on **Base Sepolia** using **Circle Programmable Wallets**, **Express**, **Next.js 14+ (App Router)**, and **Supabase (PostgreSQL + RLS)**.

---

## 🏗️ Architecture & Technology Stack

- **Monorepo Structure**:
  - `backend/`: Node.js Express REST API in TypeScript
  - `frontend/`: Next.js 14+ App Router, TypeScript, Tailwind CSS, Lucide React
  - `backend/supabase/schema.sql`: Production-ready PostgreSQL schema with Row Level Security (RLS) policies
- **Database & Auth**: Supabase PostgreSQL, Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`)
- **Web3 Rails**: Base Sepolia Testnet, Circle Programmable Wallets / Coinbase CDP AgentKit
- **Policy Engine**: Deterministic daily spend caps and single-transaction limit enforcement

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.ts          # Supabase client & environment detection
│   │   ├── middleware/
│   │   │   └── auth.ts              # Bearer token verification & user context
│   │   ├── routes/
│   │   │   ├── health.ts            # GET /health & /api/health
│   │   │   ├── agents.ts            # GET/POST /api/agents (Zod validation)
│   │   │   ├── wallets.ts           # GET /api/wallets & /api/wallets/:agentId
│   │   │   ├── policies.ts          # GET/PUT /api/policies/:agentId
│   │   │   ├── transactions.ts      # GET & POST /api/transactions/simulate
│   │   │   ├── paymentRoutes.ts     # POST /api/v1/payments/transfer (USDC transfers)
│   │   │   └── webhookRoutes.ts     # POST /api/v1/webhooks/circle (Circle W3S notifications)
│   │   ├── services/
│   │   │   ├── store.ts             # Store abstraction (Supabase + fallback)
│   │   │   ├── transfer.ts          # Base Sepolia USDC transfer execution
│   │   │   └── walletService.ts     # Circle Developer-Controlled Wallets SDK service
│   │   └── index.ts                 # Express entrypoint & CORS configuration
│   ├── scripts/
│   │   ├── create-wallet.ts         # Standalone CLI script to provision Base Sepolia wallets
│   │   └── migrate-transactions.ts  # CLI helper displaying transactions migration SQL
│   ├── supabase/
│   │   ├── migrations/              # SQL migrations directory
│   │   └── schema.sql               # Complete database schema with RLS & trigger
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── dashboard/page.tsx       # Protected Agent Fleet & Policy Console
│   │   ├── login/page.tsx           # Email/Password Login + Quick Demo Access
│   │   ├── signup/page.tsx          # Account registration with Supabase Auth
│   │   ├── globals.css              # Cyberpunk fintech dark mode & glassmorphism
│   │   ├── layout.tsx               # Root layout & SEO meta tags
│   │   └── page.tsx                 # High-converting landing page
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts            # Browser Supabase client (@supabase/ssr)
│   │       ├── server.ts            # Server Supabase client (@supabase/ssr)
│   │       └── middleware.ts        # Session refresh & route protection
│   ├── middleware.ts                # Next.js route protection middleware
│   ├── .env.local.example
│   ├── tailwind.config.ts
│   └── package.json
│
├── package.json                     # Monorepo runner scripts
└── README.md
```

---

## ⚡ Quick Start

### 1. Database Setup (Supabase)
Run the migration script located at `backend/supabase/schema.sql` in your Supabase SQL Editor:
- Creates `users`, `agents`, `wallets`, `policies`, and `transactions` tables.
- Enables Row Level Security (RLS) on all tables with foreign-key isolated user policies.
- Registers the automatic trigger syncing `auth.users` into `public.users`.

### 2. Environment Variables

**Backend (`backend/.env`):**
```env
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Supabase Credentials
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Circle Web3 Wallet Credentials
CIRCLE_API_KEY=your_circle_api_key_here
CIRCLE_ENTITY_SECRET=your_32_byte_hex_entity_secret_here
```

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Generate a Web3 Developer Wallet (CLI)

Run the standalone CLI script to generate a developer-controlled wallet on **Base Sepolia**:
```bash
# From repository root:
npm run create-wallet

# Or from /backend:
npm run create-wallet --prefix backend
```

### 4. Running the System

Start the Express backend API (Port 4000):
```bash
npm run dev:backend
```

In a separate terminal, start the Next.js frontend (Port 3000):
```bash
npm run dev:frontend
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Policy Engine Validation

The built-in micropayment simulator allows testing safety boundaries directly from `/dashboard`:
1. **Permitted Payments**: If `amount_usd <= max_per_tx_usd` and total rolling 24h spend `< daily_limit_usd`, the transaction is approved and broadcast to Base Sepolia with a transaction hash.
2. **Per-Tx Violation**: If an agent requests more than its single transaction limit, the policy firewall halts execution immediately with an explicit rejection reason.
3. **Daily Quota Exhaustion**: If the cumulative 24h spend exceeds the daily limit, payment attempts are rejected and logged to the ledger.

---

## 💸 Circle USDC Transfers & Webhook Notifications

### 1. Initiate USDC Transfer
```bash
curl -X POST http://localhost:4000/api/v1/payments/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "walletId": "<walletId>",
    "destinationAddress": "0x139166e733f0bb1e8e53f9c7115df9c9c7c162a4",
    "amount": 2.50
  }'
```

### 2. Circle W3S Webhook Listener (`/api/v1/webhooks/circle`)
Configured to receive transaction state changes (`COMPLETE`, `FAILED`, `PENDING`) and automatically update the corresponding record in the Supabase `transactions` table.

