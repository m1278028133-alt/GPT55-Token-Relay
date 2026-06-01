import { createClient } from "@supabase/supabase-js";
import { bearer, error, json } from "@/lib/http";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  const token = bearer(req);
  if (!token) return error("Missing bearer token.", "UNAUTHORIZED", 401);
  const client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) return error("Invalid session.", "UNAUTHORIZED", 401);

  const { data } = await supabaseAdmin
    .from("api_calls")
    .select("model,total_tokens,cost_usd,upstream_service,created_at")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return json({ usage: data ?? [] });
}
