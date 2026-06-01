import { Nav } from "@/components/nav";
import { rechargePlans } from "@/lib/plans";

export default function PricingPage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Pricing</h1>
        <p className="mt-2 text-sm text-slate-600">GPT-5.5 flagship model | prepaid mode | automatic stop when balance is insufficient.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {rechargePlans.map((plan) => (
            <article key={plan.amountUsd} className="rounded-lg border border-line bg-white p-5">
              <div className="text-sm font-semibold text-cobalt">{plan.label}</div>
              <div className="mt-3 text-3xl font-semibold">${plan.amountUsd}</div>
              <div className="mt-2 text-sm text-slate-600">{(plan.tokens / 1_000_000).toLocaleString()}M tokens</div>
              <div className="mt-5 grid gap-2">
                <button className="rounded border border-line px-3 py-2 text-sm font-medium">PayPal</button>
                <button className="rounded border border-line px-3 py-2 text-sm font-medium">Stripe</button>
                <button className="rounded border border-line px-3 py-2 text-sm font-medium">Coinbase</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
