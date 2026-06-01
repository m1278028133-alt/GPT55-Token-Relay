"use client";

import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [status, setStatus] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSendCode(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    if (!form) return;
    setLoading(true);
    setStatus("");
    try {
      const email = new FormData(form).get("email");
      const resp = await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "reset_password" })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message ?? "Unable to send code.");
      setSent(true);
      setStatus("Verification code sent. It expires in 5 minutes.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to send code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("new_password") ?? "");
    const confirmPassword = String(form.get("confirm_password") ?? "");
    if (newPassword !== confirmPassword) {
      setStatus("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const resp = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          code: form.get("code"),
          new_password: newPassword
        })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message ?? "Password reset failed.");
      setStatus("Password Reset Successful. Redirecting to login...");
      window.location.href = "/signin";
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Password reset failed.");
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 grid gap-4 rounded-lg border border-line bg-white p-5" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium">
        Email
        <input className="rounded border border-line px-3 py-2 font-normal" name="email" type="email" required />
      </label>
      <button
        className="rounded border border-line px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
        type="button"
        onClick={handleSendCode}
        disabled={loading}
      >
        {sent ? "Resend Code" : "Send Verification Code"}
      </button>
      <label className="grid gap-2 text-sm font-medium">
        Verification code
        <input
          className="rounded border border-line px-3 py-2 text-center text-lg font-semibold tracking-[0.35em]"
          name="code"
          inputMode="numeric"
          maxLength={6}
          pattern="[0-9]{6}"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        New password
        <input className="rounded border border-line px-3 py-2 font-normal" name="new_password" type="password" minLength={8} required />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Confirm new password
        <input className="rounded border border-line px-3 py-2 font-normal" name="confirm_password" type="password" minLength={8} required />
      </label>
      <button className="rounded bg-cobalt px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" type="submit" disabled={loading}>
        {loading ? "Working..." : "Reset Password"}
      </button>
      <Link href="/signin" className="text-sm text-cobalt">Remember your password? Login</Link>
      {status ? <p className="text-sm text-slate-600">{status}</p> : null}
    </form>
  );
}
