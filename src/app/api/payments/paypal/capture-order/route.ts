import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { bearer, error, json } from "@/lib/http";
import { completePaymentOnce, paypalApiBaseUrl } from "@/lib/payments";

export async function POST(req: Request) {
  const token = bearer(req);
  if (!token) return error("Missing user session token.", "UNAUTHORIZED", 401);

  const { order_id } = await req.json();
  if (!order_id) return error("order_id is required.", "VALIDATION_ERROR", 422);

  const client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) return error("Invalid session.", "UNAUTHORIZED", 401);

  const basic = Buffer.from(`${env.paypalClientId}:${env.paypalClientSecret}`).toString("base64");
  const authResp = await fetch(`${paypalApiBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials"
  });
  const auth = await authResp.json();
  if (!authResp.ok) return error("PayPal auth failed.", "PAYPAL_AUTH_FAILED", 502, { details: auth });

  const captureResp = await fetch(`${paypalApiBaseUrl()}/v2/checkout/orders/${order_id}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.access_token}`, "Content-Type": "application/json" }
  });
  const capture = await captureResp.json();
  if (!captureResp.ok) return error("PayPal capture failed.", "PAYPAL_CAPTURE_FAILED", 502, { details: capture });

  const unit = capture.purchase_units?.[0];
  const captureData = unit?.payments?.captures?.[0];
  if (!captureData || captureData.status !== "COMPLETED") {
    return error("PayPal capture was not completed.", "PAYPAL_CAPTURE_INCOMPLETE", 400, { details: capture });
  }

  const customId = unit.custom_id;
  if (customId !== userData.user.id) return error("PayPal order user mismatch.", "PAYPAL_USER_MISMATCH", 403);

  const payment = await completePaymentOnce({
    userId: userData.user.id,
    amountUsd: Number(captureData.amount?.value),
    method: "paypal",
    transactionId: captureData.id,
    raw: capture
  });

  return json({ ok: true, payment });
}
