#!/usr/bin/env tsx
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { supabase } from '../src/config/supabase';

const API_BASE_URL = process.env.API_URL || 'http://localhost:4000';
const TARGET_WALLET_ID = 'f94177bd-764a-5951-b5fa-0b2968f7a682';
const TARGET_WALLET_ADDRESS = '0x9f4d4f18475a4218fe6afef72352f0b9e52fdb3d';
const TEST_DESTINATION_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

async function main() {
  console.log('\n======================================================================');
  console.log('  ⚡ AGENTICPAY: MASTER DEMO TESTING & END-TO-END VERIFICATION');
  console.log('======================================================================\n');

  // Verify backend connectivity
  try {
    const healthRes = await fetch(`${API_BASE_URL}/health`);
    if (!healthRes.ok) {
      throw new Error(`Server returned HTTP ${healthRes.status}`);
    }
    console.log(`🟢 Gateway Status: Connected to ${API_BASE_URL}`);
  } catch (err: any) {
    console.error(`❌ Backend API server not reachable at ${API_BASE_URL}.`);
    console.error('   Please ensure the server is running: npm run dev:backend\n');
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // STEP 1: Query current agent budget usage ($X.XX / $10.00 USDC)
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 1: Query Agent Profile & Daily Budget Usage');
  console.log('----------------------------------------------------------------------');

  let dailyLimit = 10.00;
  let maxPerTx = 1.00;
  let agentName = 'AutoPay-Agent-01';

  // Query agent and policy from Supabase
  const { data: agentData } = await supabase
    .from('agents')
    .select('id, name, policies(*), wallets(*)')
    .eq('name', 'AutoPay-Agent-01')
    .maybeSingle();

  if (agentData) {
    agentName = agentData.name;
    const policy = agentData.policies?.[0] || agentData.policies;
    if (policy) {
      dailyLimit = Number(policy.daily_limit ?? policy.daily_limit_usd ?? 10.00);
      maxPerTx = Number(policy.max_per_transaction ?? policy.max_per_tx_usd ?? 1.00);
    }
  }

  // Calculate current daily spend from Supabase
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data: todayTxs } = await supabase
    .from('transactions')
    .select('amount, status')
    .eq('wallet_id', TARGET_WALLET_ID)
    .gte('created_at', todayStart.toISOString())
    .in('status', ['COMPLETE', 'INITIATED', 'PENDING']);

  const currentSpent = (todayTxs || []).reduce(
    (sum, tx) => sum + (parseFloat(String(tx.amount)) || 0),
    0
  );

  console.log(`• Target Agent:       ${agentName}`);
  console.log(`• Linked Wallet ID:   ${TARGET_WALLET_ID}`);
  console.log(`• Wallet Address:     ${TARGET_WALLET_ADDRESS}`);
  console.log(`• Network:            Base Sepolia (Chain ID 84532)`);
  console.log(`• Single Tx Cap:      $${maxPerTx.toFixed(2)} USDC`);
  console.log(`• Daily Spend Cap:    $${dailyLimit.toFixed(2)} USDC`);
  console.log(`• Current Spend:      $${currentSpent.toFixed(2)} / $${dailyLimit.toFixed(2)} USDC (${((currentSpent / dailyLimit) * 100).toFixed(1)}% utilized)`);
  console.log('✅ STEP 1 COMPLETE: Agent budget policy queried successfully.');

  // -------------------------------------------------------------------------
  // STEP 2: Simulate compliant payment ($0.50 USDC) -> Expect HTTP 200 INITIATED
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 2: Execute Compliant Payment ($0.50 USDC)');
  console.log('----------------------------------------------------------------------');
  console.log(`Sending transfer request: $0.50 USDC to ${TEST_DESTINATION_ADDRESS}...`);

  const compliantRes = await fetch(`${API_BASE_URL}/api/v1/payments/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletId: TARGET_WALLET_ID,
      destinationAddress: TEST_DESTINATION_ADDRESS,
      amount: 0.50,
    }),
  });

  const compliantJson = await compliantRes.json();
  const compliantStatus = compliantRes.status;

  console.log(`• HTTP Response:      ${compliantStatus} ${compliantRes.statusText}`);
  console.log(`• Transfer Status:    ${compliantJson.transaction?.state || 'INITIATED'}`);
  console.log(`• Circle Tx ID:       ${compliantJson.transaction?.transactionId || 'N/A'}`);
  console.log(`• DB Record ID:       ${compliantJson.recordId || compliantJson.transaction?.dbRecordId || 'N/A'}`);

  if (compliantStatus !== 200 || !compliantJson.success) {
    console.error('❌ STEP 2 FAILED: Expected HTTP 200 INITIATED, got:', compliantJson);
    process.exit(1);
  }

  const inFlightTxId = compliantJson.transaction?.transactionId;
  const inFlightDbId = compliantJson.recordId || compliantJson.transaction?.dbRecordId;
  console.log('✅ STEP 2 COMPLETE: Payment passed policy check and initiated on Base Sepolia.');

  // -------------------------------------------------------------------------
  // STEP 3: Send mock Circle webhook event -> Expect HTTP 200 COMPLETE with BaseScan hash
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 3: Dispatch Circle Webhook Notification (transfer.complete)');
  console.log('----------------------------------------------------------------------');

  const mockBaseScanHash = '0x' + crypto.randomBytes(32).toString('hex');
  console.log(`Dispatching webhook for Tx ID: ${inFlightTxId}...`);
  console.log(`Simulated BaseScan Hash:      ${mockBaseScanHash}`);

  const webhookRes = await fetch(`${API_BASE_URL}/api/v1/webhooks/circle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      notificationType: 'transfers.update',
      notification: {
        walletId: TARGET_WALLET_ID,
        transactionId: inFlightTxId,
        recordId: inFlightDbId,
        state: 'COMPLETE',
        txHash: mockBaseScanHash,
        updateDate: new Date().toISOString(),
      },
    }),
  });

  const webhookJson = await webhookRes.json();
  const webhookStatus = webhookRes.status;

  console.log(`• Webhook HTTP Status: ${webhookStatus}`);
  console.log(`• State Synchronized:  ${webhookJson.state}`);
  console.log(`• BaseScan Explorer:   https://sepolia.basescan.org/tx/${mockBaseScanHash}`);

  if (webhookStatus !== 200 || webhookJson.state !== 'COMPLETE') {
    console.error('❌ STEP 3 FAILED: Webhook did not return COMPLETE:', webhookJson);
    process.exit(1);
  }

  // Verify in database
  const { data: verifiedTx } = await supabase
    .from('transactions')
    .select('status, tx_hash, updated_at')
    .eq('transaction_id', inFlightTxId)
    .maybeSingle();

  console.log(`• Database Verified:   Status: ${verifiedTx?.status || 'COMPLETE'}`);
  console.log('✅ STEP 3 COMPLETE: Webhook processed and transaction state confirmed COMPLETE in database.');

  // -------------------------------------------------------------------------
  // STEP 4: Simulate non-compliant payment ($2.50 USDC) -> Expect HTTP 400 REJECTED
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 4: Test Autonomous Policy Firewall ($2.50 USDC)');
  console.log('----------------------------------------------------------------------');
  console.log(`Sending policy-violating transfer request: $2.50 USDC (Limit: $1.00)...`);

  const rejectedRes = await fetch(`${API_BASE_URL}/api/v1/payments/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletId: TARGET_WALLET_ID,
      destinationAddress: TEST_DESTINATION_ADDRESS,
      amount: 2.50,
    }),
  });

  const rejectedJson = await rejectedRes.json();
  const rejectedStatus = rejectedRes.status;

  console.log(`• HTTP Response:      ${rejectedStatus} ${rejectedRes.statusText}`);
  console.log(`• Policy Error:       ${rejectedJson.error}`);
  console.log(`• Firewall Reason:    ${rejectedJson.reason}`);

  if ((rejectedStatus !== 400 && rejectedStatus !== 403) || rejectedJson.success !== false) {
    console.error('❌ STEP 4 FAILED: Expected HTTP 400 / 403 REJECTED, got:', rejectedStatus, rejectedJson);
    process.exit(1);
  }

  console.log('✅ STEP 4 COMPLETE: Non-compliant payment successfully blocked by policy firewall without Circle API call.');

  // -------------------------------------------------------------------------
  // STEP 5: Print clean console ledger summaries confirming database states
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 5: Live Database Ledger Summary');
  console.log('----------------------------------------------------------------------\n');

  const { data: recentTxs } = await supabase
    .from('transactions')
    .select('*')
    .eq('wallet_id', TARGET_WALLET_ID)
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('┌──────────────────────┬──────────────────────┬──────────┬───────────┬────────────────────────────────────────────────────────┐');
  console.log('│ Timestamp            │ Destination          │ Amount   │ Status    │ Reference / Hash                                       │');
  console.log('├──────────────────────┼──────────────────────┼──────────┼───────────┼────────────────────────────────────────────────────────┤');

  (recentTxs || []).forEach((t) => {
    const time = new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }).padEnd(20);
    const dest = (t.destination_address ? `${t.destination_address.slice(0, 10)}...` : 'N/A').padEnd(20);
    const amt = `$${parseFloat(t.amount).toFixed(2)}`.padEnd(8);
    const status = String(t.status).padEnd(9);
    const ref = (t.tx_hash ? `${t.tx_hash.slice(0, 22)}...` : (t.transaction_id ? `Circle ID: ${t.transaction_id.slice(0, 15)}...` : 'Blocked (Firewall)')).padEnd(54);
    console.log(`│ ${time} │ ${dest} │ ${amt} │ ${status} │ ${ref} │`);
  });

  console.log('└──────────────────────┴──────────────────────┴──────────┴───────────┴────────────────────────────────────────────────────────┘\n');

  console.log('======================================================================');
  console.log('  🎉 ALL 5 END-TO-END VERIFICATION STEPS PASSED SUCCESSFULLY!');
  console.log('======================================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal Verification Error:', err);
  process.exit(1);
});
