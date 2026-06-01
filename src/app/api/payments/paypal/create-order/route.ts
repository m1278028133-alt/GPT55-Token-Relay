import { bearer, error, json } from "@/lib/http";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  const token = bearer(req);
  if (!token) return error("Missing user session token.", "UNAUTHORIZED", 401);
  const { amount_usd, user_id } = await req.json();
  const basic = Buffer.from(`${env.paypalClientId}:${env.paypalClientSecret}`).toString("base64");
  const authResp = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials"
  });
  const auth = await authResp.json();
  const orderResp = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{ amount: { currency_code: "USD", value: String(amount_usd) }, custom_id: user_id }]
    })
  });
  const order = await orderResp.json();
  return json({ order_id: order.id, links: order.links });
}
