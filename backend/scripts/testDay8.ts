#!/usr/bin/env tsx
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { verifyEnvironmentGuardrails } from '../src/config/envGuard';

const API_BASE_URL = process.env.API_URL || 'http://localhost:4000';
const TARGET_WALLET_ID = 'f94177bd-764a-5951-b5fa-0b2968f7a682';
const VALID_RECIPIENT = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

async function main() {
  console.log('\n======================================================================');
  console.log('  ⚡ AGENTICPAY: DAY 8 SECURITY HARDENING, VALIDATION & RATE LIMITING');
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
  // STEP 1: Verify Environment Guardrails
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 1: Verify Environment Guardrails (envGuard.ts)');
  console.log('----------------------------------------------------------------------');

  const guardResult = verifyEnvironmentGuardrails();
  console.log(`• Environment Detected:    ${guardResult.environment}`);
  console.log(`• Guardrail Safe:          ${guardResult.allowed ? 'YES (PASSED)' : 'NO'}`);
  console.log(`• Violations Detected:     ${guardResult.violations.length}`);

  if (!guardResult.allowed) {
    console.error('❌ STEP 1 FAILED: Environment guardrail reported violations:', guardResult.violations);
    process.exit(1);
  }
  console.log('✅ STEP 1 COMPLETE: Environment safety confirmed (No mainnet keys exposed in dev/test).');

  // -------------------------------------------------------------------------
  // STEP 2: Edge Payload Validation - Malformed EVM Address (Expect HTTP 422)
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 2: Edge Validation - Malformed EVM Address (Expect HTTP 422)');
  console.log('----------------------------------------------------------------------');

  const badAddrRes = await fetch(`${API_BASE_URL}/api/v1/payments/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletId: TARGET_WALLET_ID,
      destinationAddress: '0xINVALID_ADDRESS_123',
      amount: 1.0,
    }),
  });

  const badAddrJson = await badAddrRes.json();
  console.log(`• HTTP Response Status:    ${badAddrRes.status} (Expected 422)`);
  console.log(`• Error Code:              ${badAddrJson.error}`);
  console.log(`• Validation Message:      ${badAddrJson.message}`);

  if (badAddrRes.status !== 422) {
    console.error('❌ STEP 2 FAILED: Expected HTTP 422 for malformed address, got:', badAddrRes.status);
    process.exit(1);
  }
  console.log('✅ STEP 2 COMPLETE: Malformed EVM address rejected at the edge with HTTP 422.');

  // -------------------------------------------------------------------------
  // STEP 3: Edge Payload Validation - Excess Decimal Precision (Expect HTTP 422)
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 3: Edge Validation - Excess Decimal Precision (>4 decimals)');
  console.log('----------------------------------------------------------------------');

  const badPrecisionRes = await fetch(`${API_BASE_URL}/api/v1/payments/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletId: TARGET_WALLET_ID,
      destinationAddress: VALID_RECIPIENT,
      amount: 0.123456, // 6 decimals exceeds 4-decimal ceiling
    }),
  });

  const badPrecisionJson = await badPrecisionRes.json();
  console.log(`• HTTP Response Status:    ${badPrecisionRes.status} (Expected 422)`);
  console.log(`• Error Code:              ${badPrecisionJson.error}`);

  if (badPrecisionRes.status !== 422) {
    console.error('❌ STEP 3 FAILED: Expected HTTP 422 for excess precision, got:', badPrecisionRes.status);
    process.exit(1);
  }
  console.log('✅ STEP 3 COMPLETE: Excess decimal precision rejected with HTTP 422.');

  // -------------------------------------------------------------------------
  // STEP 4: Valid Payload Passes Edge Validation
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 4: Valid Payload Passes Edge Validation');
  console.log('----------------------------------------------------------------------');

  const validRes = await fetch(`${API_BASE_URL}/api/v1/payments/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletId: TARGET_WALLET_ID,
      destinationAddress: VALID_RECIPIENT,
      amount: 0.25,
    }),
  });

  const validJson = await validRes.json();
  console.log(`• HTTP Response Status:    ${validRes.status} (Expected 200)`);
  console.log(`• Success:                 ${validJson.success}`);

  if (validRes.status !== 200 || !validJson.success) {
    console.error('❌ STEP 4 FAILED: Expected HTTP 200 for valid transfer payload, got:', validRes.status, validJson);
    process.exit(1);
  }
  console.log('✅ STEP 4 COMPLETE: Clean payload passed edge validation and initiated transfer.');

  console.log('\n======================================================================');
  console.log('  🎉 DAY 8: SECURITY HARDENING & VALIDATION TESTS PASSED!');
  console.log('======================================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal Day 8 Test Error:', err);
  process.exit(1);
});
