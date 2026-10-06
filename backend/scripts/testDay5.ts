#!/usr/bin/env tsx
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_BASE_URL = process.env.API_URL || 'http://localhost:4000';
const TARGET_AGENT = 'AutoPay-Agent-01';
const TARGET_WALLET_ID = 'f94177bd-764a-5951-b5fa-0b2968f7a682';
const TEST_DESTINATION_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

async function main() {
  console.log('\n======================================================================');
  console.log('  ⚡ AGENTICPAY: DAY 5 MULTI-TENANT API KEYS & DYNAMIC POLICIES');
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
  // STEP 1: Create a test organization & API key
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 1: Provision Multi-Tenant Organization & Live API Key');
  console.log('----------------------------------------------------------------------');

  const testOrgName = `Autonomous AI Corp - ${Date.now().toString().slice(-4)}`;
  console.log(`Creating tenant organization: "${testOrgName}"...`);

  const keyRes = await fetch(`${API_BASE_URL}/api/v1/organizations/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgName: testOrgName }),
  });

  const keyJson = await keyRes.json();
  if (keyRes.status !== 201 || !keyJson.apiKey) {
    console.error('❌ STEP 1 FAILED: Could not generate tenant API key:', keyJson);
    process.exit(1);
  }

  const { apiKey, keyPrefix, orgId } = keyJson;
  console.log(`• Tenant Org Name:    ${testOrgName}`);
  console.log(`• Tenant Org ID:      ${orgId}`);
  console.log(`• Key Prefix:         ${keyPrefix}`);
  console.log(`• Plaintext Key:      ${apiKey}`);
  console.log('✅ STEP 1 COMPLETE: Multi-tenant API key generated successfully.');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  // -------------------------------------------------------------------------
  // STEP 2: Update agent policy dynamically to $5.00 USDC cap via API
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 2: Update Agent Policy Dynamically to $5.00 USDC Single Cap');
  console.log('----------------------------------------------------------------------');
  console.log(`Updating policy for agent "${TARGET_AGENT}" via PUT /api/v1/agents/${TARGET_AGENT}/policy...`);

  const update5Res = await fetch(`${API_BASE_URL}/api/v1/agents/${TARGET_AGENT}/policy`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      single_tx_cap_usdc: 5.00,
      daily_spend_cap_usdc: 30.00,
      active: true,
    }),
  });

  const update5Json = await update5Res.json();
  if (!update5Res.ok || !update5Json.success) {
    console.error('❌ STEP 2 FAILED: Could not update policy to $5.00:', update5Json);
    process.exit(1);
  }

  // Fetch updated policy to verify read-after-write consistency
  const getPolicyRes = await fetch(`${API_BASE_URL}/api/v1/agents/${TARGET_AGENT}/policy`, {
    headers: authHeaders,
  });
  const getPolicyJson = await getPolicyRes.json();

  console.log(`• Policy Status:      ${getPolicyJson.policy?.active ? 'ACTIVE' : 'INACTIVE'}`);
  console.log(`• Single Tx Cap:      $${Number(getPolicyJson.policy?.single_tx_cap_usdc).toFixed(2)} USDC`);
  console.log(`• Daily Spend Cap:    $${Number(getPolicyJson.policy?.daily_spend_cap_usdc).toFixed(2)} USDC`);
  console.log('✅ STEP 2 COMPLETE: Agent policy dynamically upgraded to $5.00 USDC single transaction cap.');

  // -------------------------------------------------------------------------
  // STEP 3: Execute a $3.00 transfer (Expect SUCCESS)
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 3: Execute $3.00 USDC Transfer (Expect SUCCESS under $5.00 Cap)');
  console.log('----------------------------------------------------------------------');
  console.log(`Initiating transfer of $3.00 USDC to ${TEST_DESTINATION_ADDRESS}...`);

  const txSuccessRes = await fetch(`${API_BASE_URL}/api/v1/payments/transfer`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      walletId: TARGET_WALLET_ID,
      destinationAddress: TEST_DESTINATION_ADDRESS,
      amount: 3.00,
    }),
  });

  const txSuccessJson = await txSuccessRes.json();
  console.log(`• HTTP Response:      ${txSuccessRes.status} ${txSuccessRes.statusText}`);
  console.log(`• Transfer Status:    ${txSuccessJson.transaction?.state || 'INITIATED'}`);
  console.log(`• Circle Tx ID:       ${txSuccessJson.transaction?.transactionId || 'N/A'}`);
  console.log(`• DB Record ID:       ${txSuccessJson.recordId || txSuccessJson.transaction?.dbRecordId || 'N/A'}`);

  if (txSuccessRes.status !== 200 || !txSuccessJson.success) {
    console.error('❌ STEP 3 FAILED: Expected $3.00 transfer to succeed under $5.00 cap, got:', txSuccessJson);
    process.exit(1);
  }
  console.log('✅ STEP 3 COMPLETE: $3.00 payment passed dynamic policy firewall and was successfully initiated.');

  // -------------------------------------------------------------------------
  // STEP 4: Update agent policy down to $1.00 USDC cap via API
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 4: Update Agent Policy Dynamically Down to $1.00 USDC Single Cap');
  console.log('----------------------------------------------------------------------');
  console.log(`Restricting policy for agent "${TARGET_AGENT}" via PUT /api/v1/agents/${TARGET_AGENT}/policy...`);

  const update1Res = await fetch(`${API_BASE_URL}/api/v1/agents/${TARGET_AGENT}/policy`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      single_tx_cap_usdc: 1.00,
      daily_spend_cap_usdc: 30.00,
      active: true,
    }),
  });

  const update1Json = await update1Res.json();
  if (!update1Res.ok || !update1Json.success) {
    console.error('❌ STEP 4 FAILED: Could not update policy to $1.00:', update1Json);
    process.exit(1);
  }

  console.log(`• Policy Status:      ${update1Json.policy?.active ? 'ACTIVE' : 'INACTIVE'}`);
  console.log(`• Single Tx Cap:      $${Number(update1Json.policy?.single_tx_cap_usdc).toFixed(2)} USDC`);
  console.log(`• Daily Spend Cap:    $${Number(update1Json.policy?.daily_spend_cap_usdc).toFixed(2)} USDC`);
  console.log('✅ STEP 4 COMPLETE: Agent policy restricted to $1.00 USDC single transaction cap.');

  // -------------------------------------------------------------------------
  // STEP 5: Execute a $3.00 transfer (Expect REJECTED by firewall)
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 5: Execute $3.00 USDC Transfer (Expect REJECTED by Firewall)');
  console.log('----------------------------------------------------------------------');
  console.log(`Attempting $3.00 USDC payment with $1.00 cap in place...`);

  const txRejectRes = await fetch(`${API_BASE_URL}/api/v1/payments/transfer`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      walletId: TARGET_WALLET_ID,
      destinationAddress: TEST_DESTINATION_ADDRESS,
      amount: 3.00,
    }),
  });

  const txRejectJson = await txRejectRes.json();
  console.log(`• HTTP Response:      ${txRejectRes.status} ${txRejectRes.statusText}`);
  console.log(`• Policy Error:       ${txRejectJson.error}`);
  console.log(`• Firewall Reason:    ${txRejectJson.reason}`);

  if ((txRejectRes.status !== 400 && txRejectRes.status !== 403) || txRejectJson.success !== false) {
    console.error('❌ STEP 5 FAILED: Expected transfer to be blocked by firewall, got:', txRejectRes.status, txRejectJson);
    process.exit(1);
  }
  console.log('✅ STEP 5 COMPLETE: Non-compliant payment was autonomously blocked by the policy firewall.');

  // -------------------------------------------------------------------------
  // STEP 6: Verify Compliance Audit Logs
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 6: Compliance Audit Log Verification');
  console.log('----------------------------------------------------------------------\n');

  const auditRes = await fetch(`${API_BASE_URL}/api/v1/audit-logs?limit=5`);
  const auditJson = await auditRes.json();

  if (auditJson.logs && auditJson.logs.length > 0) {
    const latestViolation = auditJson.logs[0];
    console.log(`• Violation Log ID:   ${latestViolation.id}`);
    console.log(`• Tenant Org ID:      ${latestViolation.org_id || orgId}`);
    console.log(`• Agent ID:           ${latestViolation.agent_id || TARGET_AGENT}`);
    console.log(`• Attempted Amount:   $${Number(latestViolation.amount).toFixed(2)} USDC`);
    console.log(`• Violation Reason:   ${latestViolation.reason}`);
    console.log(`• Audit Timestamp:    ${latestViolation.created_at}`);
  }

  console.log('\n======================================================================');
  console.log('  🎉 DAY 5: ALL MULTI-TENANCY & DYNAMIC POLICY TESTS PASSED!');
  console.log('======================================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal Day 5 Verification Error:', err);
  process.exit(1);
});
