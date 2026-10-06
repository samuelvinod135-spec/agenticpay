#!/usr/bin/env tsx
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { AgenticPayClient } from '../src/sdk';

const API_BASE_URL = process.env.API_URL || 'http://localhost:4000';
const TARGET_AGENT = 'AutoPay-Agent-01';

async function main() {
  console.log('\n======================================================================');
  console.log('  ⚡ AGENTICPAY: DAY 11 EPHEMERAL VIRTUAL CREDIT CARD (VCC) ISSUING');
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

  // Provision API key for client
  const keyRes = await fetch(`${API_BASE_URL}/api/v1/organizations/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgName: 'VCC Autonomous Procurement Org' }),
  });
  const keyJson = await keyRes.json();
  const client = new AgenticPayClient({ apiKey: keyJson.apiKey, baseUrl: API_BASE_URL });

  // -------------------------------------------------------------------------
  // STEP 1: Issue Ephemeral Virtual Credit Card via SDK
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 1: Issue Ephemeral Virtual Card via SDK (client.cards.issue)');
  console.log('----------------------------------------------------------------------');

  const card = await client.cards.issue({
    agentId: TARGET_AGENT,
    spendingLimitUsd: 10.0,
    memo: 'OpenAI API Credits Procurement',
    allowedMcc: ['5734', '7372'], // Software & Data Processing
    ttlMinutes: 15,
  });

  console.log(`• Card ID:                 ${card.id}`);
  console.log(`• Card Token:              ${card.card_token}`);
  console.log(`• Masked PAN:              ${card.card_number_masked}`);
  console.log(`• CVV:                     ${card.cvv_token}`);
  console.log(`• Spending Limit:          $${Number(card.spending_limit_usd).toFixed(2)} USD`);
  console.log(`• Status:                  ${card.status}`);
  console.log(`• Expires At:              ${card.expires_at}`);
  console.log(`• Allowed MCCs:            [${card.allowed_mcc.join(', ')}]`);
  console.log('✅ STEP 1 COMPLETE: Ephemeral VCC successfully issued.');

  // -------------------------------------------------------------------------
  // STEP 2: Query Card Details via SDK
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 2: Query Card State via SDK (client.cards.get)');
  console.log('----------------------------------------------------------------------');

  const fetchedCard = await client.cards.get(card.id);
  console.log(`• Fetched Card Token:      ${fetchedCard.card_token}`);
  console.log(`• Current Spent:           $${Number(fetchedCard.current_spent_usd).toFixed(2)} USD`);
  console.log('✅ STEP 2 COMPLETE: Card retrieved successfully.');

  // -------------------------------------------------------------------------
  // STEP 3: Execute Compliant Authorization ($3.50 with MCC 7372) -> Expect APPROVED
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 3: Simulate Compliant Merchant Swipe ($3.50, MCC 7372)');
  console.log('----------------------------------------------------------------------');

  const auth1Res = await fetch(`${API_BASE_URL}/api/v1/cards/${card.id}/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amountUsd: 3.5,
      mcc: '7372', // Approved MCC
    }),
  });

  const auth1Json = await auth1Res.json();
  console.log(`• Authorization Response:  ${auth1Res.status} ${auth1Res.statusText}`);
  console.log(`• Approved:                ${auth1Json.success}`);
  console.log(`• New Spent Balance:       $${Number(auth1Json.card?.current_spent_usd).toFixed(2)} / $10.00 USD`);

  if (!auth1Json.success) {
    console.error('❌ STEP 3 FAILED: Expected compliant card swipe to be approved:', auth1Json);
    process.exit(1);
  }
  console.log('✅ STEP 3 COMPLETE: $3.50 swipe approved and balance deducted.');

  // -------------------------------------------------------------------------
  // STEP 4: Simulate Over-Limit Authorization ($8.00) -> Expect DECLINED
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 4: Simulate Over-Limit Swipe ($8.00 > $6.50 Remaining)');
  console.log('----------------------------------------------------------------------');

  const auth2Res = await fetch(`${API_BASE_URL}/api/v1/cards/${card.id}/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amountUsd: 8.0,
      mcc: '7372',
    }),
  });

  const auth2Json = await auth2Res.json();
  console.log(`• Authorization Response:  ${auth2Res.status} ${auth2Res.statusText}`);
  console.log(`• Decline Reason:          ${auth2Json.reason}`);

  if (auth2Res.status !== 400 || auth2Json.success !== false) {
    console.error('❌ STEP 4 FAILED: Expected over-limit authorization to be declined:', auth2Json);
    process.exit(1);
  }
  console.log('✅ STEP 4 COMPLETE: Over-limit swipe successfully declined by card firewall.');

  // -------------------------------------------------------------------------
  // STEP 5: Simulate Merchant Category Code (MCC) Violation -> Expect DECLINED
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 5: Simulate Disallowed MCC Swipe (MCC 5541 Gas Station)');
  console.log('----------------------------------------------------------------------');

  const auth3Res = await fetch(`${API_BASE_URL}/api/v1/cards/${card.id}/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amountUsd: 1.0,
      mcc: '5541', // Gas station / automated fuel, blocked
    }),
  });

  const auth3Json = await auth3Res.json();
  console.log(`• Authorization Response:  ${auth3Res.status} ${auth3Res.statusText}`);
  console.log(`• Decline Reason:          ${auth3Json.reason}`);

  if (auth3Res.status !== 400 || auth3Json.success !== false) {
    console.error('❌ STEP 5 FAILED: Expected disallowed MCC to be declined:', auth3Json);
    process.exit(1);
  }
  console.log('✅ STEP 5 COMPLETE: Unauthorized merchant category code blocked.');

  console.log('\n======================================================================');
  console.log('  🎉 DAY 11: EPHEMERAL VIRTUAL CREDIT CARD (VCC) TESTS PASSED!');
  console.log('======================================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal Day 11 Test Error:', err);
  process.exit(1);
});
