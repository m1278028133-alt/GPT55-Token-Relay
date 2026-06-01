import { Nav } from "@/components/nav";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="mt-2 text-sm text-slate-600">Enter your email, receive a 6-digit code, then set a new password.</p>
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
