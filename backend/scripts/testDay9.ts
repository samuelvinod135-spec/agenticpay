#!/usr/bin/env tsx
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_BASE_URL = process.env.API_URL || 'http://localhost:4000';
const RECEIVER_PORT = 4099;
const TARGET_WALLET_ID = 'f94177bd-764a-5951-b5fa-0b2968f7a682';
const TEST_DESTINATION_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

async function main() {
  console.log('\n======================================================================');
  console.log('  ⚡ AGENTICPAY: DAY 9 WEBHOOK DELIVERY ENGINE & EVENT SUBSCRIPTIONS');
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
  // STEP 1: Spin up local mock webhook receiver server
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log(`📌 STEP 1: Spin Up Local Webhook Listener on Port ${RECEIVER_PORT}`);
  console.log('----------------------------------------------------------------------');

  let receivedEvent: any = null;
  let receivedSignatureHeader: string | null = null;
  let receivedEventType: string | null = null;

  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      receivedSignatureHeader = req.headers['x-agenticpay-signature'] as string;
      receivedEventType = req.headers['x-agenticpay-event'] as string;
      try {
        receivedEvent = JSON.parse(body);
      } catch (e) {
        receivedEvent = body;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true }));
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(RECEIVER_PORT, () => {
      console.log(`• Webhook test receiver listening at http://localhost:${RECEIVER_PORT}`);
      resolve();
    });
  });

  // -------------------------------------------------------------------------
  // STEP 2: Register Webhook Subscription via API
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 2: Register Webhook Endpoint Subscription via API');
  console.log('----------------------------------------------------------------------');

  const webhookUrl = `http://localhost:${RECEIVER_PORT}/webhook`;
  const subRes = await fetch(`${API_BASE_URL}/api/v1/webhooks/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orgId: '00000000-0000-0000-0000-000000000001',
      url: webhookUrl,
      events: ['transfer.initiated', 'transfer.completed', 'transfer.rejected'],
    }),
  });

  const subJson = await subRes.json();
  if (!subRes.ok || !subJson.endpoint) {
    console.error('❌ STEP 2 FAILED: Could not register webhook subscription:', subJson);
    server.close();
    process.exit(1);
  }

  const endpointSecret = subJson.endpoint.secret;
  console.log(`• Endpoint ID:             ${subJson.endpoint.id}`);
  console.log(`• Subscription URL:        ${subJson.endpoint.url}`);
  console.log(`• Shared Secret:           ${endpointSecret.slice(0, 16)}...`);
  console.log(`• Subscribed Events:       ${subJson.endpoint.events.join(', ')}`);
  console.log('✅ STEP 2 COMPLETE: Webhook subscription registered.');

  // -------------------------------------------------------------------------
  // STEP 3: Trigger Transfer to Emit Event
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 3: Initiate Transfer to Trigger "transfer.initiated" Event');
  console.log('----------------------------------------------------------------------');

  const transferRes = await fetch(`${API_BASE_URL}/api/v1/payments/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletId: TARGET_WALLET_ID,
      destinationAddress: TEST_DESTINATION_ADDRESS,
      amount: 0.1,
    }),
  });

  const transferJson = await transferRes.json();
  console.log(`• Transfer HTTP Status:    ${transferRes.status}`);
  console.log(`• Transfer Status:         ${transferJson.transaction?.state || 'INITIATED'}`);

  // Wait up to 3 seconds for asynchronous webhook delivery
  console.log('Waiting for webhook delivery on port ' + RECEIVER_PORT + '...');
  let waited = 0;
  while (!receivedEvent && waited < 30) {
    await new Promise((r) => setTimeout(r, 100));
    waited++;
  }

  server.close();

  if (!receivedEvent) {
    console.error('❌ STEP 3 FAILED: Webhook was not received within timeout.');
    process.exit(1);
  }

  console.log(`• Event Received:          ${receivedEventType}`);
  console.log(`• Event Delivery ID:       ${receivedEvent.id}`);
  console.log(`• Payload Event Type:      ${receivedEvent.type}`);
  console.log(`• Signature Header:        ${receivedSignatureHeader}`);
  console.log('✅ STEP 3 COMPLETE: Webhook delivered to test receiver.');

  // -------------------------------------------------------------------------
  // STEP 4: Cryptographic HMAC-SHA256 Signature Verification
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 4: Cryptographic HMAC-SHA256 Signature Verification');
  console.log('----------------------------------------------------------------------');

  if (!receivedSignatureHeader || !receivedSignatureHeader.includes('v1=')) {
    console.error('❌ STEP 4 FAILED: Missing or malformed signature header:', receivedSignatureHeader);
    process.exit(1);
  }

  const parts = receivedSignatureHeader.split(',');
  const timestamp = parts.find((p) => p.startsWith('t='))?.split('=')[1];
  const expectedHash = parts.find((p) => p.startsWith('v1='))?.split('=')[1];

  const computedHash = crypto
    .createHmac('sha256', endpointSecret)
    .update(`${timestamp}.${JSON.stringify(receivedEvent.data)}`)
    .digest('hex');

  console.log(`• Extracted Timestamp:     ${timestamp}`);
  console.log(`• Header Signature (v1):   ${expectedHash}`);
  console.log(`• Locally Computed Hash:   ${computedHash}`);
  console.log(`• Signatures Match:        ${expectedHash === computedHash ? 'YES (VERIFIED)' : 'NO'}`);

  if (expectedHash !== computedHash) {
    console.error('❌ STEP 4 FAILED: HMAC-SHA256 signature mismatch!');
    process.exit(1);
  }
  console.log('✅ STEP 4 COMPLETE: Webhook authenticity cryptographically verified.');

  console.log('\n======================================================================');
  console.log('  🎉 DAY 9: WEBHOOK ENGINE & SIGNATURE VERIFICATION TESTS PASSED!');
  console.log('======================================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal Day 9 Test Error:', err);
  process.exit(1);
});
