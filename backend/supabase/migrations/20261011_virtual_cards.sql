-- ==============================================================================
-- AgenticPay: Day 11 Ephemeral Virtual Credit Card (VCC) Issuing Schema
-- ==============================================================================

create table if not exists public.virtual_cards (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  agent_id text not null,
  card_token text not null unique,
  card_number_masked text not null,
  cvv_token text not null,
  expiration_month integer not null,
  expiration_year integer not null,
  spending_limit_usd numeric(12, 2) not null,
  current_spent_usd numeric(12, 2) not null default 0.00,
  allowed_mcc text[] default '{}'::text[],
  memo text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'FROZEN', 'TERMINATED')),
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_vcc_agent on public.virtual_cards(agent_id);
create index if not exists idx_vcc_org on public.virtual_cards(org_id);

alter table public.virtual_cards enable row level security;
create policy "Service role access for virtual_cards" on public.virtual_cards for all using (true) with check (true);
