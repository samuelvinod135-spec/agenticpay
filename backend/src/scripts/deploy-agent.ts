#!/usr/bin/env tsx
import dotenv from 'dotenv';
import path from 'path';

// Ensure backend .env is loaded
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { supabase } from '../config/supabase';

const AGENT_NAME = 'AutoPay-Agent-01';
const WALLET_ADDRESS = '0x9f4d4f18475a4218fe6afef72352f0b9e52fdb3d';
const WALLET_ID = 'f94177bd-764a-5951-b5fa-0b2968f7a682';
const USDC_CONTRACT = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

async function main() {
  console.log('\n=============================================================');
  console.log('  🤖 AGENTICPAY: AGENT DEPLOYMENT & POLICY SETUP');
  console.log('=============================================================\n');

  // 1. Get or create a user in public.users
  console.log('🔍 Locating operator account in Supabase...');
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .limit(1);

  if (userError) {
    console.error('❌ Failed to query users table:', userError.message);
    process.exit(1);
  }

  let userId: string;
  if (!users || users.length === 0) {
    console.log('ℹ️ No user found. Creating default operator record...');
    const dummyUserId = '2ffd6159-79b0-4e52-824a-ca586d2f162b';
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({ id: dummyUserId, email: 'operator@agentic-payments.xyz' })
      .select('id')
      .single();

    if (createError) {
      console.error('❌ Failed to create operator user:', createError.message);
      process.exit(1);
    }
    userId = newUser.id;
  } else {
    userId = users[0].id;
    console.log(`✅ Using operator user: ${users[0].email} (${userId})`);
  }

  // 2. Clean up any existing agent with the same name for idempotency
  console.log(`\n🧹 Checking for existing "${AGENT_NAME}"...`);
  const { data: existingAgents } = await supabase
    .from('agents')
    .select('id')
    .eq('name', AGENT_NAME);

  if (existingAgents && existingAgents.length > 0) {
    for (const a of existingAgents) {
      await supabase.from('agents').delete().eq('id', a.id);
    }
    console.log(`ℹ️ Cleaned up ${existingAgents.length} previous agent record(s).`);
  }

  // 3. Insert agent record
  console.log(`\n🚀 Deploying agent "${AGENT_NAME}"...`);
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .insert({
      name: AGENT_NAME,
      user_id: userId,
    })
    .select()
    .single();

  if (agentError || !agent) {
    console.error('❌ Failed to insert agent:', agentError?.message);
    process.exit(1);
  }
  console.log(`✅ Agent created with ID: ${agent.id}`);

  // 4. Insert wallet record
  console.log(`\n🔗 Linking programmable wallet (${WALLET_ID})...`);
  let walletRecord: any = null;

  // Try insert with wallet_id column first
  const walletWithCol = await supabase
    .from('wallets')
    .insert({
      id: WALLET_ID,
      agent_id: agent.id,
      wallet_address: WALLET_ADDRESS,
      wallet_id: WALLET_ID,
      chain: 'base-sepolia',
      provider: 'circle',
    })
    .select()
    .single();

  if (walletWithCol.error) {
    // Fallback if wallet_id column is not in schema
    const fallbackWallet = await supabase
      .from('wallets')
      .insert({
        id: WALLET_ID,
        agent_id: agent.id,
        wallet_address: WALLET_ADDRESS,
        chain: 'base-sepolia',
        provider: 'circle',
      })
      .select()
      .single();

    if (fallbackWallet.error) {
      console.error('❌ Failed to link wallet:', fallbackWallet.error.message);
      process.exit(1);
    }
    walletRecord = fallbackWallet.data;
  } else {
    walletRecord = walletWithCol.data;
  }
  console.log(`✅ Wallet linked successfully:`);
  console.log(`   • Wallet ID:      ${WALLET_ID}`);
  console.log(`   • Wallet Address: ${WALLET_ADDRESS}`);
  console.log(`   • Chain:          base-sepolia`);

  // 5. Insert spending policies
  console.log(`\n🛡️ Configuring spending policy rules...`);
  const policyPayloadWithExtendedCols = {
    agent_id: agent.id,
    max_per_transaction: 1.00,
    daily_limit: 10.00,
    allowed_tokens: [USDC_CONTRACT],
    daily_limit_usd: 10.00,
    max_per_tx_usd: 1.00,
    allowed_chains_json: ['base-sepolia'],
  };

  let policyRecord: any = null;
  const policyRes = await supabase
    .from('policies')
    .insert(policyPayloadWithExtendedCols)
    .select()
    .single();

  if (policyRes.error) {
    // Fallback if extended columns are not present
    const fallbackPolicy = await supabase
      .from('policies')
      .insert({
        agent_id: agent.id,
        daily_limit_usd: 10.00,
        max_per_tx_usd: 1.00,
        allowed_chains_json: ['base-sepolia'],
      })
      .select()
      .single();

    if (fallbackPolicy.error) {
      console.error('❌ Failed to insert policy:', fallbackPolicy.error.message);
      process.exit(1);
    }
    policyRecord = fallbackPolicy.data;
  } else {
    policyRecord = policyRes.data;
  }

  console.log(`✅ Spending policy enforced:`);
  console.log(`   • Max Per Transaction: $1.00 USDC`);
  console.log(`   • 24h Daily Limit:      $10.00 USDC`);
  console.log(`   • Allowed Tokens:       [${USDC_CONTRACT}]`);

  console.log('\n=============================================================');
  console.log('  🎉 AGENT & POLICIES SUCCESSFULLY CONFIGURED');
  console.log('=============================================================\n');
}

main().catch((err) => {
  console.error('Fatal deployment error:', err);
  process.exit(1);
});
