import { createClient } from "@supabase/supabase-js";
import { bearer, error, json } from "@/lib/http";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { tokensToUsd } from "@/lib/tokens";

export async function GET(req: Request) {
  const token = bearer(req);
  if (!token) return error("Missing bearer token.", "UNAUTHORIZED", 401);
  const client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) return error("Invalid session.", "UNAUTHORIZED", 401);

  const { data, error: dbError } = await supabaseAdmin
    .from("token_balances")
    .select("balance")
    .eq("user_id", userData.user.id)
    .single();
  if (dbError) return error(dbError.message, "DATABASE_ERROR", 500);

  return json({ balance: data.balance, balance_usd: tokensToUsd(Number(data.balance)) });
}
