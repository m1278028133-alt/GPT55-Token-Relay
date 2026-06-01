import { Nav } from "@/components/nav";
import { Stat } from "@/components/stat";

const switchCurl = `curl -X POST https://yourdomain.com/api/admin/upstream/switch \\
  -H "Authorization: Bearer <ADMIN_BEARER_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"upstream_service":"cxzweb","reason":"cxzweb credit received"}'`;

const monitorRows = [
  ["Current users", "admin_metrics.user_count"],
  ["Today recharge", "admin_metrics.today_recharge_usd"],
  ["Today API calls", "admin_metrics.today_api_calls"],
  ["Upstream balance", "upstream_config.balance_tokens / balance_usd"],
  ["Fund pool", "admin_metrics.fund_pool_balance"],
  ["Error rate", "error_count_today / total_logs_today"]
];

export default function AdminPage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Admin Monitor</h1>
        <p className="mt-2 text-sm text-slate-600">
          Read-only operations panel for prepaid balance, upstream health, cron checks, and switching history.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Stat label="Users" value="0" />
          <Stat label="Today recharge" value="$0" tone="good" />
          <Stat label="API calls" value="0" />
          <Stat label="Aliyun tokens" value="1M" tone="good" />
          <Stat label="Fund pool" value="$0" />
          <Stat label="Error rate" value="0%" tone="good" />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-base font-semibold">Upstream status</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded border border-line p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">Aliyun Bailian</span>
                  <span className="font-semibold text-mint">Primary / Normal</span>
                </div>
                <p className="mt-1 text-slate-600">qwen3.5 maps to qwen3.5-coder-480b. Warning threshold: 100k tokens.</p>
              </div>
              <div className="rounded border border-line p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">cxzweb</span>
                  <span className="font-semibold text-amber">Standby / No quota</span>
                </div>
                <p className="mt-1 text-slate-600">Enable after V2EX promotional credit arrives.</p>
              </div>
            </div>
          </section>
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-base font-semibold">Metrics source</h2>
            <div className="mt-4 grid gap-2 text-sm">
              {monitorRows.map(([label, source]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded border border-line px-3 py-2">
                  <span>{label}</span>
                  <code className="text-xs text-slate-500">{source}</code>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-base font-semibold">Manual upstream switch</h2>
            <p className="mt-2 text-sm text-slate-600">Run this after cxzweb credit is available and you want it to become primary.</p>
            <pre className="mt-4 overflow-auto rounded bg-slate-950 p-4 text-sm text-slate-50">{switchCurl}</pre>
          </section>
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-base font-semibold">Logs</h2>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="rounded border border-line p-3">API calls: api_calls + system_logs</div>
              <div className="rounded border border-line p-3">Payments: payments + system_logs</div>
              <div className="rounded border border-line p-3">Switches: upstream_switch_logs</div>
              <div className="rounded border border-line p-3">Errors: system_logs where level = error</div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
