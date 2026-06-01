create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  key_hash text unique not null,
  prefix text not null,
  name text not null,
  created_at timestamptz not null default now(),
  revoked boolean not null default false
);

create index if not exists api_keys_key_hash_idx on public.api_keys(key_hash);
create index if not exists api_keys_user_id_idx on public.api_keys(user_id);

create table if not exists public.token_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.users(id) on delete cascade,
  balance bigint not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.api_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  api_key_id uuid references public.api_keys(id) on delete set null,
  model text not null,
  input_tokens integer not null,
  output_tokens integer not null,
  total_tokens integer not null,
  cost_usd numeric(12, 6) not null,
  upstream_service text not null check (upstream_service in ('cxzweb', 'no1api', 'freemodel', 'aliyun')),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount_usd numeric(12, 2) not null,
  amount_tokens bigint not null,
  payment_method text not null check (payment_method in ('paypal', 'stripe', 'coinbase')),
  transaction_id text unique not null,
  status text not null check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  webhook_raw_data jsonb
);

create table if not exists public.upstream_balance (
  id uuid primary key default gen_random_uuid(),
  upstream_service text unique not null check (upstream_service in ('cxzweb', 'no1api', 'freemodel', 'aliyun')),
  balance_usd numeric(12, 2) not null default 0,
  last_updated timestamptz not null default now()
);

create table if not exists public.upstream_config (
  id uuid primary key default gen_random_uuid(),
  upstream_service text unique not null check (upstream_service in ('cxzweb', 'no1api', 'freemodel', 'aliyun')),
  enabled boolean not null default true,
  is_primary boolean not null default false,
  balance_tokens bigint not null default 0,
  balance_usd numeric(12, 2) not null default 0,
  status text not null default 'normal',
  warning_message text,
  last_checked_at timestamptz,
  updated_at timestamptz not null default now()
);

create unique index if not exists upstream_config_single_primary_idx
on public.upstream_config ((is_primary))
where is_primary = true;

create table if not exists public.upstream_switch_logs (
  id uuid primary key default gen_random_uuid(),
  from_upstream text check (from_upstream in ('cxzweb', 'no1api', 'freemodel', 'aliyun')),
  to_upstream text not null check (to_upstream in ('cxzweb', 'no1api', 'freemodel', 'aliyun')),
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null default 'info' check (level in ('info', 'warn', 'error')),
  event text not null,
  message text not null,
  user_id uuid references public.users(id) on delete set null,
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists system_logs_created_at_idx on public.system_logs(created_at desc);
create index if not exists system_logs_event_idx on public.system_logs(event);

create table if not exists public.cxzweb_recharge_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  transaction_id text,
  amount_usd numeric(12, 2) not null,
  status text not null check (status in ('success', 'failed', 'skipped')),
  error_message text,
  raw_response jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cxzweb_recharge_logs_created_at_idx on public.cxzweb_recharge_logs(created_at desc);
create index if not exists cxzweb_recharge_logs_user_id_idx on public.cxzweb_recharge_logs(user_id);

insert into public.upstream_config (upstream_service, enabled, is_primary, balance_tokens, balance_usd, status, warning_message)
values
  ('aliyun', true, true, 1000000, 0, 'normal', null),
  ('cxzweb', false, false, 0, 0, 'no_quota', 'API key configured, waiting for V2EX credit.'),
  ('no1api', false, false, 0, 0, 'disabled', null),
  ('freemodel', false, false, 0, 0, 'disabled', null)
on conflict (upstream_service) do nothing;

create table if not exists public.fund_pool (
  id uuid primary key default gen_random_uuid(),
  total_deposited numeric(12, 2) not null default 0,
  total_spent numeric(12, 2) not null default 0,
  current_balance numeric(12, 2) not null default 0,
  last_updated timestamptz not null default now()
);

insert into public.fund_pool (total_deposited, total_spent, current_balance)
select 0, 0, 0
where not exists (select 1 from public.fund_pool);

create or replace function public.credit_tokens(p_user_id uuid, p_tokens bigint)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.token_balances (user_id, balance)
  values (p_user_id, p_tokens)
  on conflict (user_id)
  do update set
    balance = public.token_balances.balance + p_tokens,
    updated_at = now();
end;
$$;

create or replace function public.debit_tokens(p_user_id uuid, p_tokens bigint)
returns void
language plpgsql
security definer
as $$
begin
  update public.token_balances
  set balance = balance - p_tokens, updated_at = now()
  where user_id = p_user_id and balance >= p_tokens;

  if not found then
    raise exception 'insufficient balance';
  end if;
end;
$$;

create or replace function public.record_fund_pool_deposit(p_amount_usd numeric)
returns void
language plpgsql
security definer
as $$
begin
  update public.fund_pool
  set
    total_deposited = total_deposited + p_amount_usd,
    current_balance = current_balance + p_amount_usd,
    last_updated = now()
  where id = (select id from public.fund_pool limit 1);
end;
$$;

create or replace function public.record_fund_pool_spend(p_amount_usd numeric)
returns void
language plpgsql
security definer
as $$
begin
  update public.fund_pool
  set
    total_spent = total_spent + p_amount_usd,
    current_balance = current_balance - p_amount_usd,
    last_updated = now()
  where id = (select id from public.fund_pool limit 1)
    and current_balance >= p_amount_usd;

  if not found then
    raise exception 'fund pool balance is insufficient';
  end if;
end;
$$;

create or replace function public.set_primary_upstream(p_upstream_service text, p_reason text)
returns void
language plpgsql
security definer
as $$
declare
  v_from text;
begin
  select upstream_service into v_from
  from public.upstream_config
  where is_primary = true
  limit 1;

  update public.upstream_config
  set is_primary = false, updated_at = now()
  where is_primary = true;

  update public.upstream_config
  set is_primary = true, enabled = true, updated_at = now()
  where upstream_service = p_upstream_service;

  insert into public.upstream_switch_logs (from_upstream, to_upstream, reason)
  values (v_from, p_upstream_service, p_reason);
end;
$$;

create or replace function public.admin_metrics()
returns jsonb
language sql
security definer
as $$
  select jsonb_build_object(
    'user_count', (select count(*) from public.users),
    'today_recharge_usd', coalesce((select sum(amount_usd) from public.payments where status = 'completed' and created_at >= date_trunc('day', now())), 0),
    'today_api_calls', (select count(*) from public.api_calls where created_at >= date_trunc('day', now())),
    'fund_pool_balance', coalesce((select current_balance from public.fund_pool limit 1), 0),
    'error_count_today', (select count(*) from public.system_logs where level = 'error' and created_at >= date_trunc('day', now())),
    'total_logs_today', (select count(*) from public.system_logs where created_at >= date_trunc('day', now()))
  );
$$;

alter table public.users enable row level security;
alter table public.api_keys enable row level security;
alter table public.token_balances enable row level security;
alter table public.api_calls enable row level security;
alter table public.payments enable row level security;
alter table public.upstream_balance enable row level security;
alter table public.upstream_config enable row level security;
alter table public.upstream_switch_logs enable row level security;
alter table public.system_logs enable row level security;
alter table public.cxzweb_recharge_logs enable row level security;
alter table public.fund_pool enable row level security;

-- Initial admin profile template:
-- 1. Create an Auth user in Supabase Dashboard with your admin email and password.
-- 2. Copy the Auth user UUID.
-- 3. Replace the placeholders below and run the insert.
--
-- insert into public.users (id, email, role)
-- values ('00000000-0000-0000-0000-000000000000', 'admin@example.com', 'admin')
-- on conflict (id) do update set role = 'admin';
