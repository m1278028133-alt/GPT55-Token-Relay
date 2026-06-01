import { createClient } from "@supabase/supabase-js";
import { bearer, error, json } from "@/lib/http";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateApiKey, hashApiKey } from "@/lib/auth";

async function currentUser(req: Request) {
  const token = bearer(req);
  if (!token) return null;
  const client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const { data } = await client.auth.getUser();
  return data.user;
}

export async function GET(req: Request) {
  const user = await currentUser(req);
  if (!user) return error("Invalid session.", "UNAUTHORIZED", 401);
  const { data } = await supabaseAdmin
    .from("api_keys")
    .select("id,name,prefix,created_at,revoked")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return json({ api_keys: data ?? [] });
}

export async function POST(req: Request) {
  const user = await currentUser(req);
  if (!user) return error("Invalid session.", "UNAUTHORIZED", 401);
  const { name = "Default key" } = await req.json().catch(() => ({}));
  const key = generateApiKey();
  const { data, error: dbError } = await supabaseAdmin
    .from("api_keys")
    .insert({
      user_id: user.id,
      key_hash: hashApiKey(key),
      prefix: key.slice(0, 16),
      name
    })
    .select("id,name,prefix,created_at")
    .single();
  if (dbError) return error(dbError.message, "DATABASE_ERROR", 500);
  return json({ api_key: data, secret_key: key }, 201);
}

export async function DELETE(req: Request) {
  const user = await currentUser(req);
  if (!user) return error("Invalid session.", "UNAUTHORIZED", 401);
  const { id } = await req.json();
  const { error: dbError } = await supabaseAdmin
    .from("api_keys")
    .update({ revoked: true })
    .eq("id", id)
    .eq("user_id", user.id);
  if (dbError) return error(dbError.message, "DATABASE_ERROR", 500);
  return json({ ok: true });
}
