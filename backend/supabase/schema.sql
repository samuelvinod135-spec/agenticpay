-- ==============================================================================
-- agentic-payments-mvp: Supabase SQL Migration Schema
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS TABLE (Linked to Supabase auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. AGENTS TABLE
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. WALLETS TABLE
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade unique,
  wallet_address text not null,
  chain text not null default 'base-sepolia',
  provider text not null default 'circle', -- 'circle' or 'cdp'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. POLICIES TABLE
create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade unique,
  daily_limit_usd numeric(12, 2) not null default 10.00,
  max_per_tx_usd numeric(12, 2) not null default 1.00,
  allowed_chains_json jsonb not null default '["base-sepolia"]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. TRANSACTIONS TABLE
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_id text unique,
  wallet_id text not null,
  destination_address text not null,
  amount numeric not null,
  token_address text not null,
  blockchain text not null default 'base-sepolia',
  status text not null default 'INITIATED' check (status in ('INITIATED', 'PENDING', 'COMPLETE', 'FAILED')),
  agent_id uuid references public.agents(id) on delete cascade,
  amount_usd numeric(12, 4),
  tx_hash text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;
alter table public.agents enable row level security;
alter table public.wallets enable row level security;
alter table public.policies enable row level security;
alter table public.transactions enable row level security;

-- Basic RLS Policies (Users manage their own data)
drop policy if exists "Users manage own profile" on public.users;
create policy "Users manage own profile" on public.users for all using (auth.uid() = id);

drop policy if exists "Users manage own agents" on public.agents;
create policy "Users manage own agents" on public.agents for all using (auth.uid() = user_id);

drop policy if exists "Users view agent wallets" on public.wallets;
create policy "Users view agent wallets" on public.wallets for select using (
  exists (select 1 from public.agents where id = wallets.agent_id and user_id = auth.uid())
);

drop policy if exists "Users manage agent policies" on public.policies;
create policy "Users manage agent policies" on public.policies for all using (
  exists (select 1 from public.agents where id = policies.agent_id and user_id = auth.uid())
);

drop policy if exists "Users view agent transactions" on public.transactions;
create policy "Users view agent transactions" on public.transactions for select using (
  exists (select 1 from public.agents where id = transactions.agent_id and user_id = auth.uid())
);

-- Automatic user sync trigger from auth.users to public.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
