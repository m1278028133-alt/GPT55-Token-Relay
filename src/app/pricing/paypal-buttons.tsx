"use client";

import { useState } from "react";

export function PaypalButton({ amountUsd }: { amountUsd: number }) {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    const token = window.localStorage.getItem("user_token");
    if (!token) {
      setStatus("Sign in first, then paste your session token into localStorage as user_token.");
      return;
    }

    setLoading(true);
    setStatus("Creating PayPal order...");
    try {
      const resp = await fetch("/api/payments/paypal/create-order", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount_usd: amountUsd })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message ?? "PayPal order failed.");

      const approveUrl = data.links?.find((link: { rel: string; href: string }) => link.rel === "approve")?.href;
      if (!approveUrl) throw new Error("PayPal did not return an approval URL.");
      window.location.href = approveUrl;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "PayPal checkout failed.");
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-1">
      <button
        className="rounded border border-line px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        onClick={startCheckout}
        disabled={loading}
      >
        {loading ? "Opening PayPal..." : "PayPal"}
      </button>
      {status ? <p className="text-xs text-slate-500">{status}</p> : null}
    </div>
  );
}
