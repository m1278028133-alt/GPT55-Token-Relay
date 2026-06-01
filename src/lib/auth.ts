import { randomBytes, createHash } from "crypto";
import { supabaseAdmin } from "./supabase-admin";

export function generateApiKey() {
  return `sk_live_${randomBytes(24).toString("hex")}`;
}

export function hashApiKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

export async function verifyApiKey(key: string) {
  const keyHash = hashApiKey(key);
  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .select("id,user_id,revoked")
    .eq("key_hash", keyHash)
    .eq("revoked", false)
    .single();

  if (error || !data) return null;
  return data;
}
