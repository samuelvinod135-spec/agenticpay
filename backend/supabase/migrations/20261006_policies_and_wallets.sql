-- ==============================================================================
-- AgenticPay: Extended Policy & Wallet Schema Migration
-- ==============================================================================

-- 1. Add wallet_id column to wallets table (if not exists)
alter table if exists public.wallets 
  add column if not exists wallet_id text;

-- 2. Add policy rule columns to policies table (if not exists)
alter table if exists public.policies 
  add column if not exists max_per_transaction numeric(12, 2) default 1.00,
  add column if not exists daily_limit numeric(12, 2) default 10.00,
  add column if not exists allowed_tokens jsonb default '["0x036CbD53842c5426634e7929541eC2318f3dCF7e"]'::jsonb;

-- 3. Add tx_hash and update transactions table status check constraint to include 'REJECTED'
alter table if exists public.transactions 
  add column if not exists tx_hash text;

alter table if exists public.transactions 
  drop constraint if exists transactions_status_check;

alter table if exists public.transactions 
  add constraint transactions_status_check 
  check (status in ('INITIATED', 'PENDING', 'COMPLETE', 'FAILED', 'REJECTED'));
