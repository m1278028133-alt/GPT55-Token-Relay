import { error, json } from "@/lib/http";
import { completePaymentOnce, stripeClient } from "@/lib/payments";
import { env } from "@/lib/env";
import { isAllowedIp, parseIpAllowlist } from "@/lib/rate-limiter";
import { logEvent } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isAllowedIp(req, parseIpAllowlist(process.env.STRIPE_WEBHOOK_IP_ALLOWLIST))) {
    return error("Webhook IP is not allowed.", "IP_NOT_ALLOWED", 403);
  }
  const raw = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return error("Missing Stripe signature.", "INVALID_SIGNATURE", 400);

  const stripe = stripeClient();
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, env.stripeWebhookSecret);
  } catch {
    return error("Invalid Stripe signature.", "INVALID_SIGNATURE", 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    await completePaymentOnce({
      userId: String(session.metadata?.user_id),
      amountUsd: Number(session.amount_total ?? 0) / 100,
      method: "stripe",
      transactionId: session.id,
      raw: event
    });
    await logEvent({ event: "payment", message: "Stripe payment completed.", metadata: { transaction_id: session.id } });
  }
  return json({ ok: true });
}
