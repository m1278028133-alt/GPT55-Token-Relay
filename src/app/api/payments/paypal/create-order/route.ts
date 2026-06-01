import { bearer, error, json } from "@/lib/http";
import { env } from "@/lib/env";
import { createClient } from "@supabase/supabase-js";
import { paypalApiBaseUrl } from "@/lib/payments";

export async function POST(req: Request) {
  const token = bearer(req);
  if (!token) return error("Missing user session token.", "UNAUTHORIZED", 401);
  const { amount_usd } = await req.json();
  const amountUsd = Number(amount_usd);
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return error("A valid amount_usd is required.", "VALIDATION_ERROR", 422);
  }

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

  const orderResp = await fetch(`${paypalApiBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{ amount: { currency_code: "USD", value: amountUsd.toFixed(2) }, custom_id: userData.user.id }],
      application_context: {
        return_url: `${env.appUrl}/pricing/paypal/return`,
        cancel_url: `${env.appUrl}/pricing`
      }
    })
  });
  const order = await orderResp.json();
  if (!orderResp.ok) return error("PayPal order creation failed.", "PAYPAL_ORDER_FAILED", 502, { details: order });
  return json({ order_id: order.id, links: order.links });
}
