import { Nav } from "@/components/nav";
import { Stat } from "@/components/stat";

const upstreams = [
  {
    name: "阿里云百炼",
    model: "qwen3.5 -> qwen3.6-plus",
    status: "正常",
    detail: "当前主上游，使用 100 万 tokens 免费额度",
    tone: "text-mint"
  },
  {
    name: "cxzweb",
    model: "gpt-5.5",
    status: "无额度",
    detail: "API Key 已配置，等待 V2EX 评论赠送额度到账",
    tone: "text-amber"
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
            <p className="mt-1 text-sm text-slate-600">余额、用量、API Key、充值入口和当前上游状态。</p>
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
            <h2 className="text-base font-semibold">Available models</h2>
            <div className="mt-4 grid gap-3">
              <div className="rounded border border-line p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">qwen3.5</span>
                  <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-mint">可用</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">当前调用阿里云百炼 qwen3.6-plus。</p>
              </div>
              <div className="rounded border border-line p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">gpt-5.5</span>
                  <span className="rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber">暂不可用</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">cxzweb 有额度后自动开放；无额度时 API 返回上游暂不可用。</p>
              </div>
            </div>
          </section>
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-base font-semibold">Upstream status</h2>
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
