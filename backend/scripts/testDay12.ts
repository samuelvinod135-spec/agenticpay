#!/usr/bin/env tsx
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { fxService } from '../src/services/fxService';
import { chainAdapter, CHAIN_REGISTRY } from '../src/services/chainAdapter';

async function main() {
  console.log('\n======================================================================');
  console.log('  ⚡ AGENTICPAY: DAY 12 MULTI-CURRENCY & CROSS-CHAIN SETTLEMENT');
  console.log('======================================================================\n');

  // -------------------------------------------------------------------------
  // STEP 1: Multi-Currency FX Engine Conversion
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------------');
  console.log('📌 STEP 1: Convert International Invoices (EUR, GBP, JPY) to USDC');
  console.log('----------------------------------------------------------------------');

  const eurQuote = fxService.convertInvoiceToUsdc(10.0, 'EUR');
  console.log(`• EUR Invoice: €10.00 EUR -> $${eurQuote.estimatedUsdcAmount.toFixed(4)} USDC (Rate: ${eurQuote.rate})`);

  const gbpQuote = fxService.convertInvoiceToUsdc(5.0, 'GBP');
  console.log(`• GBP Invoice: £5.00 GBP   -> $${gbpQuote.estimatedUsdcAmount.toFixed(4)} USDC (Rate: ${gbpQuote.rate})`);

  const jpyQuote = fxService.convertInvoiceToUsdc(1000.0, 'JPY');
  console.log(`• JPY Invoice: ¥1,000 JPY  -> $${jpyQuote.estimatedUsdcAmount.toFixed(4)} USDC (Rate: ${jpyQuote.rate})`);

  if (!eurQuote.estimatedUsdcAmount || !gbpQuote.estimatedUsdcAmount || !jpyQuote.estimatedUsdcAmount) {
    console.error('❌ STEP 1 FAILED: FX conversion failed');
    process.exit(1);
  }
  console.log('✅ STEP 1 COMPLETE: Multi-currency FX quotes calculated successfully.');

  // -------------------------------------------------------------------------
  // STEP 2: Address Format Validation Across Chains
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 2: Cross-Chain Address Validation (Base, Arbitrum, Solana)');
  console.log('----------------------------------------------------------------------');

  const evmAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const solanaAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

  const baseValid = chainAdapter.validateAddress('base', evmAddress);
  const arbValid = chainAdapter.validateAddress('arbitrum', evmAddress);
  const solValid = chainAdapter.validateAddress('solana', solanaAddress);
  const solBad = chainAdapter.validateAddress('solana', '0xInvalidSolanaAddress');

  console.log(`• Base EVM Address Valid:     ${baseValid.valid ? 'YES' : 'NO'}`);
  console.log(`• Arbitrum EVM Address Valid: ${arbValid.valid ? 'YES' : 'NO'}`);
  console.log(`• Solana Base58 Valid:        ${solValid.valid ? 'YES' : 'NO'}`);
  console.log(`• Invalid Solana Rejected:    ${!solBad.valid ? 'YES (CORRECT)' : 'NO'}`);

  if (!baseValid.valid || !arbValid.valid || !solValid.valid || solBad.valid) {
    console.error('❌ STEP 2 FAILED: Address validation error');
    process.exit(1);
  }
  console.log('✅ STEP 2 COMPLETE: Multi-chain address validation confirmed.');

  // -------------------------------------------------------------------------
  // STEP 3: Cross-Chain Route Simulation
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------------');
  console.log('📌 STEP 3: Cross-Chain Route Simulation & Gas Benchmarking');
  console.log('----------------------------------------------------------------------');

  for (const chainKey of ['base', 'arbitrum', 'solana'] as const) {
    const recipient = chainKey === 'solana' ? solanaAddress : evmAddress;
    const routeRes = await chainAdapter.routeTransfer({
      chain: chainKey,
      recipient,
      amountUsdc: 2.5,
    });

    console.log(`• Route [${chainKey.toUpperCase()}]: ${routeRes.route.name}`);
    console.log(`  - Est Fee: $${routeRes.feeUsd.toFixed(4)} USD | Confirmation: ~${routeRes.route.avgConfirmationSeconds}s`);
    console.log(`  - Dispatch Hash: ${routeRes.txHash.slice(0, 24)}...`);
  }

  console.log('✅ STEP 3 COMPLETE: Cross-chain routing simulated successfully.');

  console.log('\n======================================================================');
  console.log('  🎉 DAY 12: MULTI-CURRENCY & CROSS-CHAIN TESTS PASSED!');
  console.log('======================================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal Day 12 Test Error:', err);
  process.exit(1);
});
