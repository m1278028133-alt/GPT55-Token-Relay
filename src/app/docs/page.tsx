import { Nav } from "@/components/nav";

const curl = `curl https://gpt-55-token-relay.vercel.app/api/v1/chat/completions \\
  -H "Authorization: Bearer sk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-5.5",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 120
  }'`;

const python = `import requests

resp = requests.post(
  "https://gpt-55-token-relay.vercel.app/api/v1/chat/completions",
  headers={"Authorization": "Bearer sk_live_xxx"},
  json={
    "model": "gpt-5.5",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 120
  }
)
print(resp.status_code, resp.json())`;

const node = `const resp = await fetch("https://gpt-55-token-relay.vercel.app/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sk_live_xxx",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "gpt-5.5",
    messages: [{ role: "user", content: "Hello" }],
    max_tokens: 120
  })
});
console.log(resp.status, await resp.json());`;

const errors = [
  ["401 UNAUTHORIZED", "Missing, invalid, or revoked API key."],
  ["402 INSUFFICIENT_BALANCE", "Recharge before retrying. The upstream is not called."],
  ["429 RATE_LIMITED", "Maximum 60 requests per API key per minute."],
  ["503 MODEL_UNAVAILABLE", "The requested model is temporarily unavailable."],
  ["503 UPSTREAM_UNAVAILABLE", "All eligible upstream providers failed or are disabled."]
];

export default function DocsPage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-sm font-semibold text-cobalt">Developer guide</p>
        <h1 className="mt-2 text-2xl font-semibold">API Docs</h1>
        <p className="mt-2 text-sm text-slate-600">
          This page is the integration tutorial for developers. Use GPTX API as an OpenAI-compatible chat endpoint with prepaid balance checks.
        </p>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {[
            ["cURL", curl],
            ["Python", python],
            ["Node.js", node]
          ].map(([label, code]) => (
            <div key={label} className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-base font-semibold">{label}</h2>
              <pre className="mt-3 overflow-auto rounded bg-slate-950 p-4 text-sm text-slate-50">{code}</pre>
            </div>
          ))}
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
    "code": "INSUFFICIENT_BALANCE"
  }
}`}</pre>
            <p className="mt-4 text-sm text-slate-600">
              Recharge from the Pricing page with PayPal. Webhook confirmation credits tokens automatically.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
