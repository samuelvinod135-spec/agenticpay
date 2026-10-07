# Show HN: AgenticPay – Open source financial firewall and settlement rails for AI agents

Hey HN! We built AgenticPay (https://github.com/samuelvinod135-spec/agenticpay).

### The Problem
If you've built autonomous agents with LangChain, CrewAI, AutoGen, or ElizaOS, you've probably faced the spending dilemma. 

Agents are great at reasoning, but they hallucinate, hit recursion loops, or get prompt injected. If you give an agent access to a raw private key or an unrestricted credit card, a single bad loop or prompt injection can drain your balance in seconds. 

We saw a project spend $12k overnight in runaway API tool calls because a regex didn't terminate cleanly.

### What is AgenticPay?
AgenticPay is an institutional, non-custodial financial firewall and programmable settlement engine. It sits between your agent runtime and real financial rails (Base Sepolia/Mainnet USDC via Circle Developer Wallets, Arbitrum, Solana, and ephemeral Virtual Credit Cards).

### How it Works
Before any dollar or token leaves:
1. **Edge Validation**: Rejects malformed addresses and decimal precision overflow (>4 decimals).
2. **Policy Firewall**: Checks per-transaction limit (e.g. $5.00), rolling 24h budget (e.g. $50.00), and destination whitelists.
3. **ML Velocity Anomaly Guard**: Analyzes transaction frequency; auto-freezes runaway swarms.
4. **Sub-Agent Umbrella Hierarchies**: Sub-agents draw from a parent orchestrator's allocated budget without exceeding family caps.
5. **Human-in-the-Loop Multi-Sig Queue**: Any spend above high-value thresholds ($20.00+) enters a pending queue with a 15-minute TTL.
6. **Double-Entry Ledger**: Atomic DEBIT and CREDIT lines ensure zero mathematical drift ($0.000000).
7. **KMS / Vault Signing**: Private keys never touch application memory; transactions are signed via AWS KMS or HashiCorp Vault.
8. **Global Circuit Breaker**: If >15% of transfers fail or get flagged in a 60-second window, the gateway auto-trips into `SYSTEM_QUARANTINE`.

### 3 Lines of Code Integration

**TypeScript / LangChain:**
```typescript
import { AgenticPayClient, AgenticPayLangChainTool } from '@agenticpay/sdk';

const client = new AgenticPayClient({ apiKey: 'ag_live_...' });
const tool = new AgenticPayLangChainTool(client, { agentId: 'AutoPay-Agent-01' });

// Add to your LangChain or LlamaIndex agent tools
```

**Python / CrewAI / AutoGen:**
```python
from agenticpay import AgenticPayClient
from agenticpay.tools import AgenticPayCrewTool

client = AgenticPayClient(api_key="ag_live_...")
tool = AgenticPayCrewTool(client=client, agent_id="AutoPay-Agent-01")
```

**Model Context Protocol (MCP):**
We also built a standalone MCP server for Claude Desktop and Cursor (`packages/mcp-server`) with tools:
- `agenticpay_check_budget`
- `agenticpay_transfer`
- `agenticpay_issue_vcc`
- `agenticpay_get_audit_log`

### Testing Under Concurrency
We included an automated load testing suite simulating 100 concurrent threads executing parallel double-entry writes and verified zero ledger balance drift under high lock contention (`npm run test:path1`).

The code is MIT licensed: https://github.com/samuelvinod135-spec/agenticpay  
OpenAPI 3.1 & Interactive Sandbox: http://localhost:4000/docs or https://agenticpay.ai/docs

We'd love your feedback, critiques on our policy firewall architecture, and thoughts on how your team manages agent budgets!
