import { error, json } from "@/lib/http";
import { normalizeEmail } from "@/lib/email";
import { consumeVerificationCode } from "@/lib/verification";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  const { email, code, new_password } = await req.json().catch(() => ({}));
  const normalizedEmail = normalizeEmail(email);
  const newPassword = String(new_password ?? "");
  if (!normalizedEmail || !code || newPassword.length < 8) {
    return error("Email, verification code, and a new password are required.", "VALIDATION_ERROR", 422);
  }

  const verification = await consumeVerificationCode({ email: normalizedEmail, code: String(code), type: "reset_password" });
  if (!verification.ok) return error(verification.message ?? "Invalid verification code.", "INVALID_CODE", 400);

  const { data } = await supabaseAdmin.auth.admin.listUsers();
  const user = data.users.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail);
  if (!user) return error("No account exists for this email.", "USER_NOT_FOUND", 404);

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: newPassword,
    email_confirm: true
  });
  if (updateError) return error(updateError.message, "RESET_FAILED", 400);

  return json({ ok: true });
}
