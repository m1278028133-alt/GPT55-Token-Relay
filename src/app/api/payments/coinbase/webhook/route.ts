import { error, json } from "@/lib/http";
import { completePaymentOnce, verifyCoinbaseSignature } from "@/lib/payments";
import { isAllowedIp, parseIpAllowlist } from "@/lib/rate-limiter";
import { logEvent } from "@/lib/logger";

export async function POST(req: Request) {
  if (!isAllowedIp(req, parseIpAllowlist(process.env.COINBASE_WEBHOOK_IP_ALLOWLIST))) {
    return error("Webhook IP is not allowed.", "IP_NOT_ALLOWED", 403);
  }
  const raw = await req.text();
  if (!verifyCoinbaseSignature(raw, req.headers.get("x-cc-webhook-signature"))) {
    return error("Invalid Coinbase signature.", "INVALID_SIGNATURE", 400);
  }
  const body = JSON.parse(raw);
  if (body.event?.type === "charge:confirmed") {
    const charge = body.event.data;
    await completePaymentOnce({
      userId: charge.metadata.user_id,
      amountUsd: Number(charge.pricing.local.amount),
      method: "coinbase",
      transactionId: charge.code,
      raw: body
    });
    await logEvent({ event: "payment", message: "Coinbase payment completed.", metadata: { transaction_id: charge.code } });
  }
  return json({ ok: true });
}
