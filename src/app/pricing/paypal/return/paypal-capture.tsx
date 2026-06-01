"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function PaypalCapture() {
  const [status, setStatus] = useState("Confirming payment...");

  useEffect(() => {
    async function captureOrder() {
      const orderId = new URLSearchParams(window.location.search).get("token");
      const token = window.localStorage.getItem("user_token");
      if (!orderId) {
        setStatus("Missing PayPal order token.");
        return;
      }
      if (!token) {
        setStatus("Missing session token. Sign in again before confirming payment.");
        return;
      }

      try {
        const resp = await fetch("/api/payments/paypal/capture-order", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error?.message ?? "Payment confirmation failed.");
        setStatus("Payment confirmed. Tokens have been credited.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Payment confirmation failed.");
      }
    }

    void captureOrder();
  }, []);

  return (
    <div className="mt-6 rounded-lg border border-line bg-white p-5">
      <p className="text-sm text-slate-700">{status}</p>
      <Link href="/dashboard" className="mt-4 inline-flex rounded bg-cobalt px-4 py-2 text-sm font-semibold text-white">
        Dashboard
      </Link>
    </div>
  );
}
