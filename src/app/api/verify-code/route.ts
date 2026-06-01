import { error, json } from "@/lib/http";
import { normalizeEmail } from "@/lib/email";
import { consumeVerificationCode, isVerificationType } from "@/lib/verification";

export async function POST(req: Request) {
  const { email, code, type } = await req.json().catch(() => ({}));
  if (!isVerificationType(type)) return error("Invalid verification type.", "VALIDATION_ERROR", 422);

  const result = await consumeVerificationCode({ email: normalizeEmail(email), code: String(code ?? ""), type });
  if (!result.ok) return error(result.message ?? "Invalid verification code.", "INVALID_CODE", 400);

  return json({ ok: true });
}
