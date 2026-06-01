import { error, json } from "@/lib/http";
import { generateVerificationCode, normalizeEmail, sendVerificationEmail } from "@/lib/email";
import { isVerificationType } from "@/lib/verification";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  const { email, type } = await req.json().catch(() => ({}));
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !isVerificationType(type)) {
    return error("Email and verification type are required.", "VALIDATION_ERROR", 422);
  }

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await supabaseAdmin
    .from("email_verifications")
    .update({ used: true })
    .eq("email", normalizedEmail)
    .eq("type", type)
    .eq("used", false);

  const { error: dbError } = await supabaseAdmin.from("email_verifications").insert({
    email: normalizedEmail,
    code,
    type,
    expires_at: expiresAt
  });
  if (dbError) return error(dbError.message, "DATABASE_ERROR", 500);

  try {
    await sendVerificationEmail({ email: normalizedEmail, code, type });
  } catch (sendError) {
    return error(sendError instanceof Error ? sendError.message : "Email delivery failed.", "EMAIL_DELIVERY_FAILED", 500);
  }

  return json({ ok: true, expires_at: expiresAt });
}
