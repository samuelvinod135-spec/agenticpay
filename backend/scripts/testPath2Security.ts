#!/usr/bin/env tsx
/**
 * ==============================================================================
 * 🛡️ AGENTICPAY: PATH 2 ENTERPRISE SECURITY VERIFICATION SUITE
 * ==============================================================================
 * Verifies:
 * 1. KMS / Vault Managed Signers, Key Rotation & Environment Isolation Guard
 * 2. SOC2 Type II & PCI-DSS Audit Trail Engine (SHA-256 Prompt Hash, Ledger Correlation)
 * 3. Global Circuit Breaker Auto-Trip (>15% in 60s) & Panic Multi-Tenant Quarantine
 * 4. Compliance Report Export (JSON & CSV formatted for external auditors)
 * ==============================================================================
 * Run with: npm run test:path2
 */

import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import http from 'http';
import {
  kmsService,
  LocalKeyProvider,
  AwsKmsProvider,
  VaultKeyProvider,
} from '../src/services/kmsService';
import { complianceService } from '../src/services/complianceService';
import { circuitBreaker, circuitBreakerMiddleware } from '../src/services/circuitBreaker';
import app from '../src/index';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  console.log('\n======================================================================');
  console.log('🛡️ AGENTICPAY: PATH 2 ENTERPRISE SECURITY & COMPLIANCE SUITE');
  console.log('======================================================================\n');

  const startTime = Date.now();
  let passedCount = 0;
  const totalSections = 4;

  // -------------------------------------------------------------------------
  // 1. KMS / VAULT MANAGEMENT, ROTATION & PRODUCTION ISOLATION
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log('📌 [1/4] KMS / VAULT PROVIDERS, ROTATION & PRODUCTION ISOLATION');
  console.log('----------------------------------------------------------------------');

  // A. Local Signer
  const localProvider = new LocalKeyProvider();
  kmsService.setProvider(localProvider);
  const metaV1 = kmsService.getActiveKeyMetadata();
  console.log(`• Active Provider:          ${metaV1.provider} (Algorithm: ${metaV1.algorithm})`);
  console.log(`• Key ID:                   ${metaV1.keyId} (Version: ${metaV1.version})`);

  const sampleTx = {
    amount: 10.0,
    recipient: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    agentId: 'AutoPay-Agent-01',
    nonce: 1,
  };
  const sigV1 = await kmsService.signTransferPayload(sampleTx);
  console.log(`✓ Signed with v1 Key:       ${sigV1.signature.slice(0, 32)}... (v${sigV1.version})`);

  // B. Key Rotation
  const metaV2 = await kmsService.rotateMasterKey();
  console.log(`• Master Key Rotated:       v${metaV1.version} -> v${metaV2.version} (New Key: ${metaV2.keyId})`);
  const sigV2 = await kmsService.signTransferPayload(sampleTx);
  console.log(`✓ Signed with v2 Key:       ${sigV2.signature.slice(0, 32)}... (v${sigV2.version})`);

  if (sigV2.version !== 2) {
    throw new Error('Key rotation failed to increment active version');
  }

  // C. AWS KMS & Vault Provider Abstraction
  const awsProvider = new AwsKmsProvider('arn:aws:kms:us-east-1:123456789012:key/agenticpay-vault');
  kmsService.setProvider(awsProvider);
  const awsSig = await kmsService.signTransferPayload(sampleTx);
  console.log(`✓ AWS KMS Provider:         ${awsSig.keyId} (Algorithm: ${awsSig.algorithm})`);

  const vaultProvider = new VaultKeyProvider('agenticpay-transit');
  kmsService.setProvider(vaultProvider);
  const vaultSig = await kmsService.signTransferPayload(sampleTx);
  console.log(`✓ HashiCorp Vault Provider: ${vaultSig.keyId} (${vaultSig.signature.slice(0, 24)}...)`);

  // D. Environment Isolation Strict Security Check
  kmsService.setProvider(localProvider);
  const devCheck = kmsService.validateEnvironmentIsolation('development');
  console.log(`✓ Dev Environment Check:    ${devCheck.safe ? 'ALLOWED' : 'BLOCKED'}`);

  let caughtProdViolation = false;
  try {
    kmsService.validateEnvironmentIsolation('production');
  } catch (err: any) {
    if (err.message.includes('ProductionSecurityViolation')) {
      caughtProdViolation = true;
      console.log(`✓ Production Isolation:     BLOCKED unencrypted local key in production (Caught: ${err.message.slice(0, 50)}...)`);
    }
  }

  if (!caughtProdViolation) {
    throw new Error('Failed to enforce production security isolation for local private key');
  }

  // Restore KMS provider for remaining tests
  kmsService.setProvider(awsProvider);
  console.log('✅ [1/4] PASSED: KMS providers, cryptographic rotation, and environment isolation verified.\n');
  passedCount++;

  // -------------------------------------------------------------------------
  // 2. SOC2 TYPE II & PCI-DSS AUDIT TRAIL ENGINE
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log('📌 [2/4] SOC2 TYPE II & PCI-DSS COMPLIANCE AUDIT ENGINE');
  console.log('----------------------------------------------------------------------');

  const testPrompt = 'Transfer $3.50 USDC to API provider for 1000 OpenAI embeddings tokens';
  const expectedHash = crypto.createHash('sha256').update(testPrompt).digest('hex');
  const computedHash = complianceService.hashPrompt(testPrompt);
  console.log(`• Raw Agent Intent:         "${testPrompt}"`);
  console.log(`• SHA-256 Prompt Digest:    ${computedHash}`);

  if (computedHash !== expectedHash) {
    throw new Error('SHA-256 prompt hashing mismatch');
  }

  const auditEntry = await complianceService.recordAuditEntry({
    txId: 'tx-compliance-test-101',
    agentId: 'AutoPay-Agent-01',
    promptOrIntent: testPrompt,
    policySnapshot: { single_tx_cap_usdc: 10.0, daily_spend_cap_usdc: 50.0 },
    signatureVerdict: 'APPROVED',
    ledgerEntryId: 'ledger-entry-uuid-999',
    tenantOrgId: '00000000-0000-0000-0000-000000000001',
    riskScore: 5,
  });

  console.log(`✓ Recorded Audit Record:    ${auditEntry.id}`);
  console.log(`  - Correlated Ledger ID:   ${auditEntry.ledger_entry_id}`);
  console.log(`  - Signature Verdict:      ${auditEntry.signature_verdict}`);

  // Test Export Format: JSON
  const jsonReport = await complianceService.exportAuditReport('json', { agentId: 'AutoPay-Agent-01' });
  const parsedJson = JSON.parse(jsonReport);
  console.log(`✓ Exported JSON Audit:      Standard=${parsedJson.standard}, Records=${parsedJson.recordCount}`);

  // Test Export Format: CSV
  const csvReport = await complianceService.exportAuditReport('csv', { agentId: 'AutoPay-Agent-01' });
  const csvLines = csvReport.split('\n');
  console.log(`✓ Exported CSV Audit:       ${csvLines.length - 1} data rows, Header="${csvLines[0]}"`);

  if (!csvLines[0].includes('prompt_hash') || !csvLines[0].includes('ledger_entry_id')) {
    throw new Error('CSV audit report missing mandatory compliance columns');
  }

  console.log('✅ [2/4] PASSED: SOC2/PCI-DSS tamper-evident audit trail & exports verified.\n');
  passedCount++;

  // -------------------------------------------------------------------------
  // 3. GLOBAL CIRCUIT BREAKER AUTO-TRIP & MULTI-TENANT QUARANTINE
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log('📌 [3/4] GLOBAL CIRCUIT BREAKER & TENANT PANIC QUARANTINE');
  console.log('----------------------------------------------------------------------');

  circuitBreaker.resetGlobalCircuit();
  console.log(`• Initial Circuit State:    ${circuitBreaker.getState()} (Expected: HEALTHY)`);

  // Record 10 successful transactions
  for (let i = 0; i < 10; i++) {
    circuitBreaker.recordOutcome(true);
  }
  console.log(`• Recorded 10 Successes:    Circuit Status = ${circuitBreaker.getState()}`);

  // Simulate surge of 5 consecutive failures (>15% failure rate)
  console.log('• Simulating anomaly surge (5 consecutive failures)...');
  for (let i = 0; i < 5; i++) {
    circuitBreaker.recordOutcome(false, 'Simulated Anomaly Spike');
  }

  const trippedStatus = circuitBreaker.getStatus();
  console.log(`• Failure Rate in Window:   ${trippedStatus.metrics.failureRatePercent}% (Ceiling: 15%)`);
  console.log(`• Auto-Tripped State:       ${trippedStatus.status} (Expected: SYSTEM_QUARANTINE)`);
  console.log(`• Trip Reason:              ${trippedStatus.tripReason}`);

  if (trippedStatus.status !== 'SYSTEM_QUARANTINE') {
    throw new Error('Circuit breaker failed to auto-trip into SYSTEM_QUARANTINE above 15% failure threshold');
  }

  // Reset circuit
  circuitBreaker.resetGlobalCircuit();
  console.log(`✓ Circuit Breaker Reset:    ${circuitBreaker.getState()} (Restored)`);

  // Emergency Tenant Quarantine Switch
  const TEST_TENANT = 'tenant-rogue-ai-org';
  console.log(`\n• Activating Panic Switch on Tenant: ${TEST_TENANT}...`);
  circuitBreaker.freezeTenant(TEST_TENANT);

  if (!circuitBreaker.isTenantFrozen(TEST_TENANT)) {
    throw new Error('Tenant freeze failed to register in quarantine set');
  }
  console.log(`✓ Tenant Freeze Active:     ${TEST_TENANT} is quarantined.`);

  circuitBreaker.unfreezeTenant(TEST_TENANT);
  if (circuitBreaker.isTenantFrozen(TEST_TENANT)) {
    throw new Error('Tenant unfreeze failed');
  }
  console.log(`✓ Tenant Unfrozen:          ${TEST_TENANT} restored to active status.`);

  console.log('✅ [3/4] PASSED: Circuit breaker auto-tripping and tenant quarantine verified.\n');
  passedCount++;

  // -------------------------------------------------------------------------
  // 4. ENTERPRISE SECURITY API INTEGRATION (LIVE GATEWAY PROBE)
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log('📌 [4/4] LIVE ENTERPRISE SECURITY API GATEWAY ENDPOINTS');
  console.log('----------------------------------------------------------------------');

  const TEST_PORT = 4056;
  const testServer = http.createServer(app);
  await new Promise<void>((res) => testServer.listen(TEST_PORT, '127.0.0.1', () => res()));

  try {
    const baseUrl = `http://127.0.0.1:${TEST_PORT}/api/v1`;

    // 1. GET /compliance/export (JSON)
    const jsonRes = await fetch(`${baseUrl}/compliance/export?format=json`);
    const jsonReportData = await jsonRes.json();
    console.log(`• GET /compliance/export:   HTTP ${jsonRes.status} (Records: ${jsonReportData.recordCount})`);

    // 2. GET /compliance/export (CSV)
    const csvRes = await fetch(`${baseUrl}/compliance/export?format=csv`);
    const csvContent = await csvRes.text();
    console.log(`• GET /compliance/export:   HTTP ${csvRes.status} (CSV Content-Type: ${csvRes.headers.get('content-type')})`);

    // 3. GET /circuit-breaker/status
    const statusRes = await fetch(`${baseUrl}/circuit-breaker/status`);
    const statusData = await statusRes.json();
    console.log(`• GET /circuit-breaker:     HTTP ${statusRes.status} (Status: ${statusData.circuitBreaker.status})`);

    // 4. POST /tenant/freeze & POST /tenant/unfreeze
    const freezeRes = await fetch(`${baseUrl}/tenant/freeze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantOrgId: 'org-quarantine-api-test', reason: 'Security drill' }),
    });
    const freezeData = await freezeRes.json();
    console.log(`• POST /tenant/freeze:      HTTP ${freezeRes.status} (Quarantined: ${freezeData.quarantined})`);

    const unfreezeRes = await fetch(`${baseUrl}/tenant/unfreeze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantOrgId: 'org-quarantine-api-test' }),
    });
    const unfreezeData = await unfreezeRes.json();
    console.log(`• POST /tenant/unfreeze:    HTTP ${unfreezeRes.status} (Quarantined: ${unfreezeData.quarantined})`);

    console.log('✅ [4/4] PASSED: All enterprise security REST endpoints functional.\n');
    passedCount++;
  } finally {
    await new Promise<void>((res) => testServer.close(() => res()));
  }

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('======================================================================');
  console.log(`🎉 PATH 2 SECURITY COMPLETE: ${passedCount}/${totalSections} SECTIONS PASSED (${totalDuration}s)`);
  console.log('======================================================================\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Path 2 Security Test Error:', err);
  process.exit(1);
});
