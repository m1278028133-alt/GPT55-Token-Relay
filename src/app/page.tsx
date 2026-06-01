import Link from "next/link";
import { Nav } from "@/components/nav";
import { rechargePlans } from "@/lib/plans";

export default function Home() {
  return (
    <main>
      <Nav />
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold text-cobalt">Prepaid AI API for global teams</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-ink md:text-5xl">GPTX API</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Buy GPT-5.5 API credits once, call through an OpenAI-compatible endpoint, and keep usage under control with prepaid balance checks.
              PayPal checkout supports PayPal balance, Visa, and Mastercard.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/pricing" className="rounded bg-cobalt px-4 py-2 text-sm font-semibold text-white focus-ring">
                Start with $10
              </Link>
              <Link href="/docs" className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-ink focus-ring">
                API Docs
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-paper p-5">
            <div className="text-sm font-semibold text-slate-700">How it works</div>
            <ol className="mt-4 space-y-3 text-sm text-slate-700">
              <li>1. Create an account and choose a prepaid credit pack.</li>
              <li>2. Pay securely with PayPal, Visa, or Mastercard.</li>
              <li>3. Receive API credits automatically after payment confirmation.</li>
              <li>4. Send requests to the OpenAI-compatible chat endpoint.</li>
              <li>5. Calls stop automatically when balance is insufficient.</li>
            </ol>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {rechargePlans.map((plan) => (
            <div key={plan.amountUsd} className="rounded-lg border border-line bg-white p-5">
              <div className="text-sm font-medium text-slate-500">{plan.label}</div>
              <div className="mt-2 text-3xl font-semibold">${plan.amountUsd}</div>
              <div className="mt-2 text-sm text-slate-600">{(plan.tokens / 1_000_000_000).toLocaleString()}B tokens</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
