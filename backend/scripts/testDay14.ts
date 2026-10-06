#!/usr/bin/env tsx
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { anomalyEngine } from '../src/services/anomalyEngine';

const API_BASE_URL = process.env.API_URL || 'http://localhost:4000';
const TEST_AGENT_ID = 'Agent-Fraud-Test-01';

async function main() {
  console.log('\n======================================================================');
  console.log('  ⚡ AGENTICPAY: DAY 14 ANOMALY DETECTION & ML FRAUD FIREWALL');
  console.log('======================================================================\n');

  // Verify backend connectivity
  try {
    const healthRes = await fetch(`${API_BASE_URL}/health`);
    if (!healthRes.ok) throw new Error(`HTTP ${healthRes.status}`);
    console.log(`🟢 Gateway Status: Connected to ${API_BASE_URL}`);
  } catch (err: any) {
    console.error(`❌ Backend API server not reachable at ${API_BASE_URL}.`);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // STEP 1: Baseline Normal Activity
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log('📌 STEP 1: Process Normal Compliant Baseline Activity');
  console.log('----------------------------------------------------------------------');

  anomalyEngine.unfreezeAgent(TEST_AGENT_ID);

  const tx1 = anomalyEngine.evaluateTransaction({
    agentId: TEST_AGENT_ID,
    amount: 0.5,
    destinationAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    isWhitelisted: true,
  });
  console.log(`• Baseline Tx #1 ($0.50): Risk Score: ${tx1.riskScore} | Allowed: ${tx1.allowed}`);

  const tx2 = anomalyEngine.evaluateTransaction({
    agentId: TEST_AGENT_ID,
    amount: 0.75,
    destinationAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    isWhitelisted: true,
  });
  console.log(`• Baseline Tx #2 ($0.75): Risk Score: ${tx2.riskScore} | Allowed: ${tx2.allowed}`);

  if (!tx1.allowed || !tx2.allowed) {
    console.error('❌ STEP 1 FAILED: Normal transactions flagged falsely');
    process.exit(1);
  }
  console.log('✅ STEP 1 COMPLETE: Baseline established within normal risk thresholds.');

  // -------------------------------------------------------------------------
  // STEP 2: Trigger Anomaly - Rapid Velocity Burst + 10x Amount Divergence
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 2: Simulate High Velocity & Amount Divergence (>4x avg)');
  console.log('----------------------------------------------------------------------');

  // Simulate multiple rapid micro-bursts to push velocity factor
  for (let i = 0; i < 4; i++) {
    anomalyEngine.evaluateTransaction({
      agentId: TEST_AGENT_ID,
      amount: 1.0,
      destinationAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      isWhitelisted: false,
    });
  }

  // Large divergence spike to unwhitelisted destination
  const fraudTx = anomalyEngine.evaluateTransaction({
    agentId: TEST_AGENT_ID,
    amount: 25.0, // >> 4x average
    destinationAddress: '0x9999999999999999999999999999999999999999',
    isWhitelisted: false,
  });

  console.log(`• Spike Transaction ($25.00) Risk Score: ${fraudTx.riskScore} (Threshold: 0.85)`);
  console.log(`• Firewall Decision:                     ${fraudTx.allowed ? 'ALLOWED' : 'BLOCKED & AUTO-FROZEN'}`);
  console.log(`• Anomaly Trigger Reason:                ${fraudTx.reason}`);

  if (fraudTx.allowed || fraudTx.riskScore <= 0.85) {
    console.error('❌ STEP 2 FAILED: Expected anomaly to trigger auto-freeze, got:', fraudTx);
    process.exit(1);
  }
  console.log('✅ STEP 2 COMPLETE: Anomaly detected; high-risk agent auto-suspended.');

  // -------------------------------------------------------------------------
  // STEP 3: Confirm Subsequent Action Blocked Due to Suspension
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 3: Verify Enforced Freeze on Subsequent Actions');
  console.log('----------------------------------------------------------------------');

  const blockedTx = anomalyEngine.evaluateTransaction({
    agentId: TEST_AGENT_ID,
    amount: 0.1,
    destinationAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    isWhitelisted: true,
  });

  console.log(`• Micro-Tx ($0.10) Attempt After Freeze: Blocked: ${!blockedTx.allowed}`);
  console.log(`• Reason: ${blockedTx.reason}`);

  if (blockedTx.allowed) {
    console.error('❌ STEP 3 FAILED: Suspended agent was allowed to transact!');
    process.exit(1);
  }
  console.log('✅ STEP 3 COMPLETE: Suspended agent locked down from any financial movement.');

  // -------------------------------------------------------------------------
  // STEP 4: Admin Unfreeze via API
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 4: Admin Unfreeze Agent via API (POST /agents/:id/unfreeze)');
  console.log('----------------------------------------------------------------------');

  const unfreezeRes = await fetch(`${API_BASE_URL}/api/v1/agents/${TEST_AGENT_ID}/unfreeze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const unfreezeJson = await unfreezeRes.json();
  console.log(`• API Unfreeze Status:    ${unfreezeRes.status}`);
  console.log(`• Agent Restored Status:  ${unfreezeJson.profile?.status}`);
  console.log(`• Success Message:        ${unfreezeJson.message}`);

  if (!unfreezeRes.ok || unfreezeJson.profile?.status !== 'ACTIVE') {
    console.error('❌ STEP 4 FAILED: Could not unfreeze agent via API:', unfreezeJson);
    process.exit(1);
  }
  console.log('✅ STEP 4 COMPLETE: Agent successfully restored to ACTIVE standing.');

  console.log('\n======================================================================');
  console.log('  🎉 DAY 14: ANOMALY DETECTION & ML FRAUD FIREWALL TESTS PASSED!');
  console.log('======================================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal Day 14 Test Error:', err);
  process.exit(1);
});
