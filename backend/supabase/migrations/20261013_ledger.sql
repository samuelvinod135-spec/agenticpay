-- ==============================================================================
-- AgenticPay: Day 13 Double-Entry Ledger System Migration
-- ==============================================================================

create table if not exists public.ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  account_type text not null check (account_type in ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
  currency text not null default 'USDC',
  balance numeric(18, 4) not null default 0.0000,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  reference_id text not null,
  memo text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.journal_entries(id) on delete cascade,
  account_code text not null,
  entry_type text not null check (entry_type in ('DEBIT', 'CREDIT')),
  amount numeric(18, 4) not null check (amount > 0),
  currency text not null default 'USDC'
);

create index if not exists idx_journal_ref on public.journal_entries(reference_id);
create index if not exists idx_journal_lines_entry on public.journal_lines(entry_id);

alter table public.ledger_accounts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_lines enable row level security;

create policy "Service role access for ledger_accounts" on public.ledger_accounts for all using (true) with check (true);
create policy "Service role access for journal_entries" on public.journal_entries for all using (true) with check (true);
create policy "Service role access for journal_lines" on public.journal_lines for all using (true) with check (true);
