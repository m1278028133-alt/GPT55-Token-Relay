import Link from "next/link";
import { Nav } from "@/components/nav";
import { rechargePlans } from "@/lib/plans";

export default function Home() {
  return (
    <main>
      <Nav />
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold text-cobalt">Prepaid token gateway</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-ink md:text-5xl">
              GPT-5.5 Token Relay
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              预付费余额、API Key 鉴权、OpenAI 兼容接口、支付 webhook 自动入账、余额不足自动停止调用。每次转发前先检查余额，避免未付费请求进入上游。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard" className="rounded bg-cobalt px-4 py-2 text-sm font-semibold text-white focus-ring">
                Open Dashboard
              </Link>
              <Link href="/docs" className="rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-ink focus-ring">
                API Docs
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-paper p-5">
            <div className="text-sm font-semibold text-slate-700">Core flow</div>
            <ol className="mt-4 space-y-3 text-sm text-slate-700">
              <li>1. 用户注册后余额为 0，无法调用 API。</li>
              <li>2. PayPal / Stripe / Coinbase webhook 验签后自动加 tokens。</li>
              <li>3. API 请求先估算 tokens 并检查余额。</li>
              <li>4. 余额不足返回 402，不调用上游。</li>
              <li>5. 调用成功后按实际 tokens 扣减余额并记录日志。</li>
            </ol>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {rechargePlans.slice(0, 3).map((plan) => (
            <div key={plan.amountUsd} className="rounded-lg border border-line bg-white p-5">
              <div className="text-sm font-medium text-slate-500">{plan.label}</div>
              <div className="mt-2 text-3xl font-semibold">${plan.amountUsd}</div>
              <div className="mt-2 text-sm text-slate-600">{(plan.tokens / 1_000_000).toLocaleString()}M tokens</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
