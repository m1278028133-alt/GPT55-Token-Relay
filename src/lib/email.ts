import { Resend } from "resend";
import { env } from "./env";

export function normalizeEmail(email: unknown) {
  return String(email ?? "").trim().toLowerCase();
}

export function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendVerificationEmail({
  email,
  code,
  type
}: {
  email: string;
  code: string;
  type: "register" | "reset_password";
}) {
  if (!env.resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const resend = new Resend(env.resendApiKey);
  const purpose = type === "register" ? "create your GPTX API account" : "reset your GPTX API password";

  const { error } = await resend.emails.send({
    from: env.smtpFrom,
    to: email,
    subject: `Your GPTX API verification code is ${code}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;color:#0f172a">
        <h1 style="font-size:22px;margin:0 0 12px">GPTX API verification</h1>
        <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 20px">
          Use this code to ${purpose}. It expires in 5 minutes.
        </p>
        <div style="font-size:34px;letter-spacing:8px;font-weight:700;background:#f1f5f9;border:1px solid #dbe3ef;border-radius:10px;padding:18px 20px;text-align:center">
          ${code}
        </div>
        <p style="font-size:13px;line-height:1.6;color:#64748b;margin:20px 0 0">
          If you did not request this email, you can safely ignore it.
        </p>
      </div>
    `
  });

  if (error) throw new Error(error.message);
}
