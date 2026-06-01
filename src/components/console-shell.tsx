import Link from "next/link";

const navItems = [
  ["Overview", "/dashboard"],
  ["API Tokens", "/console/token"],
  ["Pricing", "/pricing"],
  ["Docs", "/docs"],
  ["Support", "/contact"]
];

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-line bg-white px-4 py-5 lg:block">
        <Link href="/" className="text-lg font-semibold">
          GPTX API
        </Link>
        <nav className="mt-8 grid gap-1 text-sm">
          {navItems.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`rounded px-3 py-2 font-medium ${
                href === "/console/token" ? "bg-blue-50 text-cobalt" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-60">
        <header className="sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur">
          <div className="flex h-14 items-center justify-between px-4 lg:px-8">
            <div>
              <div className="text-sm font-semibold">Console</div>
              <div className="text-xs text-slate-500">Token and API key management</div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Link href="/pricing" className="rounded border border-line px-3 py-1.5 font-medium text-slate-700">
                Recharge
              </Link>
              <Link href="/signin" className="rounded bg-cobalt px-3 py-1.5 font-semibold text-white">
                Sign in
              </Link>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
