import { json, error } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries());
  const { email, password } = body;
  if (!email || !password) return error("Email and password are required.", "VALIDATION_ERROR", 422);

  const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: String(email),
    password: String(password),
    email_confirm: true
  });
  if (authError || !data.user) return error(authError?.message ?? "Signup failed.", "SIGNUP_FAILED", 400);

  await supabaseAdmin.from("users").insert({
    id: data.user.id,
    email: String(email),
    role: "user"
  });
  await supabaseAdmin.from("token_balances").insert({
    user_id: data.user.id,
    balance: 0
  });

  return json({ user: { id: data.user.id, email: String(email) } }, 201);
}
