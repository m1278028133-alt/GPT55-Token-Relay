import { supabaseAdmin } from "./supabase-admin";
import { normalizeEmail } from "./email";

export type VerificationType = "register" | "reset_password";

export function isVerificationType(value: unknown): value is VerificationType {
  return value === "register" || value === "reset_password";
}

export async function consumeVerificationCode({
  email,
  code,
  type
}: {
  email: string;
  code: string;
  type: VerificationType;
}) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = String(code ?? "").trim();
  if (!normalizedEmail || !/^[0-9]{6}$/.test(normalizedCode)) {
    return { ok: false, message: "Invalid verification code." };
  }

  const { data } = await supabaseAdmin
    .from("email_verifications")
    .select("id,expires_at")
    .eq("email", normalizedEmail)
    .eq("code", normalizedCode)
    .eq("type", type)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return { ok: false, message: "Invalid verification code." };
  if (new Date(data.expires_at).getTime() < Date.now()) {
    return { ok: false, message: "Verification code has expired." };
  }

  const { error } = await supabaseAdmin.from("email_verifications").update({ used: true }).eq("id", data.id);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
