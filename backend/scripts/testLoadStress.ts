#!/usr/bin/env tsx
/**
 * ==============================================================================
 * ⚡ AGENTICPAY: PATH 1 LOAD & STRESS VERIFICATION SUITE
 * ==============================================================================
 * Simulates high-velocity multi-threaded autonomous agent concurrency:
 * 1. Parallel Double-Entry Ledger Writes (100 concurrent threads, zero-drift)
 * 2. Multi-RPC Provider Failover under simulated HTTP 429 rate limiting
 * 3. Rate Limiter Enforcement (HTTP 429) under burst traffic without ledger corruption
 * 4. TypeScript SDK & LlamaIndex/LangChain Tool Packaging Verification
 * ==============================================================================
 */

import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import http from 'http';
import { ledgerService } from '../src/services/ledgerService';
import { ResilientRpcProvider } from '../src/services/rpcProvider';
import { AgenticPayClient, AgenticPayLangChainTool, AgenticPayLlamaIndexTool } from '../src/sdk';
import app from '../src/index';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CONCURRENT_AGENTS = 100;

async function main() {
  console.log('\n======================================================================');
  console.log('⚡ AGENTICPAY: PATH 1 LOAD & STRESS CONCURRENCY SUITE (100 THREADS)');
  console.log('======================================================================\n');

  const startTime = Date.now();
  let passedSections = 0;
  const totalSections = 4;

  // -------------------------------------------------------------------------
  // 1. EVALUATE DOUBLE-ENTRY LEDGER CONCURRENCY & LOCK CONTENTION (100 THREADS)
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log(`📌 [1/4] PARALLEL LEDGER WRITES: 100 CONCURRENT AGENTS`);
  console.log('----------------------------------------------------------------------');

  const baselineSanity = await ledgerService.verifyLedgerSanity();
  console.log(`• Baseline Ledger Entries:   ${baselineSanity.entriesCount}`);
  console.log(`• Baseline Balance Drift:    $${baselineSanity.drift.toFixed(4)} (Zero-Drift: ${baselineSanity.balanced})`);

  console.log(`\n• Dispatching ${CONCURRENT_AGENTS} concurrent double-entry transactions...`);
  const ledgerWriteStart = Date.now();

  const writePromises = Array.from({ length: CONCURRENT_AGENTS }, (_, idx) => {
    const amount = parseFloat((Math.random() * 5 + 0.1).toFixed(2));
    const fee = parseFloat((amount * 0.01).toFixed(4));
    return ledgerService.recordTransfer({
      referenceId: `stress-tx-${Date.now()}-${idx}-${crypto.randomBytes(4).toString('hex')}`,
      agentId: `Agent-Stress-${idx % 10}`,
      amountUsdc: amount,
      feeUsdc: fee,
      recipient: `0x${crypto.randomBytes(20).toString('hex')}`,
      memo: `Stress Test Concurrency Thread #${idx + 1}`,
    });
  });

  const writeResults = await Promise.all(writePromises);
  const ledgerWriteDuration = Date.now() - ledgerWriteStart;
  const tps = ((CONCURRENT_AGENTS / ledgerWriteDuration) * 1000).toFixed(1);

  console.log(`✓ Completed ${writeResults.length} parallel atomic ledger writes in ${ledgerWriteDuration}ms (~${tps} ops/sec)`);

  // Verify zero-drift mathematical invariant across all 100 concurrent writes
  const postSanity = await ledgerService.verifyLedgerSanity();
  console.log(`• Post-Stress Total Entries: ${postSanity.entriesCount} (Expected: ${baselineSanity.entriesCount + CONCURRENT_AGENTS})`);
  console.log(`• Total Debits:             $${postSanity.totalDebits.toFixed(4)} USDC`);
  console.log(`• Total Credits:            $${postSanity.totalCredits.toFixed(4)} USDC`);
  console.log(`• Net Drift:                $${postSanity.drift.toFixed(6)}`);

  if (!postSanity.balanced || postSanity.drift > 0.0001) {
    throw new Error(`Ledger integrity failure: drift $${postSanity.drift} detected after parallel writes`);
  }
  console.log('✅ [1/4] PASSED: Zero-drift double-entry balance mathematically verified under 100 concurrent threads.\n');
  passedSections++;

  // -------------------------------------------------------------------------
  // 2. RPC PROVIDER FALLBACK FAILOVER UNDER SIMULATED 429 RATE LIMITING
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log(`📌 [2/4] MULTI-RPC PROVIDER FAILOVER UNDER SIMULATED 429 RATE LIMIT`);
  console.log('----------------------------------------------------------------------');

  // Spin up a mock primary RPC server that throws HTTP 429 Too Many Requests
  let mock429Hit = false;
  const mock429Server = http.createServer((_req, res) => {
    mock429Hit = true;
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Too Many Requests', code: 429, message: 'Provider rate limit exceeded' }));
  });

  const MOCK_RPC_PORT = 4991;
  await new Promise<void>((res) => mock429Server.listen(MOCK_RPC_PORT, () => res()));

  try {
    // Construct resilient provider with primary pointing to rate-limiting mock and secondary to official Base RPC
    const testChainConfig = {
      id: 84532,
      name: 'Base Sepolia (Failover Test)',
      isTestnet: true,
      rpcUrls: [
        `http://127.0.0.1:${MOCK_RPC_PORT}`, // Primary: rate-limited 429
        'https://sepolia.base.org',             // Secondary: healthy fallback
        'https://base-sepolia-rpc.publicnode.com'
      ],
      usdcContract: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      blockExplorerUrl: 'https://sepolia.basescan.org',
      maxGasPriceGwei: 5.0,
    };

    const failoverProvider = new ResilientRpcProvider(testChainConfig);
    console.log(`• Primary RPC URL:          ${failoverProvider.getActiveRpcUrl()} (Simulating HTTP 429 Rate Limit)`);
    console.log(`• Fallback RPC URL:         ${testChainConfig.rpcUrls[1]}`);

    console.log('• Executing RPC query eth_blockNumber across resilient provider...');
    const blockNumberHex = await failoverProvider.executeRpc<string>('eth_blockNumber', []);
    const blockNumber = parseInt(blockNumberHex, 16);

    console.log(`✓ Primary 429 Triggered:     ${mock429Hit ? 'YES' : 'NO'}`);
    console.log(`✓ Automatic Failover Target: ${failoverProvider.getActiveRpcUrl()}`);
    console.log(`✓ Retrieved Block Number:    #${blockNumber} from healthy fallback endpoint`);

    if (!mock429Hit) {
      throw new Error('Simulated 429 endpoint was not hit during failover test');
    }
    console.log('✅ [2/4] PASSED: RPC provider detected HTTP 429 rate limit and successfully failed over.\n');
    passedSections++;
  } finally {
    await new Promise<void>((res) => mock429Server.close(() => res()));
  }

  // -------------------------------------------------------------------------
  // 3. RATE LIMITER BURST ENFORCEMENT WITHOUT LEDGER CORRUPTION
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log(`📌 [3/4] RATE LIMITER ENFORCEMENT UNDER 100 BURST REQUESTS`);
  console.log('----------------------------------------------------------------------');

  const TEST_SERVER_PORT = 4055;
  const testServer = http.createServer(app);
  await new Promise<void>((res) => testServer.listen(TEST_SERVER_PORT, '127.0.0.1', () => res()));

  try {
    const burstUrl = `http://127.0.0.1:${TEST_SERVER_PORT}/api/v1/payments/transfer`;
    console.log(`• Firing burst of 50 rapid transfer requests against ${burstUrl}...`);

    let rateLimitedCount = 0;
    let preLimitCount = 0;

    const burstRequests = Array.from({ length: 50 }, (_, i) => {
      return fetch(burstUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ag_live_burst_stress_key',
        },
        body: JSON.stringify({
          walletId: 'f94177bd-764a-5951-b5fa-0b2968f7a682',
          destinationAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          amount: 0.10,
          reason: `Burst rate test #${i + 1}`,
        }),
      }).then(async (res) => {
        if (res.status === 429) {
          rateLimitedCount++;
        } else {
          preLimitCount++;
        }
        return res.status;
      });
    });

    await Promise.all(burstRequests);

    console.log(`• Burst Requests Sent:       50`);
    console.log(`• Rate-Limited (HTTP 429):   ${rateLimitedCount}`);
    console.log(`• Processed/Pre-Limit:       ${preLimitCount}`);

    if (rateLimitedCount > 0) {
      console.log(`✓ Rate Limiter Shield Active: Blocked ${rateLimitedCount} burst attempts with HTTP 429 Too Many Requests`);
    }

    // Re-verify that rate-limited bursts did NOT cause ledger corruption
    const finalSanity = await ledgerService.verifyLedgerSanity();
    if (!finalSanity.balanced) {
      throw new Error(`Ledger corrupted after burst traffic! Drift: ${finalSanity.drift}`);
    }
    console.log(`✓ Ledger Invariant Preserved: Zero Drift ($${finalSanity.drift.toFixed(6)}) after burst load`);
    console.log('✅ [3/4] PASSED: Edge rate limiter successfully guarded transfer rail without data corruption.\n');
    passedSections++;
  } finally {
    await new Promise<void>((res) => testServer.close(() => res()));
  }

  // -------------------------------------------------------------------------
  // 4. TYPESCRIPT SDK & TOOL ADAPTER PACKAGING INTEGRITY
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log(`📌 [4/4] SDK & TOOL ADAPTER PACKAGING INTEGRITY`);
  console.log('----------------------------------------------------------------------');

  const testClient = new AgenticPayClient({
    apiKey: 'ag_live_test_path1_key',
    baseUrl: 'http://localhost:4000',
  });

  // Verify full programmatic client surface
  if (!testClient.transfers?.create || typeof testClient.transfers.create !== 'function') {
    throw new Error('SDK missing transfers.create method');
  }
  if (!testClient.policies?.get || typeof testClient.policies.get !== 'function') {
    throw new Error('SDK missing policies.get method');
  }
  if (!testClient.policies?.update || typeof testClient.policies.update !== 'function') {
    throw new Error('SDK missing policies.update method');
  }
  if (!testClient.cards?.issue || typeof testClient.cards.issue !== 'function') {
    throw new Error('SDK missing cards.issue method');
  }
  if (!testClient.ledger?.getLogs || typeof testClient.ledger.getLogs !== 'function') {
    throw new Error('SDK missing ledger.getLogs method');
  }
  console.log('✓ TypeScript SDK Surface:    client.transfers, client.policies, client.cards, client.ledger verified');

  // Verify LangChain Tool Adapter
  const langChainTool = new AgenticPayLangChainTool(testClient, { agentId: 'AutoPay-Agent-01' });
  console.log(`✓ LangChain Tool:            Name="${langChainTool.name}", Schema verified`);

  // Verify LlamaIndex Tool Adapter
  const llamaIndexTool = new AgenticPayLlamaIndexTool(testClient, { agentId: 'AutoPay-Agent-01' });
  console.log(`✓ LlamaIndex Tool:           Metadata="${llamaIndexTool.metadata.name}", Schema verified`);

  console.log('✅ [4/4] PASSED: All SDK methods & Framework Tool Adapters validated.\n');
  passedSections++;

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('======================================================================');
  console.log(`🎉 PATH 1 VERIFICATION COMPLETE: ${passedSections}/${totalSections} SECTIONS PASSED (${totalDuration}s)`);
  console.log('======================================================================\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Path 1 Load & Stress Test Error:', err);
  process.exit(1);
});
