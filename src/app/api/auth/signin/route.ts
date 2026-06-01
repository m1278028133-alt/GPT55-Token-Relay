import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { json, error } from "@/lib/http";

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries());
  const { email, password } = body;
  const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);
  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email: String(email),
    password: String(password)
  });
  if (authError || !data.session) return error(authError?.message ?? "Signin failed.", "SIGNIN_FAILED", 401);

  return json({
    user: data.user,
    token: data.session.access_token
  });
}
