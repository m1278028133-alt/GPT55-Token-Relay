import { error, json } from "@/lib/http";
import { completePaymentOnce, verifyPaypalWebhook } from "@/lib/payments";
import { isAllowedIp, parseIpAllowlist } from "@/lib/rate-limiter";
import { logEvent } from "@/lib/logger";

export async function POST(req: Request) {
  if (!isAllowedIp(req, parseIpAllowlist(process.env.PAYPAL_WEBHOOK_IP_ALLOWLIST))) {
    return error("Webhook IP is not allowed.", "IP_NOT_ALLOWED", 403);
  }
  const body = await req.json();
  const valid = await verifyPaypalWebhook(req, body);
  if (!valid) return error("Invalid PayPal webhook signature.", "INVALID_SIGNATURE", 400);

  if (body.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const resource = body.resource;
    await completePaymentOnce({
      userId: resource.custom_id,
      amountUsd: Number(resource.amount?.value),
      method: "paypal",
      transactionId: resource.id,
      raw: body
    });
    await logEvent({ event: "payment", message: "PayPal payment completed.", metadata: { transaction_id: resource.id } });
  }
  return json({ ok: true });
}
