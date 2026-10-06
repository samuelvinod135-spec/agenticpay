/**
 * Verification Script for Day 18: Enterprise SSO & Role-Based Access Control (RBAC)
 * Run with: npm run test:day18
 */
import axios from 'axios';
import { registerMember } from '../src/middleware/rbac.js';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api/v1';

async function runDay18Verification() {
  console.log('======================================================================');
  console.log('🚀 AGENTICPAY: DAY 18 ENTERPRISE SSO & RBAC VERIFICATION');
  console.log('======================================================================\n');

  // Register team members with distinct roles
  registerMember('alice-secops-admin', 'ADMIN');
  registerMember('bob-frontend-dev', 'DEVELOPER');
  registerMember('charlie-external-auditor', 'AUDITOR');

  // Test 1: Charlie (AUDITOR) attempts to initiate a transfer
  console.log('--- TEST 1: AUDITOR Attempts Money Movement (Expect 403 Forbidden) ---');
  try {
    await axios.post(
      `${BASE_URL}/payments/transfer`,
      {
        walletId: 'f94177bd-764a-5951-b5fa-0b2968f7a682',
        destinationAddress: '0x9f4d4f18475a4218fe6afef72352f0b9e52fdb3d',
        amount: 0.25,
      },
      {
        headers: { 'x-user-role': 'AUDITOR' },
      }
    );
    throw new Error('AUDITOR transfer should have failed with 403!');
  } catch (err: any) {
    console.log(`- HTTP Status: ${err.response?.status} (Expected: 403)`);
    console.log(`- Rejection Error: ${err.response?.data?.error}`);
    console.log(`- Message: "${err.response?.data?.message}"`);

    if (err.response?.status !== 403) {
      throw new Error(`Expected HTTP 403, got ${err.response?.status}`);
    }
    console.log('✅ AUDITOR unauthorized write blocked!\n');
  }

  // Test 2: Charlie (AUDITOR) inspects audit logs
  console.log('--- TEST 2: AUDITOR Reads Audit Trail (Expect 200 OK) ---');
  const auditRes = await axios.get(`${BASE_URL}/audit-logs`, {
    headers: { 'x-user-role': 'AUDITOR' },
  });
  console.log(`- HTTP Status: ${auditRes.status}`);
  console.log(`- Records retrieved: ${auditRes.data.count}`);
  if (auditRes.status !== 200) {
    throw new Error(`Expected HTTP 200, got ${auditRes.status}`);
  }
  console.log('✅ AUDITOR read-only compliance access granted!\n');

  // Test 3: Bob (DEVELOPER) attempts to update policy limits
  console.log('--- TEST 3: DEVELOPER Attempts Policy Modification (Expect 403 Forbidden) ---');
  try {
    await axios.put(
      `${BASE_URL}/agents/AutoPay-Agent-01/policy`,
      {
        daily_spend_cap_usdc: 500.0,
      },
      {
        headers: { 'x-user-role': 'DEVELOPER' },
      }
    );
    throw new Error('DEVELOPER policy edit should have failed with 403!');
  } catch (err: any) {
    console.log(`- HTTP Status: ${err.response?.status} (Expected: 403)`);
    console.log(`- Message: "${err.response?.data?.message}"`);

    if (err.response?.status !== 403) {
      throw new Error(`Expected HTTP 403, got ${err.response?.status}`);
    }
    console.log('✅ DEVELOPER policy edit prevented (ADMIN only)!\n');
  }

  // Test 4: Bob (DEVELOPER) issues a Virtual Credit Card
  console.log('--- TEST 4: DEVELOPER Issues Virtual Credit Card (Expect 201 Created) ---');
  const cardRes = await axios.post(
    `${BASE_URL}/cards/issue`,
    {
      agentId: 'AutoPay-Agent-01',
      spendingLimitUsd: 15.0,
      memo: 'Dev environment OpenAI credits',
    },
    {
      headers: { 'x-user-role': 'DEVELOPER' },
    }
  );
  console.log(`- HTTP Status: ${cardRes.status}`);
  console.log(`- Card ID: ${cardRes.data.card.id}`);
  console.log(`- Status: ${cardRes.data.card.status}`);
  if (cardRes.status !== 201) {
    throw new Error(`Expected HTTP 201, got ${cardRes.status}`);
  }
  console.log('✅ DEVELOPER operational action approved!\n');

  // Test 5: Alice (ADMIN) updates policy limits
  console.log('--- TEST 5: ADMIN Updates Policy Limits (Expect 200 OK) ---');
  const updateRes = await axios.put(
    `${BASE_URL}/agents/AutoPay-Agent-01/policy`,
    {
      daily_spend_cap_usdc: 15.0,
      single_tx_cap_usdc: 2.0,
    },
    {
      headers: { 'x-user-role': 'ADMIN' },
    }
  );
  console.log(`- HTTP Status: ${updateRes.status}`);
  console.log(`- Updated policy cap: $${updateRes.data.policy.daily_spend_cap_usdc} USDC`);
  if (updateRes.status !== 200) {
    throw new Error(`Expected HTTP 200, got ${updateRes.status}`);
  }
  console.log('✅ ADMIN policy modification applied successfully!\n');

  // Test 6: Unknown or invalid role
  console.log('--- TEST 6: Invalid Role Header Validation (Expect 400 Bad Request) ---');
  try {
    await axios.get(`${BASE_URL}/audit-logs`, {
      headers: { 'x-user-role': 'UNKNOWN_GUEST' },
    });
    throw new Error('Invalid role should have returned 400 Bad Request');
  } catch (err: any) {
    console.log(`- HTTP Status: ${err.response?.status} (Expected: 400)`);
    console.log(`- Error: "${err.response?.data?.error}"`);
    if (err.response?.status !== 400) {
      throw new Error(`Expected HTTP 400, got ${err.response?.status}`);
    }
    console.log('✅ Invalid role rejection verified!\n');
  }

  console.log('======================================================================');
  console.log('🎉 ALL DAY 18 RBAC & ENTERPRISE SSO TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================================');
}

runDay18Verification().catch((err) => {
  console.error('\n❌ Day 18 Verification Failed:', err);
  process.exit(1);
});
