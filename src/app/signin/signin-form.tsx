"use client";

import { useState } from "react";

export function SigninForm() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    const form = new FormData(event.currentTarget);
    try {
      const resp = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password")
        })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message ?? "Signin failed.");

      window.localStorage.setItem("user_token", data.token);
      window.location.href = "/dashboard";
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Signin failed.");
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 grid gap-4 rounded-lg border border-line bg-white p-5" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium">
        Email
        <input className="rounded border border-line px-3 py-2 font-normal" name="email" type="email" required />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Password
        <input className="rounded border border-line px-3 py-2 font-normal" name="password" type="password" required />
      </label>
      <button className="rounded bg-cobalt px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </button>
      {status ? <p className="text-sm text-red-600">{status}</p> : null}
    </form>
  );
}
