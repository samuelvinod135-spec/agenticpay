#!/usr/bin/env tsx
import dotenv from 'dotenv';
import path from 'path';

// Ensure backend .env is loaded
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { walletService } from '../src/services/walletService';
import { Blockchain } from '@circle-fin/developer-controlled-wallets';

async function main() {
  console.log('\n=============================================================');
  console.log('  🤖 AGENTICPAY: DEVELOPER-CONTROLLED WALLET GENERATOR');
  console.log('=============================================================\n');

  const isLive = walletService.isCircleConfigured();

  if (isLive) {
    console.log('🟢 Circle API Status: CONNECTED (Live Developer-Controlled Wallets)');
  } else {
    console.log('🟡 Circle API Status: SANDBOX / SIMULATED TESTNET MODE');
    console.log('   (To use live Circle API, set CIRCLE_API_KEY & CIRCLE_ENTITY_SECRET in backend/.env)\n');
  }

  console.log('⏳ Provisioning programmable wallet on Base Sepolia...');

  try {
    const startTime = Date.now();
    const wallet = await walletService.createAgentWallet({
      name: 'AgenticPay CLI Generated Wallet',
      blockchain: Blockchain.BaseSepolia,
    });
    const elapsed = Date.now() - startTime;

    console.log('\n✅ Wallet Successfully Created!');
    console.log('-------------------------------------------------------------');
    console.log(`• Wallet ID:       ${wallet.id}`);
    console.log(`• Wallet Address:  ${wallet.address}`);
    console.log(`• Blockchain:      ${wallet.blockchain} (Chain ID 84532)`);
    console.log(`• Provider:        ${wallet.provider.toUpperCase()}`);
    console.log(`• State:           ${wallet.state}`);
    console.log(`• Execution Time:  ${elapsed}ms`);
    console.log(`• BaseScan Link:   https://sepolia.basescan.org/address/${wallet.address}`);
    console.log('-------------------------------------------------------------');

    console.log('\n🔍 Querying Initial Wallet Balance...');
    const balance = await walletService.getWalletBalance(wallet.id);
    if (balance.tokenBalances && balance.tokenBalances.length > 0) {
      balance.tokenBalances.forEach((b) => {
        console.log(`• Balance: ${b.amount} ${b.token.symbol || 'USDC'} (${b.token.name || 'USD Coin'})`);
      });
    } else {
      console.log('• Balance: 0.00 USDC');
    }

    console.log('\n💡 Next Steps for Agent Integration:');
    console.log('1. Fund this wallet on Base Sepolia using Circle Faucet:');
    console.log('   https://faucet.circle.com/ (Select Base Sepolia)');
    console.log('2. Attach this wallet to your AI Agent in the AgenticPay Console:');
    console.log('   http://localhost:3000/dashboard\n');
  } catch (error: any) {
    console.error('\n❌ Failed to generate wallet:', error.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
