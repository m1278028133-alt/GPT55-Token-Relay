import { env } from "./env";
import { logEvent } from "./logger";
import { supabaseAdmin } from "./supabase-admin";

type RechargeResult = {
  attempted: boolean;
  success: boolean;
  amountUsd: number;
  message: string;
};

export async function maybeAutoRechargeCxzweb(input: {
  userId: string;
  paymentId?: string;
  paymentAmountUsd: number;
  transactionId: string;
}): Promise<RechargeResult> {
  const reserveAmountUsd = roundUsd(input.paymentAmountUsd * env.cxzwebRechargeReserveRatio);
  if (!env.cxzwebAutoRechargeEnabled) {
    return {
      attempted: false,
      success: false,
      amountUsd: reserveAmountUsd,
      message: "cxzweb auto recharge is disabled."
    };
  }

  if (!env.cxzwebApiKey) {
    await recordRechargeLog(input, reserveAmountUsd, "skipped", "CXZWEB_API_KEY is missing.");
    return {
      attempted: false,
      success: false,
      amountUsd: reserveAmountUsd,
      message: "CXZWEB_API_KEY is missing."
    };
  }

  if (reserveAmountUsd <= 0) {
    return {
      attempted: false,
      success: false,
      amountUsd: reserveAmountUsd,
      message: "Reserve amount is zero."
    };
  }

  try {
    const resp = await fetch(env.cxzwebRechargeUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.cxzwebApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount_usd: reserveAmountUsd,
        source_transaction_id: input.transactionId
      })
    });
    const data = await resp.json().catch(() => ({}));

    if (!resp.ok || data?.success === false) {
      const message = data?.error ?? `cxzweb recharge failed with ${resp.status}`;
      await recordRechargeLog(input, reserveAmountUsd, "failed", message, data);
      await logEvent({
        level: "warn",
        event: "payment",
        message: "cxzweb auto recharge failed.",
        userId: input.userId,
        metadata: { status: resp.status, amount_usd: reserveAmountUsd }
      });
      return { attempted: true, success: false, amountUsd: reserveAmountUsd, message };
    }

    await recordRechargeLog(input, reserveAmountUsd, "success", null, data);
    await supabaseAdmin.from("upstream_balance").upsert(
      {
        upstream_service: "cxzweb",
        balance_usd: reserveAmountUsd,
        last_updated: new Date().toISOString()
      },
      { onConflict: "upstream_service" }
    );
    await logEvent({
      event: "payment",
      message: "cxzweb auto recharge completed.",
      userId: input.userId,
      metadata: { amount_usd: reserveAmountUsd }
    });
    return { attempted: true, success: true, amountUsd: reserveAmountUsd, message: "cxzweb recharge completed." };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown cxzweb recharge error.";
    await recordRechargeLog(input, reserveAmountUsd, "failed", message);
    await logEvent({
      level: "error",
      event: "payment",
      message: "cxzweb auto recharge threw an error.",
      userId: input.userId,
      metadata: { error: message, amount_usd: reserveAmountUsd }
    });
    return { attempted: true, success: false, amountUsd: reserveAmountUsd, message };
  }
}

async function recordRechargeLog(
  input: { userId: string; paymentId?: string; transactionId: string },
  amountUsd: number,
  status: "success" | "failed" | "skipped",
  errorMessage?: string | null,
  rawResponse?: unknown
) {
  await supabaseAdmin.from("cxzweb_recharge_logs").insert({
    user_id: input.userId,
    payment_id: input.paymentId ?? null,
    transaction_id: input.transactionId,
    amount_usd: amountUsd,
    status,
    error_message: errorMessage,
    raw_response: rawResponse ?? null
  });
}

function roundUsd(value: number) {
  return Math.round(value * 100) / 100;
}
