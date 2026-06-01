import { Nav } from "@/components/nav";
import { rechargePlans } from "@/lib/plans";
import { PaypalButton } from "./paypal-buttons";

const descriptions: Record<string, string> = {
  Starter: "Personal builds, testing, and small automations.",
  Pro: "A practical pack for regular development work.",
  Scale: "Higher-volume usage for products and teams."
};

export default function PricingPage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-cobalt">Pay once. Use until credits run out.</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">GPT-5.5 API credit packs</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Each pack converts payment into API balance automatically after PayPal confirms the order. Cards are accepted through PayPal checkout.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {rechargePlans.map((plan) => (
            <article
              key={plan.amountUsd}
              className={`rounded-lg border bg-white p-5 ${plan.amountUsd === 20 ? "border-cobalt shadow-sm" : "border-line"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-cobalt">{plan.label}</div>
                {plan.amountUsd === 20 ? (
                  <span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-cobalt">Popular</span>
                ) : null}
              </div>
              <div className="mt-4 text-4xl font-semibold">${plan.amountUsd}</div>
              <div className="mt-2 text-sm text-slate-600">{(plan.tokens / 1_000_000_000).toLocaleString()}B API tokens</div>
              <p className="mt-4 min-h-12 text-sm leading-6 text-slate-600">{descriptions[plan.label]}</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                <li>OpenAI-compatible chat endpoint</li>
                <li>Automatic prepaid balance checks</li>
                <li>PayPal, Visa, and Mastercard checkout</li>
              </ul>
              <div className="mt-6">
                <PaypalButton amountUsd={plan.amountUsd} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
