import { Nav } from "@/components/nav";

const curl = `curl https://yourdomain.com/api/v1/chat/completions \\
  -H "Authorization: Bearer sk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "qwen3.5",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 120
  }'`;

const python = `import requests

resp = requests.post(
  "https://yourdomain.com/api/v1/chat/completions",
  headers={"Authorization": "Bearer sk_live_xxx"},
  json={
    "model": "qwen3.5",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 120
  }
)
print(resp.status_code, resp.json())`;

const node = `const resp = await fetch("https://yourdomain.com/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sk_live_xxx",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "qwen3.5",
    messages: [{ role: "user", content: "Hello" }],
    max_tokens: 120
  })
});
console.log(resp.status, await resp.json());`;

const errors = [
  ["401 UNAUTHORIZED", "Missing, invalid, or revoked API key."],
  ["402 INSUFFICIENT_BALANCE", "Recharge before retrying. The upstream is not called."],
  ["429 RATE_LIMITED", "Maximum 60 requests per API key per minute."],
  ["503 MODEL_UNAVAILABLE", "Requested model is temporarily unavailable, for example gpt-5.5 before cxzweb credit arrives."],
  ["503 UPSTREAM_UNAVAILABLE", "All eligible upstream providers failed or are disabled."]
];

export default function DocsPage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold">API Docs</h1>
        <p className="mt-2 text-sm text-slate-600">
          OpenAI-compatible chat endpoint with prepaid balance checks. Current live model: qwen3.5.
        </p>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <div className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-base font-semibold">cURL</h2>
            <pre className="mt-3 overflow-auto rounded bg-slate-950 p-4 text-sm text-slate-50">{curl}</pre>
          </div>
          <div className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-base font-semibold">Python</h2>
            <pre className="mt-3 overflow-auto rounded bg-slate-950 p-4 text-sm text-slate-50">{python}</pre>
          </div>
          <div className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-base font-semibold">Node.js</h2>
            <pre className="mt-3 overflow-auto rounded bg-slate-950 p-4 text-sm text-slate-50">{node}</pre>
          </div>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-base font-semibold">Error codes</h2>
            <div className="mt-4 grid gap-2 text-sm">
              {errors.map(([code, description]) => (
                <div key={code} className="rounded border border-line p-3">
                  <code className="font-semibold">{code}</code>
                  <p className="mt-1 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-base font-semibold">Balance and recharge</h2>
            <p className="mt-3 text-sm text-slate-600">
              Every request estimates token usage before calling the upstream. If balance is insufficient, the API returns 402 and no upstream cost is incurred.
            </p>
            <pre className="mt-4 overflow-auto rounded bg-slate-950 p-4 text-sm text-slate-50">{`HTTP 402
{
  "error": {
    "message": "Balance is insufficient. Please recharge before continuing.",
    "code": "INSUFFICIENT_BALANCE",
    "required_tokens": 620,
    "current_balance": 100
  }
}`}</pre>
            <p className="mt-4 text-sm text-slate-600">Recharge from the Pricing page with PayPal, Stripe, or Coinbase. Webhook confirmation credits tokens automatically.</p>
          </section>
        </div>
      </section>
    </main>
  );
}
