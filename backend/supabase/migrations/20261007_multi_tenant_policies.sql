-- ==============================================================================
-- AgenticPay: Day 5 Multi-Tenant API Keys & Dynamic Policies Schema Migration
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. ORGANIZATIONS TABLE
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. API KEYS TABLE
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  key_hash text not null unique,
  key_prefix text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'REVOKED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. AUDIT LOGS TABLE
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete set null,
  agent_id text,
  wallet_id text,
  destination_address text,
  amount numeric,
  reason text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. UPDATE AGENTS TABLE WITH ORG_ID
alter table if exists public.agents
  add column if not exists org_id uuid references public.organizations(id) on delete set null;

-- 5. UPDATE POLICIES TABLE WITH DYNAMIC ATTRIBUTES
alter table if exists public.policies
  add column if not exists single_tx_cap_usdc numeric(12, 2) default 1.00,
  add column if not exists daily_spend_cap_usdc numeric(12, 2) default 10.00,
  add column if not exists whitelisted_addresses text[] default '{}'::text[],
  add column if not exists restricted_hours jsonb default '[]'::jsonb,
  add column if not exists active boolean default true;

-- 6. ROW LEVEL SECURITY (RLS)
alter table public.organizations enable row level security;
alter table public.api_keys enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Allow service role access for organizations" on public.organizations;
create policy "Allow service role access for organizations" on public.organizations for all using (true) with check (true);

drop policy if exists "Allow service role access for api_keys" on public.api_keys;
create policy "Allow service role access for api_keys" on public.api_keys for all using (true) with check (true);

drop policy if exists "Allow service role access for audit_logs" on public.audit_logs;
create policy "Allow service role access for audit_logs" on public.audit_logs for all using (true) with check (true);
