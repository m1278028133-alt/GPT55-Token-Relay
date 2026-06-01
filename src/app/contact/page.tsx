import { Nav } from "@/components/nav";

export default function ContactPage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Contact</h1>
        <p className="mt-3 text-sm text-slate-600">Email: support@example.com</p>
      </section>
    </main>
  );
}
