import Link from "next/link";

const links = [
  ["Dashboard", "/dashboard"],
  ["Pricing", "/pricing"],
  ["API Docs", "/docs"],
  ["Admin", "/admin"],
  ["Contact", "/contact"]
];

export function Nav() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-base font-semibold tracking-normal">
          GPT-5.5 Token Relay
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="rounded px-3 py-2 text-slate-700 hover:bg-slate-100 focus-ring">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
