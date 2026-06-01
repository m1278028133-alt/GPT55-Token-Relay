# GPT-5.5 Token Relay

Next.js 14 + TypeScript + Tailwind CSS + Supabase prepaid API relay. It exposes an OpenAI-compatible `/api/v1/chat/completions` endpoint, checks user token balance before every upstream call, returns `402 Payment Required` when balance is insufficient, and records usage after successful calls.

## Current Operating Mode

- Primary upstream: Aliyun Bailian.
- Live model: `qwen3.5`, mapped to Aliyun `qwen3.6-plus`.
- Standby upstream: cxzweb.
- Standby model: `gpt-5.5`, enabled only after cxzweb credit is available.
- If `gpt-5.5` is requested while cxzweb has no credit, the API returns `503 MODEL_UNAVAILABLE`.

Do not commit real API keys. Put them in `.env.local` locally and Vercel Environment Variables in production.

## Files Added For Operations

- `init-database.sql`: full Supabase initialization script.
- `scripts/test-signup.js`: signup test.
- `scripts/test-login.js`: login test.
- `scripts/test-api-key.js`: API key creation test.
- `scripts/test-balance.js`: balance check test.
- `scripts/test-upstream.js`: qwen3.5 upstream call test.
- `src/app/api/cron/check-upstream/route.ts`: daily upstream balance check.
- `src/lib/logger.ts`: logs API calls, payments, switches, and errors.
- `src/lib/rate-limiter.ts`: per-key request limiting and webhook IP allowlist helpers.
- `vercel.json`: Vercel Cron schedule.

## Deploy From Zero

1. Create a Supabase project.
2. In Supabase SQL Editor, run `init-database.sql`.
3. Create an admin user in Supabase Auth.
4. Copy that Auth user UUID.
5. Run the optional admin profile insert at the bottom of `init-database.sql` after replacing the UUID and email.
6. Copy `.env.example` to `.env.local`.
7. Fill Supabase URL, anon key, and service role key.
8. Fill Aliyun Bailian API key and keep `ALIYUN_ENABLED=true`.
9. Fill cxzweb API key and keep `CXZWEB_ENABLED=false` until credit arrives.
10. Run `npm install`.
11. Run `npm run typecheck`.
12. Run `npm run build`.
13. Push the project to GitHub.
14. Import it into Vercel.
15. Add all environment variables in Vercel.
16. Configure payment provider webhooks.
17. Enable Vercel Cron Jobs.
18. Run sandbox payment tests.
19. Run API tests with a test user and test API key.

## Environment Variables

See `.env.example`.

Core:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_BEARER_TOKEN`
- `CRON_SECRET`

Upstreams:

- `ALIYUN_BAILIEN_API_KEY`
- `ALIYUN_ENABLED=true`
- `DEFAULT_UPSTREAM=aliyun`
- `ALIYUN_LOW_BALANCE_THRESHOLD_TOKENS=100000`
- `CXZWEB_API_KEY`
- `CXZWEB_ENABLED=false`
- `NO1API_API_KEY`
- `NO1API_ENABLED=false`
- `FREEMODEL_API_KEY`
- `FREEMODEL_ENABLED=false`

Payments:

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `COINBASE_API_KEY`
- `COINBASE_WEBHOOK_SECRET`

Webhook IP allowlists are optional comma-separated values:

- `PAYPAL_WEBHOOK_IP_ALLOWLIST`
- `STRIPE_WEBHOOK_IP_ALLOWLIST`
- `COINBASE_WEBHOOK_IP_ALLOWLIST`

## cxzweb Credit

1. Register at `https://api.euzhi.com/`.
2. Create or copy your cxzweb API key.
3. Follow the V2EX promotion thread instructions for the 17 USD comment credit.
4. Wait for the credit to appear in cxzweb.
5. In production env vars, set `CXZWEB_ENABLED=true`.
6. Update Supabase:

```sql
update public.upstream_config
set enabled = true, balance_usd = 17, status = 'normal', warning_message = null
where upstream_service = 'cxzweb';
```

7. Optionally switch primary upstream:

```bash
curl -X POST https://yourdomain.com/api/admin/upstream/switch \
  -H "Authorization: Bearer <ADMIN_BEARER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"upstream_service":"cxzweb","reason":"cxzweb credit received"}'
```

## Optional cxzweb Auto Recharge

The payment flow can optionally reserve part of each completed user payment for upstream cxzweb recharge. This is disabled by default because the cxzweb recharge API must be confirmed against the provider before live use.

Environment variables:

- `CXZWEB_AUTO_RECHARGE_ENABLED=false`
- `CXZWEB_RECHARGE_URL=https://api.euzhi.com/api/recharge`
- `CXZWEB_RECHARGE_RESERVE_RATIO=0.02`

When enabled, successful PayPal / Stripe / Coinbase webhook crediting still credits the user first, then attempts the cxzweb recharge. Results are written to `cxzweb_recharge_logs` and `system_logs`.

For the already deployed Supabase project, run:

```sql
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
```

## Cron Job

Vercel uses `vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/check-upstream", "schedule": "0 2 * * *" }]
}
```

The route checks Aliyun balance status, logs the result, and displays warnings in admin data sources. If Aliyun reaches 0 and cxzweb has credit, it switches to cxzweb.

Manual check:

```bash
curl https://yourdomain.com/api/cron/check-upstream \
  -H "Authorization: Bearer <CRON_SECRET>"
```

## Local Test Scripts

Start the local app:

```bash
npm run dev
```

Then run:

```bash
npm run test:signup
npm run test:login
npm run test:api-key
npm run test:balance
npm run test:upstream
```

Set these in `.env.local` for tests:

- `TEST_BASE_URL=http://localhost:3000`
- `TEST_EMAIL`
- `TEST_PASSWORD`
- `TEST_USER_TOKEN`
- `TEST_API_KEY`

## API Key Rotation

1. User creates a new key with `POST /api/user/api-keys`.
2. Update client apps to use the new key.
3. Revoke the old key with `DELETE /api/user/api-keys`.
4. Rotate upstream provider keys in Vercel env vars.
5. Redeploy after changing provider keys.

API keys are stored as SHA-256 hashes in `api_keys.key_hash`; raw keys are shown only once at creation.

## Security

- API rate limit: 60 requests per API key per minute.
- API keys are hashed before storage.
- Supabase client calls use structured query APIs and RPC parameters.
- Payment webhooks verify provider signatures.
- Optional webhook IP allowlists are supported.
- Service role key must stay server-side only.

For heavier production traffic, replace in-memory rate limiting with Redis or Upstash.

## FAQ

**Why is gpt-5.5 unavailable?**
cxzweb has no credit yet. Enable it only after credit arrives.

**Why did I get 402?**
User token balance is too low. Recharge first.

**Why did I get 429?**
The API key exceeded 60 requests in one minute.

**Why did webhook return 403?**
The sender IP is not in the configured allowlist. Check the provider IP range and env var.

**Can I run without payment setup?**
Yes for internal testing. Manually credit test users with `select public.credit_tokens('<uuid>', 1000000);`.

## Troubleshooting

- Build fails due to env vars: verify `.env.local` exists and Vercel env vars are set.
- Supabase RPC fails: rerun `init-database.sql`.
- User cannot call API: check API key status, token balance, and rate limit.
- qwen3.5 fails: verify Aliyun key and compatible-mode endpoint.
- gpt-5.5 fails: verify cxzweb credit and `CXZWEB_ENABLED=true`.
- Payments do not credit: verify webhook signature secret, provider event type, and `payments.transaction_id` uniqueness.
- Cron does not run: verify Vercel Cron is enabled and `CRON_SECRET` matches if used.

## Operational Tables

- `api_calls`: successful API calls.
- `payments`: payment lifecycle and webhook raw data.
- `upstream_switch_logs`: manual and automatic upstream switches.
- `system_logs`: API errors, payment logs, cron logs, upstream checks.
- `fund_pool`: prepaid cash pool.
- `upstream_config`: primary upstream, balance status, warnings.
