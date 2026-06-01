import crypto from "crypto";
import Stripe from "stripe";
import { env } from "./env";
import { rechargePlans } from "./plans";
import { creditTokens } from "./billing";
import { supabaseAdmin } from "./supabase-admin";
import { maybeAutoRechargeCxzweb } from "./cxzweb-recharge";

export function paypalApiBaseUrl() {
  return env.paypalEnv === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

export function tokensForAmount(amountUsd: number) {
  const exact = rechargePlans.find((plan) => plan.amountUsd === amountUsd);
  if (exact) return exact.tokens;
  return Math.floor(amountUsd * 1_000_000);
}

export async function completePaymentOnce(input: {
  userId: string;
  amountUsd: number;
  method: "paypal" | "stripe" | "coinbase";
  transactionId: string;
  raw: unknown;
}) {
  const amountTokens = tokensForAmount(input.amountUsd);
  const { data: existing } = await supabaseAdmin
    .from("payments")
    .select("id,status")
    .eq("transaction_id", input.transactionId)
    .maybeSingle();
  if (existing?.status === "completed") return { credited: false, amountTokens };

  const { data: payment, error } = await supabaseAdmin
    .from("payments")
    .upsert(
      {
        user_id: input.userId,
        amount_usd: input.amountUsd,
        amount_tokens: amountTokens,
        payment_method: input.method,
        transaction_id: input.transactionId,
        status: "completed",
        confirmed_at: new Date().toISOString(),
        webhook_raw_data: input.raw
      },
      { onConflict: "transaction_id" }
    )
    .select("id")
    .single();
  if (error) throw error;

  await creditTokens(input.userId, amountTokens);
  await supabaseAdmin.rpc("record_fund_pool_deposit", { p_amount_usd: input.amountUsd });
  const cxzwebRecharge = await maybeAutoRechargeCxzweb({
    userId: input.userId,
    paymentId: payment.id,
    paymentAmountUsd: input.amountUsd,
    transactionId: input.transactionId
  });

  return { credited: true, amountTokens, paymentId: payment.id, cxzwebRecharge };
}

export async function verifyPaypalWebhook(req: Request, body: unknown) {
  const accessToken = await getPaypalAccessToken();
  const verificationBody = {
    auth_algo: req.headers.get("paypal-auth-algo"),
    cert_url: req.headers.get("paypal-cert-url"),
    transmission_id: req.headers.get("paypal-transmission-id"),
    transmission_sig: req.headers.get("paypal-transmission-sig"),
    transmission_time: req.headers.get("paypal-transmission-time"),
    webhook_id: env.paypalWebhookId,
    webhook_event: body
  };
  const resp = await fetch(`${paypalApiBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(verificationBody)
  });
  const data = await resp.json();
  return data.verification_status === "SUCCESS";
}

async function getPaypalAccessToken() {
  const basic = Buffer.from(`${env.paypalClientId}:${env.paypalClientSecret}`).toString("base64");
  const resp = await fetch(`${paypalApiBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const data = await resp.json();
  return data.access_token as string;
}

export function stripeClient() {
  return new Stripe(env.stripeSecretKey, { apiVersion: "2024-06-20" });
}

export function verifyCoinbaseSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const hmac = crypto.createHmac("sha256", env.coinbaseWebhookSecret);
  hmac.update(rawBody);
  const expected = hmac.digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
