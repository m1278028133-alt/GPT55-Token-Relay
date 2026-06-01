import { Nav } from "@/components/nav";
import { Stat } from "@/components/stat";

const upstreams = [
  {
    name: "Primary gateway",
    model: "gpt-5.5",
    status: "Ready",
    detail: "OpenAI-compatible requests are routed after prepaid balance checks.",
    tone: "text-mint"
  },
  {
    name: "Billing",
    model: "PayPal checkout",
    status: "Active",
    detail: "Successful PayPal orders are credited automatically through webhook confirmation.",
    tone: "text-mint"
  }
];

export default function DashboardPage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Manage API keys, prepaid balance, usage, and recharge access.</p>
          </div>
          <a href="/pricing" className="rounded bg-cobalt px-4 py-2 text-sm font-semibold text-white focus-ring">
            Recharge
          </a>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Stat label="Token balance" value="0" tone="warn" />
          <Stat label="Today usage" value="0" />
          <Stat label="Month usage" value="0" />
          <Stat label="Active keys" value="0" />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-base font-semibold">Available model</h2>
            <div className="mt-4 rounded border border-line p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">gpt-5.5</span>
                <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-mint">Available</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Use the OpenAI-compatible chat completions endpoint with your GPTX API key.
              </p>
            </div>
          </section>
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-base font-semibold">Service status</h2>
            <div className="mt-4 grid gap-3">
              {upstreams.map((upstream) => (
                <div key={upstream.name} className="rounded border border-line p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{upstream.name}</span>
                    <span className={`text-sm font-semibold ${upstream.tone}`}>{upstream.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{upstream.model}</p>
                  <p className="mt-1 text-xs text-slate-500">{upstream.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
