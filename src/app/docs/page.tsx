import Link from "next/link";
import { Nav } from "@/components/nav";

const baseUrl = "https://gpt-55-token-relay.vercel.app/api/v1";

const curlExample = `curl ${baseUrl}/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-5.5",
    "messages": [
      { "role": "user", "content": "Say hello in one sentence." }
    ],
    "max_tokens": 120
  }'`;

const pythonExample = `import requests

resp = requests.post(
  "${baseUrl}/chat/completions",
  headers={
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  json={
    "model": "gpt-5.5",
    "messages": [
      {"role": "user", "content": "Say hello in one sentence."}
    ],
    "max_tokens": 120
  }
)

print(resp.status_code)
print(resp.json())`;

const nodeExample = `const resp = await fetch("${baseUrl}/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "gpt-5.5",
    messages: [
      { role: "user", content: "Say hello in one sentence." }
    ],
    max_tokens: 120
  })
});

console.log(resp.status);
console.log(await resp.json());`;

const codexConfig = `model_provider = "gptx"
model = "gpt-5.5"

[model_providers.gptx]
name = "GPTX API"
base_url = "${baseUrl}"
wire_api = "chat"
requires_openai_auth = true`;

const codexAuth = `{
  "OPENAI_API_KEY": "YOUR_API_KEY"
}`;

const steps = [
  ["1", "Sign in or create an account", "Open the console first. Your API tokens and balance are managed from the console page.", "/signin", "Sign in"],
  ["2", "Recharge balance", "Choose a $10, $20, or $50 credit pack. PayPal checkout also accepts Visa and Mastercard.", "/pricing", "View pricing"],
  ["3", "Create an API token", "Go to API Tokens, click Create token, and copy the key immediately. It is only shown once.", "/console/token", "Open token console"],
  ["4", "Configure your app", "Use the base URL and API key below in your code, Codex, or other OpenAI-compatible clients.", "#quick-reference", "Copy settings"],
  ["5", "Send a test request", "Run one of the examples. If balance is enough, the response will come from the GPTX API gateway.", "#examples", "View examples"]
];

const errors = [
  ["401 UNAUTHORIZED", "The API key is missing, typed incorrectly, or has been revoked. Create a new token in the console and try again."],
  ["402 INSUFFICIENT_BALANCE", "Your balance is too low. Recharge first; the upstream model is not called when this happens."],
  ["429 RATE_LIMITED", "Too many requests were sent in a short time. Wait briefly and retry."],
  ["503 MODEL_UNAVAILABLE", "The selected model is temporarily unavailable. Retry later or contact support."],
  ["503 UPSTREAM_UNAVAILABLE", "The gateway could not reach an available upstream provider."]
];

export default function DocsPage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-lg border border-line bg-white p-6">
          <p className="text-sm font-semibold text-cobalt">Beginner quick start</p>
          <h1 className="mt-2 text-3xl font-semibold">GPTX API usage guide</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Follow these steps in order: create an account, recharge, create an API token, configure your client, then send a test request.
            Do not skip the token or recharge steps.
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          {steps.map(([number, title, description, href, action]) => (
            <article key={number} className="rounded-lg border border-line bg-white p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-50 text-sm font-semibold text-cobalt">{number}</div>
              <h2 className="mt-3 text-sm font-semibold">{title}</h2>
              <p className="mt-2 min-h-20 text-sm leading-6 text-slate-600">{description}</p>
              <Link href={href} className="mt-3 inline-block text-sm font-semibold text-cobalt">
                {action}
              </Link>
            </article>
          ))}
        </div>

        <section id="quick-reference" className="mt-6 rounded-lg border border-line bg-white p-6">
          <h2 className="text-xl font-semibold">Quick reference</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Info label="Base URL" value={baseUrl} />
            <Info label="Model" value="gpt-5.5" />
            <Info label="Auth header" value="Authorization: Bearer YOUR_API_KEY" />
          </div>
        </section>

        <section id="examples" className="mt-6 rounded-lg border border-line bg-white p-6">
          <h2 className="text-xl font-semibold">Copy-and-run examples</h2>
          <p className="mt-2 text-sm text-slate-600">Replace <code>YOUR_API_KEY</code> with the token created in your console.</p>
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <CodeCard title="cURL" code={curlExample} />
            <CodeCard title="Python" code={pythonExample} />
            <CodeCard title="Node.js" code={nodeExample} />
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-line bg-white p-6">
            <h2 className="text-xl font-semibold">Codex setup</h2>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              <li>1. Install Codex if it is not installed yet.</li>
              <li>2. Create or edit <code>~/.codex/config.toml</code> and paste the config below.</li>
              <li>3. Create or edit <code>~/.codex/auth.json</code> and paste your GPTX API token.</li>
              <li>4. Run <code>codex</code> and send a short test prompt.</li>
            </ol>
            <CodeBlock title="config.toml" code={codexConfig} />
            <CodeBlock title="auth.json" code={codexAuth} />
          </div>

          <div className="rounded-lg border border-line bg-white p-6">
            <h2 className="text-xl font-semibold">Common errors</h2>
            <div className="mt-4 grid gap-3">
              {errors.map(([code, description]) => (
                <div key={code} className="rounded border border-line p-3">
                  <code className="text-sm font-semibold">{code}</code>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-line bg-white p-6">
          <h2 className="text-xl font-semibold">Checklist before asking for help</h2>
          <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-700 md:grid-cols-2">
            <li>API key starts with the expected prefix and has no extra spaces.</li>
            <li>Balance is greater than zero in the console.</li>
            <li>Base URL is exactly <code>{baseUrl}</code>.</li>
            <li>Model name is <code>gpt-5.5</code>.</li>
            <li>The request includes <code>Content-Type: application/json</code>.</li>
            <li>If using Codex, both <code>config.toml</code> and <code>auth.json</code> are saved.</li>
          </ul>
        </section>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
      <code className="mt-2 block break-all text-sm text-slate-900">{value}</code>
    </div>
  );
}

function CodeCard({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded-lg border border-line">
      <div className="border-b border-line px-4 py-3 text-sm font-semibold">{title}</div>
      <pre className="max-h-96 overflow-auto bg-slate-950 p-4 text-sm leading-6 text-slate-50">{code}</pre>
    </div>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="mt-4">
      <div className="text-sm font-semibold">{title}</div>
      <pre className="mt-2 overflow-auto rounded bg-slate-950 p-4 text-sm leading-6 text-slate-50">{code}</pre>
    </div>
  );
}
