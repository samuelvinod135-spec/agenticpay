-- ==============================================================================
-- AgenticPay: Day 9 Webhook Delivery Engine & Event Subscriptions Migration
-- ==============================================================================

-- 1. WEBHOOK ENDPOINTS TABLE
create table if not exists public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  url text not null,
  secret text not null,
  events text[] not null default '{"transfer.initiated","transfer.completed","transfer.rejected"}',
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'DISABLED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. WEBHOOK EVENTS TABLE
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete set null,
  event_type text not null,
  payload jsonb not null,
  attempts integer not null default 0,
  status text not null default 'PENDING' check (status in ('PENDING', 'DELIVERED', 'FAILED')),
  response_status integer,
  last_error text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists idx_webhook_endpoints_org on public.webhook_endpoints(org_id);
create index if not exists idx_webhook_events_status on public.webhook_events(status);
create index if not exists idx_webhook_events_org on public.webhook_events(org_id);

-- RLS
alter table public.webhook_endpoints enable row level security;
alter table public.webhook_events enable row level security;

create policy "Service role access for webhook_endpoints" on public.webhook_endpoints for all using (true) with check (true);
create policy "Service role access for webhook_events" on public.webhook_events for all using (true) with check (true);
