# @agenticpay/sdk

> Institutional financial firewall & programmable settlement rails for autonomous AI agents.

## Installation

```bash
npm install @agenticpay/sdk
```

## Quickstart

```typescript
import { AgenticPayClient, AgenticPayLangChainTool } from '@agenticpay/sdk';

const client = new AgenticPayClient({
  apiKey: process.env.AGENTICPAY_API_KEY!,
  baseUrl: 'https://api.agenticpay.ai', // or http://localhost:4000
});

// 1. Check budget & policy limits
const policy = await client.policies.get('AutoPay-Agent-01');
console.log(`Daily remaining budget: $${policy.remaining_daily_budget_usdc} USDC`);

// 2. Programmatic transfer
const transfer = await client.transfers.create({
  agentId: 'AutoPay-Agent-01',
  amount: 2.50,
  recipient: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  reason: 'Cloud API credit purchase',
});

// 3. Issue Ephemeral Virtual Card (VCC)
const card = await client.cards.issue({
  agentId: 'AutoPay-Agent-01',
  limitUsdc: 50.00,
  merchantCategory: 'Cloud Hosting',
});

// 4. Double-Entry Ledger Audit
const ledgerLogs = await client.ledger.getLogs({ agentId: 'AutoPay-Agent-01' });

// 5. LangChain Agent Integration
const tool = new AgenticPayLangChainTool(client, { agentId: 'AutoPay-Agent-01' });
```
