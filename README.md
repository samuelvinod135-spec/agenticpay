# AgenticPay (`agentic-payments-mvp`)

> **The Enterprise Financial Firewall & Programmable Rails for Autonomous AI Agents**

AgenticPay is an institutional, non-custodial financial infrastructure platform that enables autonomous AI agents (Eliza, LangChain, AutoGPT, CrewAI) to execute policy-governed micro-transfers and spend on **Base Sepolia & Base Mainnet**, **Arbitrum**, **Solana**, and **Virtual Credit Cards (VCC)** with sub-cent settlement, cryptographic verification, ML fraud firewalls, and double-entry ledgering.

---

## 1. System Architecture Diagram

```text
 ┌────────────────────────────────────────────────────────┐
 │                      AI Agents                         │
 │        (ElizaOS / LangChain Tool / AutoGPT / Python)    │
 └───────────────────────────┬────────────────────────────┘
                             │  Bearer ag_live_... / SDK
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │           AgenticPay Gateway & Firewall Engine         │
 │  • Layer 1: Edge Zod Validation & Rate Limiter (IP/Key)│
 │  • Layer 2: RBAC Enforcement (ADMIN / DEV / AUDITOR)   │
 │  • Layer 3: Policy Firewall (Max/Tx & Rolling 24h Cap) │
 │  • Layer 4: ML Anomaly Detection & Velocity Guard      │
 │  • Layer 5: Sub-Agent Umbrella Hierarchy Budget Check  │
 │  • Layer 6: Multi-Sig / Human Approvals (> $20.00 USDC)│
 └───────┬───────────────────────┬────────────────────────┘
         │ [Violated / Risky]    │ [Compliant Spend]
         ▼                       ▼
 ┌──────────────────────┐  ┌──────────────────────────────────┐
 │ HTTP 400/403/422/202 │  │ Settlement Engine (Multi-Rail)   │
 │ • Policy Block       │  │ • Circle Developer Wallets (Base)│
 │ • Fraud Auto-Freeze  │  │ • Cross-Chain (Arb / Solana)     │
 │ • Queued for Human   │  │ • Ephemeral Virtual Cards (VCC)  │
 └──────────────────────┘  │ • Oracle FX Engine (EUR/GBP/JPY) │
                           └───────────────┬──────────────────┘
                                           │
         ┌─────────────────────────────────┴────────────────────────┐
         │                                                          │
         ▼                                                          ▼
 ┌───────────────────────────────┐          ┌───────────────────────────────┐
 │ Double-Entry Financial Ledger │          │ Webhook Delivery & Event Bus  │
 │ • Atomic DEBIT / CREDIT Lines │          │ • HMAC-SHA256 Signatures      │
 │ • Zero-Drift Balance Audit    │          │ • Exponential Backoff Retries │
 └───────────────┬───────────────┘          └───────────────┬───────────────┘
                 │                                          │
                 ▼                                          ▼
 ┌──────────────────────────────────────────────────────────────────────────┐
 │           Supabase / PostgreSQL & Real-Time Next.js Dashboard            │
 │  • Live Volume & Spend Sliders    • API Key Manager (ag_live_...)        │
 │  • Real-Time Transaction Ledger   • Human Approval Review Queue          │
 │  • Compliance Audit Trail Logs    • Prometheus Metrics (/metrics)        │
 └──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Production Architecture Implementation Matrix (Days 1 - 20)

| Day | Module / Architecture Focus | Implementation Files | Verification Script |
| :--- | :--- | :--- | :--- |
| **Day 1-4** | Circle Programmable Wallets & Policy MVP | `backend/src/services/transfer.ts` | `npm run demo` |
| **Day 5** | Multi-Tenant API Keys & Dynamic Policies | `backend/src/services/apiKeyService.ts` | `npm run test:day5` |
| **Day 6** | TypeScript SDK & LangChain Tool | `backend/src/sdk/index.ts`, `langchain.ts` | `npm run test:day6` |
| **Day 7** | Commercial Strategy & Pitch Deck | `docs/PITCH_DECK.md`, `BUSINESS_PLAN.md` | Verified |
| **Day 8** | Edge Validation, Rate Limiter & Guardrails | `rateLimiter.ts`, `validate.ts`, `envGuard.ts` | `npm run test:day8` |
| **Day 9** | Webhook Engine & HMAC-SHA256 Signatures | `webhookService.ts`, `webhookRoutes.ts` | `npm run test:day9` |
| **Day 10** | Multi-RPC Provider & Gas Price Resiliency | `rpcProvider.ts`, `chainConfig.ts` | `npm run test:day10` |
| **Day 11** | Ephemeral Virtual Credit Card (VCC) Issuing | `cardService.ts`, `20261011_virtual_cards.sql` | `npm run test:day11` |
| **Day 12** | Multi-Currency FX Engine & Cross-Chain Routing | `fxService.ts`, `chainAdapter.ts` | `npm run test:day12` |
| **Day 13** | Double-Entry Financial Ledger & Zero-Drift | `ledgerService.ts`, `20261013_ledger.sql` | `npm run test:day13` |
| **Day 14** | ML Anomaly Detection & Fraud Firewall | `anomalyEngine.ts`, `POST /agents/:id/unfreeze`| `npm run test:day14` |
| **Day 15** | Multi-Sig & Human-in-the-Loop Approvals | `approvalService.ts`, `/approvals/pending` | `npm run test:day15` |
| **Day 16** | Sub-Agent Hierarchies & Parent-Child Budgets| `hierarchyService.ts`, `/agents/hierarchy/link`| `npm run test:day16` |
| **Day 17** | Developer Web Dashboard (React + Tailwind) | `frontend/app/dashboard/page.tsx` | Production Build Passed |
| **Day 18** | Enterprise SSO & Role-Based Access Control | `rbac.ts`, `20261018_rbac.sql` | `npm run test:day18` |
| **Day 19** | Dockerization, CI/CD & Observability | `Dockerfile`, `docker-compose.yml`, `ci.yml` | `curl /health`, `/metrics` |
| **Day 20** | Master E2E Verification & Public Launch | `backend/scripts/testMasterE2E.ts` | `npm run test:master` |

---

## 3. Quickstart & Installation

### Prerequisites
* **Node.js**: `v20.x` or higher
* **Package Manager**: `npm` (v9+) or `bun`
* **Docker & Docker Compose**: (Optional for containerized run)
* **Supabase Account**: (Optional cloud instance, in-memory fallbacks active for local tests)
* **Circle Developer Credentials**: For live Base Sepolia testnet execution

### Setup Commands

```bash
# 1. Clone repository
git clone https://github.com/samuelvinod135-spec/agenticpay.git
cd agenticpay

# 2. Install dependencies across monorepo
npm install
npm install --prefix backend
npm install --prefix frontend

# 3. Configure environment variables
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

### Running Locally

```bash
# Start Backend Express Gateway (Port 4000)
npm run dev:backend

# Start Next.js Developer Web Dashboard (Port 3000)
npm run dev:frontend
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to view the Developer Web Dashboard.

### Running with Docker Compose

```bash
# Spin up Backend, PostgreSQL, and Redis in isolated containers
docker compose up -d

# Check service health
docker compose ps
curl http://localhost:4000/health
curl http://localhost:4000/metrics
```

---

## 4. API Reference Documentation

### Core Financial Rails & Payments
| Method | Endpoint | Description | Auth / Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/payments/transfer` | Execute policy-verified transfer (triggers Circle on Base Sepolia) | `ADMIN`, `DEVELOPER` |
| `GET` | `/api/v1/transactions` | Query chronological transaction ledger | `ADMIN`, `DEV`, `AUDITOR` |
| `GET` | `/api/v1/agents/:id` | Fetch agent details, linked wallet, and active daily budget | Public / Bearer |
| `GET` | `/api/v1/agents/:id/policy` | Query dynamic policy limits and rolling 24h spend | Public / Bearer |
| `PUT` | `/api/v1/agents/:id/policy` | Update agent policy caps dynamically | `ADMIN` only |

### Virtual Credit Cards (VCC)
| Method | Endpoint | Description | Auth / Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/cards/issue` | Issue ephemeral Visa/Mastercard virtual card with spending cap | `ADMIN`, `DEVELOPER` |
| `GET` | `/api/v1/cards/:id` | Query virtual card balance and status | `ADMIN`, `DEV`, `AUDITOR` |
| `POST` | `/api/v1/cards/:id/authorize` | Simulate merchant card swipe authorization against MCC whitelist | System / Merchant |

### Approvals & Human-in-the-Loop Queue
| Method | Endpoint | Description | Auth / Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/approvals/pending` | Query transfers paused in `PENDING_HUMAN_APPROVAL` (> $20.00 USDC) | `ADMIN`, `DEVELOPER` |
| `POST` | `/api/v1/approvals/:id/decide` | Human operator decision (`APPROVE` or `REJECT`) | `ADMIN` only |

### Sub-Agent Hierarchy & Budgets
| Method | Endpoint | Description | Auth / Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/agents/hierarchy/link` | Bind worker agent under orchestrator umbrella cap | `ADMIN` |
| `GET` | `/api/v1/agents/:id/hierarchy` | Query agent family tree and aggregate umbrella spend | All |

### Multi-Tenant Keys & RBAC SSO
| Method | Endpoint | Description | Auth / Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/organizations/keys` | Generate new `ag_live_...` API key | `ADMIN` only |
| `POST` | `/api/v1/organization/members` | Assign `ADMIN`, `DEVELOPER`, or `AUDITOR` role | `ADMIN` only |
| `GET` | `/api/v1/audit-logs` | Query immutable firewall compliance audit trail | `ADMIN`, `DEV`, `AUDITOR` |

### Observability & Health
| Method | Endpoint | Description | Auth / Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | System health, uptime, and database connectivity status | Public |
| `GET` | `/metrics` | Prometheus metrics for firewall evaluations, blocks, and memory | Public / Scraper |

---

## 5. Verification & Test Suite Matrix

Execute the individual or master verification test runners:

```bash
# Day 8: Security Hardening & Edge Zod Validation
npm run test:day8

# Day 9: Webhook Delivery & HMAC-SHA256 Signatures
npm run test:day9

# Day 10: Multi-RPC Resiliency & Gas Spike Safeguards
npm run test:day10

# Day 11: Ephemeral Virtual Credit Card (VCC) Issuing & Auth
npm run test:day11

# Day 12: Multi-Currency FX Engine & Cross-Chain Routing
npm run test:day12

# Day 13: Double-Entry Financial Ledger & Zero-Drift Balance
npm run test:day13

# Day 14: ML Fraud Firewall & Velocity Anomaly Detection
npm run test:day14

# Day 15: Multi-Sig & Human-in-the-Loop Approvals
npm run test:day15

# Day 16: Sub-Agent Hierarchies & Parent Umbrella Budgets
npm run test:day16

# Day 18: Enterprise SSO & Role-Based Access Control (RBAC)
npm run test:day18

# Day 20: Master End-to-End System Integration Suite (Days 1 - 20)
npm run test:master
```

---

## 6. Production CI/CD Pipeline

The `.github/workflows/ci.yml` pipeline automatically executes on pull requests and pushes to `main`:
1. Installs monorepo dependencies.
2. Compiles backend TypeScript (`npm run build:backend`).
3. Compiles frontend Next.js production bundle (`npm run build:frontend`).
4. Launches the backend daemon and executes all module tests from Day 8 to 18.
5. Runs the Master E2E System Integration Suite (`npm run test:master`).

---

## 7. License

MIT License © 2026 AgenticPay Team.
