import { Nav } from "@/components/nav";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="mt-2 text-sm text-slate-600">Verify your email with a 6-digit code before creating your GPTX API account.</p>
        <RegisterForm />
      </section>
    </main>
  );
}
