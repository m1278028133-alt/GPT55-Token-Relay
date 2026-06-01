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

alter table public.cxzweb_recharge_logs enable row level security;
