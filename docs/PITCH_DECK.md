# AgenticPay: Investor Pitch Deck

---

## Slide 1: Title & Tagline

```text
       ___                         __   _      ____             
      /   | ____ ____  ____  / /_ (_)____/ __ \____ ___  __
     / /| |/ __ `/ _ \/ __ \/ __// / ___/ /_/ / __ `/ / / /
    / ___ / /_/ /  __/ / / / /_ / / /__/ ____/ /_/ / /_/ / 
   /_/  |_\__, /\___/_/ /_/\__//_/\___/_/    \__,_/\__, /  
         /____/                                   /____/   
```

### **The Enterprise Financial Firewall for Autonomous AI Agents**

*Programmatic micro-wallets, sub-cent settlement, and mathematical spending guardrails for the agentic economy.*

- **Company:** AgenticPay Inc.
- **Founders:** Core Engineering & Infrastructure Team
- **Stage:** Pre-Seed / Seed
- **Website & Documentation:** [https://agenticpay.io](https://agenticpay.io)

---

## Slide 2: The Problem

### **AI Agents Are Gaining Autonomy, But Enterprises Cannot Hand Them Credit Cards**

As developers transition from passive chat interfaces to autonomous agents (LangChain, AutoGPT, CrewAI, Eliza) that purchase compute, scrape datasets, book services, and hire sub-agents, **financial infrastructure remains trapped in the Web2 era**.

```
   ┌──────────────────┐           ❌ Rogue Loops             ┌──────────────────┐
   │ Autonomous Agent │ ───────────────────────────────────> │ Corporate Card   │
   │ (Unconstrained)  │      $50,000 AWS bill in 20 mins     │ ($100k Limit)    │
   └──────────────────┘                                      └──────────────────┘
```

1. **Catastrophic Infinite API Loops:** A logic flaw or hallucination can exhaust a company credit card in minutes with uncontrolled external API calls.
2. **Web2 Corporate Cards Are Incompatible with Autonomous Code:** Legacy credit cards require 2FA SMS prompts, zip codes, and CAPTCHAs. Exposing raw corporate card details to autonomous scripts invites catastrophic security leakage.
3. **No Granular Spending Limits or Whitelists:** Existing corporate cards offer coarse monthly limits, but cannot enforce single-transaction caps (e.g., "$0.50 per task"), destination EVM address whitelists, or rolling 24-hour budgets.
4. **No Machine-to-Machine Micro-Settlements:** Traditional interchange fees ($0.30 + 2.9%) make sub-dollar automated agent payments economically impossible.

---

## Slide 3: The Solution

### **AgenticPay: Autonomous Financial Firewall & Instant Settlement Rail**

AgenticPay acts as an intelligent intermediary proxy between autonomous AI agents and programmatic settlement rails.

```
┌──────────────────┐       1. Request Transfer ($0.50)       ┌────────────────────────┐
│ LangChain Agent  │ ──────────────────────────────────────> │ AgenticPay Firewall    │
└──────────────────┘                                         └───────────┬────────────┘
                                                                         │
                                                             2. Policy Evaluation
                                                                • Single Tx Cap: $1.00 (PASS)
                                                                • Daily Spend: $8.50/$25 (PASS)
                                                                • Whitelist: Verified (PASS)
                                                                         │
                                                                         ▼
                                                             ┌────────────────────────┐
                                                             │ Circle MPC Wallet Engine│
                                                             └───────────┬────────────┘
                                                                         │
                                                             3. Sub-cent USDC Settlement
                                                                         ▼
                                                             ┌────────────────────────┐
                                                             │ Base Network (L2)      │
                                                             └────────────────────────┘
```

- **Dynamic Policy Firewall:** Millisecond policy evaluation enforces single-transaction hard caps, rolling 24-hour spend limits, destination address whitelists, and time-of-day access control.
- **Non-Custodial Developer-Controlled Wallets:** Integrated with Circle Web3 Services MPC architecture; keys are never stored on plaintext servers.
- **Sub-Cent Micro-Settlement on Base (USDC):** Real-time blockchain finality with gas fees under $0.005, making micro-transactions viable.
- **One-Line LangChain & LlamaIndex SDK:** Turnkey drop-in tools allowing any autonomous agent to initiate policy-safe payments with zero blockchain boilerplate.
- **Immutable Audit Trails:** Real-time database logging and compliance ledger for every transaction, approved or blocked.

---

## Slide 4: Market Opportunity

### **The Intersection of Autonomous AI and Machine-to-Machine Payments**

```
     ┌────────────────────────────────────────────────────────┐
     │  Total Addressable Market (TAM): $48.2 Billion         │
     │  Global AI Agents & Autonomous Infrastructure (2030)   │
     └───────────────────────────┬────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │  Serviceable Available Market │
                 │  (SAM): $12.4 Billion         │
                 │  API Infrastructure & M2M Pay │
                 └───────────────┬───────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │  Serviceable Obtainable Market│
                 │  (SOM): $950 Million          │
                 │  AI Agent Financial Rails     │
                 └───────────────────────────────┘
```

- **100M+ Autonomous Agents by 2028:** Gartner forecasts that 33% of enterprise software interactions will involve autonomous AI agents by 2028.
- **The Shift from Human Checkout to Agentic Procurement:** Invoices, API credits, data feeds, and compute rentals will be transacted programmatically without human touchpoints.
- **First-Mover Advantage:** While wallet infrastructure exists for human Web3 consumers, AgenticPay is built from the ground up specifically for autonomous AI runtime environments.

---

## Slide 5: Product Architecture & Security

### **Enterprise-Grade Security Architecture**

```
 ┌───────────────────────────────────────────────────────────────────────────────┐
 │                            AI AGENT RUNTIME LAYER                             │
 │  LangChain Agent / CrewAI / ElizaOS / AutoGen / Python SDK / TypeScript SDK    │
 └──────────────────────────────────────┬────────────────────────────────────────┘
                                        │ Bearer ag_live_...
                                        ▼
 ┌───────────────────────────────────────────────────────────────────────────────┐
 │                       AGENTICPAY POLICY FIREWALL API                          │
 │  • Multi-Tenant API Key Authentication (SHA-256 Hashed, Instant Revocation)   │
 │  • Dynamic Policy Engine (Single Tx Cap, 24h Rolling Budget, Whitelists)     │
 │  • Audit Log Compliance Dispatcher                                            │
 └───────────────────┬───────────────────────────────────────┬───────────────────┘
                     │ Valid Transfer                        │ Rejected
                     ▼                                       ▼
 ┌───────────────────────────────────────┐   ┌───────────────────────────────────┐
 │  CIRCLE PROGRAMMABLE WALLETS (MPC)    │   │ AUDIT LOG LEDGER & COMPLIANCE     │
 │  Developer-Controlled MPC Key Shards  │   │ Stored in Supabase RLS            │
 └───────────────────┬───────────────────┘   │ Real-time Webhook Alert to SecOps │
                     │ Broadcast Tx          └───────────────────────────────────┘
                     ▼
 ┌───────────────────────────────────────────────────────────────────────────────┐
 │                        SETTLEMENT & BLOCKCHAIN LAYER                          │
 │  Base Sepolia / Base Mainnet (Official USDC Contract: 0x036C...cF7e)          │
 │  Circle Developer Webhook Listener -> Real-time Explorer Sync                 │
 └───────────────────────────────────────────────────────────────────────────────┘
```

- **Zero-Trust Key Management:** Developers and agents never handle private keys; all transactions are routed through hardware-isolated MPC clusters.
- **Cryptographic Auditability:** Every rejection records the triggering policy, exact agent ID, requested amount, and timestamp into an append-only audit trail.
- **Sub-50ms Latency Overhead:** Policy evaluations occur in-memory with PostgreSQL caching, ensuring zero impact on LLM reasoning loops.

---

## Slide 6: Business Model & Pricing Tiers

### **Predictable SaaS Base + Scalable Volume Take Rate**

| Feature Tier | **Developer** | **Pro** | **Enterprise** |
| :--- | :--- | :--- | :--- |
| **Monthly Subscription** | **$0 / month** | **$99 / month** | **$999 / month** |
| **Transaction Fee (Take Rate)** | 1.0% + $0.05 | 0.4% + $0.02 | 0.15% (Volume Tiers) |
| **Active Autonomous Agents** | Up to 3 Agents | Up to 25 Agents | Unlimited Agents |
| **Monthly Transfer Volume** | Up to $1,000 USDC | Up to $25,000 USDC | Unlimited ($1M+ USDC) |
| **Policy Firewall Features** | Single Tx Caps | Rolling 24h Caps & Whitelists | Restricted Hours, Custom AI Policies |
| **API Keys & Multi-Tenancy** | 1 API Key | 10 API Keys | Unlimited Multi-Tenant Keys |
| **Support & SLA** | Community Support | Priority Email Support | 99.99% Uptime SLA + Dedicated Slack |

---

## Slide 7: Competitive Landscape & Defensive Moat

### **Why Raw Wallet Providers and Traditional FinTech Fail at Agentic Payments**

```
                         HIGH FINANCIAL CONTROL & FIREWALL
                                         ▲
                                         │
                                         │       ★ AgenticPay
                                         │       (Firewall + Micro-Settlement)
                                         │
                   Ramp / Brex           │
                   (Web2 Corporate Card) │
                                         │
 ── LEGACY WEB2 RAILS ───────────────────┼─────────────────── PROGRAMMABLE WEB3 RAILS ──►
                                         │
                   Stripe Connect        │       Privy / Dynamic / Turnkey
                   (Developer APIs)      │       (Raw Key & Wallet Infra)
                                         │
                                         ▼
                          LOW FIREWALL / INFRASTRUCTURE ONLY
```

### **Our Defensive Moat:**
1. **Firewall-First Architecture:** Unlike raw MPC wallet providers (Privy, Turnkey) who only provide key storage, AgenticPay is an intelligent governance layer that prevents unauthorized financial operations before keys are ever invoked.
2. **AI Framework Integration Flywheel:** Native LangChain, LlamaIndex, and CrewAI tools make AgenticPay the default tool in every agent developer's requirements file.
3. **Multi-Rail Flexibility:** While competitors are locked into either Web2 fiat cards or crypto-only wallets, AgenticPay's architecture supports USDC settlement today and Virtual Credit Card (VCC) rails tomorrow.

---

## Slide 8: Go-To-Market (GTM) Plan

### **Developer-Led Bottom-Up Adoption with Enterprise Conversion**

```
┌─────────────────────────────────┐
│  PHASE 1: DEVELOPER ADOPTION    │  • Native LangChain & LlamaIndex Official Tool Directory
│  (Months 1 - 3)                 │  • Sponsorship of top AI Hackathons (SF, NYC, London)
│                                 │  • Open-source SDK & permissive free tier (up to $1,000/mo)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  PHASE 2: AGENT SAAS PLATFORMS  │  • B2B integrations with autonomous agent platforms (AutoGPT, CrewAI)
│  (Months 4 - 8)                 │  • Co-marketing with Base & Circle Ecosystem Grant programs
│                                 │  • Self-serve Pro tier upgrade funnel
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  PHASE 3: ENTERPRISE EXPANSION  │  • SOC2 Type II compliance & HIPAA compliance
│  (Months 9 - 12)                │  • Virtual Credit Card issuing for legacy Web2 enterprise bills
│                                 │  • Dedicated Enterprise Account Execs targeting Fortune 500 AI labs
└─────────────────────────────────┘
```

- **Target Q4 2027 Goals:**
  - **15,000+** Active AI Agents Powered
  - **$12M+** Monthly Transaction Volume
  - **$1.8M** Annual Recurring Revenue (ARR)

---

## Slide 9: The Ask & Use of Funds

### **Raising $2.5M Seed Round**

- **Target Raise:** $2,500,000 USD
- **Instrument:** SAFE (Simple Agreement for Future Equity) / Preferred Equity
- **Allocation:**
  - **60% Core Engineering:** Distributed systems, cryptography, zero-knowledge compliance, LangChain/LlamaIndex core contributors.
  - **20% Compliance & Banking Integrations:** Financial licenses, MSB registration, Lithic/Stripe Treasury banking rails.
  - **15% Developer Relations & Growth:** Hackathon sponsorships, documentation, community advocates, enterprise pilots.
  - **5% Security Audits:** Formal verification of smart policies and third-party penetration testing.

---

### **Contact & Follow-Up**

- **Team:** [founders@agenticpay.io](mailto:founders@agenticpay.io)
- **Repository:** [https://github.com/agenticpay/agenticpay](https://github.com/agenticpay/agenticpay)
- **Interactive Live Dashboard:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
