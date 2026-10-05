-- ==============================================================================
-- AgenticPay: Transactions Logging Migration Schema
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Recreate transactions table with Circle transfer logging columns
drop table if exists public.transactions cascade;

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_id text unique,
  wallet_id text not null,
  destination_address text not null,
  amount numeric not null,
  token_address text not null,
  blockchain text not null default 'base-sepolia',
  status text not null default 'INITIATED' check (status in ('INITIATED', 'PENDING', 'COMPLETE', 'FAILED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.transactions enable row level security;

-- RLS Policy: Allow service role and public access for transaction logging
drop policy if exists "Allow transactions operations for all" on public.transactions;
create policy "Allow transactions operations for all" on public.transactions
  for all using (true) with check (true);
