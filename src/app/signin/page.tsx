import { Nav } from "@/components/nav";

export default function SigninPage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-semibold">Sign In</h1>
        <form className="mt-6 grid gap-4 rounded-lg border border-line bg-white p-5" action="/api/auth/signin" method="post">
          <label className="grid gap-2 text-sm font-medium">
            Email
            <input className="rounded border border-line px-3 py-2 font-normal" name="email" type="email" required />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Password
            <input className="rounded border border-line px-3 py-2 font-normal" name="password" type="password" required />
          </label>
          <button className="rounded bg-cobalt px-4 py-2 text-sm font-semibold text-white" type="submit">
            Sign In
          </button>
        </form>
      </section>
    </main>
  );
}
