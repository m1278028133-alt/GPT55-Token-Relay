import { json, error } from "@/lib/http";
import { normalizeEmail } from "@/lib/email";
import { consumeVerificationCode } from "@/lib/verification";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  const { email, password, code } = await req.json().catch(() => ({}));
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password ?? "");
  if (!normalizedEmail || normalizedPassword.length < 8 || !code) {
    return error("Email, password, and verification code are required.", "VALIDATION_ERROR", 422);
  }

  const verification = await consumeVerificationCode({ email: normalizedEmail, code: String(code), type: "register" });
  if (!verification.ok) return error(verification.message ?? "Invalid verification code.", "INVALID_CODE", 400);

  const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
  if (existing.users.some((user) => user.email?.toLowerCase() === normalizedEmail)) {
    return error("Email is already registered.", "EMAIL_EXISTS", 409);
  }

  const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    password: normalizedPassword,
    email_confirm: true
  });
  if (authError || !data.user) return error(authError?.message ?? "Signup failed.", "SIGNUP_FAILED", 400);

  await supabaseAdmin.from("users").upsert({
    id: data.user.id,
    email: normalizedEmail,
    role: "user"
  });
  await supabaseAdmin.from("token_balances").upsert({
    user_id: data.user.id,
    balance: 0
  });

  return json({ user: { id: data.user.id, email: normalizedEmail } }, 201);
}
