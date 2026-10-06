#!/usr/bin/env tsx
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { ledgerService } from '../src/services/ledgerService';

async function main() {
  console.log('\n======================================================================');
  console.log('  ⚡ AGENTICPAY: DAY 13 DOUBLE-ENTRY LEDGER & ZERO-DRIFT SANITY');
  console.log('======================================================================\n');

  // -------------------------------------------------------------------------
  // STEP 1: Record Atomic Double-Entry Transfers
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log('📌 STEP 1: Record Atomic Journal Entries (Transfer + Platform Fee)');
  console.log('----------------------------------------------------------------------');

  const entry1 = await ledgerService.recordTransfer({
    referenceId: 'tx-ref-1001',
    agentId: 'AutoPay-Agent-01',
    amountUsdc: 5.0,
    feeUsdc: 0.04,
    recipient: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    memo: 'Data Harvest API Micro-Settlement',
  });

  console.log(`• Journal Entry #1 Recorded: ${entry1.id}`);
  console.log(`  - Reference: ${entry1.referenceId}`);
  entry1.lines.forEach((l) => {
    console.log(`    [${l.entryType.padEnd(6)}] ${l.accountCode.padEnd(35)} : $${l.amount.toFixed(4)} ${l.currency}`);
  });

  const entry2 = await ledgerService.recordTransfer({
    referenceId: 'tx-ref-1002',
    agentId: 'AutoPay-Agent-01',
    amountUsdc: 2.25,
    feeUsdc: 0.02,
    recipient: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    memo: 'OCR Computation Invoice',
  });

  console.log(`\n• Journal Entry #2 Recorded: ${entry2.id}`);
  entry2.lines.forEach((l) => {
    console.log(`    [${l.entryType.padEnd(6)}] ${l.accountCode.padEnd(35)} : $${l.amount.toFixed(4)} ${l.currency}`);
  });

  console.log('\n✅ STEP 1 COMPLETE: Journal entries recorded.');

  // -------------------------------------------------------------------------
  // STEP 2: Comprehensive Ledger Sanity Audit
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 2: Global Ledger Sanity Audit (Total Debits vs Credits)');
  console.log('----------------------------------------------------------------------');

  const sanity = await ledgerService.verifyLedgerSanity();
  console.log(`• Total Entries Audited:   ${sanity.entriesCount}`);
  console.log(`• Total Debits Sum:        $${sanity.totalDebits.toFixed(4)} USDC`);
  console.log(`• Total Credits Sum:       $${sanity.totalCredits.toFixed(4)} USDC`);
  console.log(`• Mathematical Drift:      $${sanity.drift.toFixed(4)} USDC`);
  console.log(`• Ledger Perfectly Balanced: ${sanity.balanced ? 'YES (0.0000 DRIFT)' : 'NO (ERROR)'}`);

  if (!sanity.balanced || sanity.drift !== 0) {
    console.error('❌ STEP 2 FAILED: Ledger has non-zero drift!');
    process.exit(1);
  }
  console.log('✅ STEP 2 COMPLETE: Zero-drift ledger invariant verified.');

  console.log('\n======================================================================');
  console.log('  🎉 DAY 13: DOUBLE-ENTRY LEDGER SANITY TESTS PASSED!');
  console.log('======================================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal Day 13 Test Error:', err);
  process.exit(1);
});
