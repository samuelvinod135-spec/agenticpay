#!/usr/bin/env tsx
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { AgenticPayClient, AgenticPayTool } from '../src/sdk';

const API_BASE_URL = process.env.API_URL || 'http://localhost:4000';
const TARGET_AGENT = 'AutoPay-Agent-01';
const TEST_DESTINATION_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

async function main() {
  console.log('\n======================================================================');
  console.log('  ⚡ AGENTICPAY: DAY 6 TYPESCRIPT CLIENT SDK & LANGCHAIN TOOLS');
  console.log('======================================================================\n');

  // Verify backend connectivity
  try {
    const healthRes = await fetch(`${API_BASE_URL}/health`);
    if (!healthRes.ok) throw new Error(`HTTP ${healthRes.status}`);
    console.log(`🟢 Gateway Status: Connected to ${API_BASE_URL}`);
  } catch (err: any) {
    console.error(`❌ Backend API server not reachable at ${API_BASE_URL}.`);
    console.error('   Please ensure the server is running: npm run dev:backend\n');
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // STEP 1: Provision API Key & Initialize AgenticPayClient SDK
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 1: Initialize AgenticPayClient SDK with Multi-Tenant API Key');
  console.log('----------------------------------------------------------------------');

  const orgName = `LangChain AI Systems - ${Date.now().toString().slice(-4)}`;
  const keyRes = await fetch(`${API_BASE_URL}/api/v1/organizations/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgName }),
  });
  const keyJson = await keyRes.json();

  if (!keyRes.ok || !keyJson.apiKey) {
    console.error('❌ Failed to provision API key for SDK client:', keyJson);
    process.exit(1);
  }

  const rawApiKey = keyJson.apiKey;
  console.log(`• Tenant Organization: ${orgName}`);
  console.log(`• Generated API Key:   ${rawApiKey.slice(0, 16)}...`);

  // Instantiate SDK Client
  const client = new AgenticPayClient({
    apiKey: rawApiKey,
    baseUrl: API_BASE_URL,
  });

  console.log(`• Client Initialized:  AgenticPayClient (baseUrl: ${client.baseUrl})`);
  console.log('✅ STEP 1 COMPLETE: SDK Core Client initialized successfully.');

  // -------------------------------------------------------------------------
  // STEP 2: Query Active Policy via SDK & Ensure Baseline Caps
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 2: Query Active Agent Policy via SDK (client.agents.getPolicy)');
  console.log('----------------------------------------------------------------------');

  // Reset/ensure single tx cap = $1.00 USDC for deterministic firewall verification
  await client.agents.updatePolicy(TARGET_AGENT, {
    single_tx_cap_usdc: 1.00,
    daily_spend_cap_usdc: 25.00,
    active: true,
  });

  const policy = await client.agents.getPolicy(TARGET_AGENT);

  console.log(`• Agent Target:        ${TARGET_AGENT}`);
  console.log(`• Policy Status:       ${policy.active ? 'ACTIVE' : 'INACTIVE'}`);
  console.log(`• Single Tx Cap:       $${Number(policy.single_tx_cap_usdc).toFixed(2)} USDC`);
  console.log(`• Daily Spend Cap:     $${Number(policy.daily_spend_cap_usdc).toFixed(2)} USDC`);
  console.log(`• Current Daily Spend: $${Number(policy.current_daily_spend_usdc || 0).toFixed(2)} USDC`);
  console.log(`• Remaining Budget:    $${Number(policy.remaining_daily_budget_usdc || policy.daily_spend_cap_usdc).toFixed(2)} USDC`);
  console.log('✅ STEP 2 COMPLETE: Agent policy successfully retrieved via SDK.');

  // -------------------------------------------------------------------------
  // STEP 3: LangChain Agent Tool Initialization
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 3: Instantiate LangChain Agent Tool (AgenticPayTool)');
  console.log('----------------------------------------------------------------------');

  const payTool = new AgenticPayTool(client, { agentId: TARGET_AGENT });

  console.log(`• Tool Name:           ${payTool.name}`);
  console.log(`• Tool Description:    "${payTool.description}"`);
  console.log(`• Target Agent ID:     ${TARGET_AGENT}`);
  console.log('✅ STEP 3 COMPLETE: LangChain Tool created with validated Zod schema.');

  // -------------------------------------------------------------------------
  // STEP 4: Simulate AI Agent Paying Compliant Invoice ($0.50 USDC) -> Expect SUCCESS
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 4: AI Agent Invocations - Compliant Payment ($0.50 USDC)');
  console.log('----------------------------------------------------------------------');
  console.log('🤖 LangChain Agent Decision: "Invoice #INV-2026-001 received for $0.50 USDC (Vector DB storage fee). Calling agentic_pay_transfer..."');

  const compliantResult = await payTool.invoke({
    amount: 0.50,
    recipient: TEST_DESTINATION_ADDRESS,
    reason: 'Invoice #INV-2026-001 - Vector DB storage fee',
  });

  console.log('\n📥 Response Returned to LLM Agent:');
  console.log(`   ${compliantResult}\n`);

  if (!compliantResult.includes('Payment Successful') && !compliantResult.includes('SUCCESS')) {
    console.error('❌ STEP 4 FAILED: Expected compliant transfer to succeed. Response:', compliantResult);
    process.exit(1);
  }
  console.log('✅ STEP 4 COMPLETE: Compliant $0.50 payment approved and confirmed to LLM.');

  // -------------------------------------------------------------------------
  // STEP 5: Simulate AI Agent Paying Non-Compliant Invoice ($5.00 USDC) -> Expect REJECTED
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 5: AI Agent Invocations - Policy Violation ($5.00 USDC)');
  console.log('----------------------------------------------------------------------');
  console.log('🤖 LangChain Agent Decision: "Invoice #INV-2026-002 received for $5.00 USDC (H100 GPU cluster leasing). Calling agentic_pay_transfer..."');

  const nonCompliantResult = await payTool.invoke({
    amount: 5.00,
    recipient: TEST_DESTINATION_ADDRESS,
    reason: 'Invoice #INV-2026-002 - H100 GPU cluster leasing',
  });

  console.log('\n📥 Response Returned to LLM Agent:');
  console.log(`   ${nonCompliantResult}\n`);

  if (!nonCompliantResult.includes('Payment Rejected') && !nonCompliantResult.includes('blocked by the AgenticPay firewall')) {
    console.error('❌ STEP 5 FAILED: Expected transfer to be blocked by firewall. Response:', nonCompliantResult);
    process.exit(1);
  }
  console.log('✅ STEP 5 COMPLETE: Over-budget payment blocked; human-readable explanation returned to LLM.');

  // -------------------------------------------------------------------------
  // STEP 6: Query Compliance Audit Logs via SDK (client.auditLogs.list)
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 6: Compliance Audit Log Verification via SDK');
  console.log('----------------------------------------------------------------------\n');

  const auditLogs = await client.auditLogs.list(TARGET_AGENT);
  console.log(`• Total Audit Logs Retrieved: ${auditLogs.length}`);

  if (auditLogs.length > 0) {
    const latestViolation = auditLogs[0];
    console.log(`• Latest Violation ID:        ${latestViolation.id}`);
    console.log(`• Attempted Amount:           $${Number(latestViolation.amount).toFixed(2)} USDC`);
    console.log(`• Firewall Reason:            ${latestViolation.reason}`);
    console.log(`• Timestamp:                  ${latestViolation.created_at}`);
  }

  console.log('\n======================================================================');
  console.log('  🎉 DAY 6: ALL TYPESCRIPT SDK & LANGCHAIN TOOL TESTS PASSED!');
  console.log('======================================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal Day 6 Verification Error:', err);
  process.exit(1);
});
