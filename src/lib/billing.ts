import { supabaseAdmin } from "./supabase-admin";

export async function getTokenBalance(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("token_balances")
    .select("balance")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return Number(data.balance);
}

export async function ensureBalance(userId: string, requiredTokens: number) {
  const balance = await getTokenBalance(userId);
  return {
    ok: balance >= requiredTokens,
    balance,
    requiredTokens
  };
}

export async function debitTokens(userId: string, tokens: number) {
  const { error } = await supabaseAdmin.rpc("debit_tokens", {
    p_user_id: userId,
    p_tokens: tokens
  });
  if (error) throw error;
}

export async function creditTokens(userId: string, tokens: number) {
  const { error } = await supabaseAdmin.rpc("credit_tokens", {
    p_user_id: userId,
    p_tokens: tokens
  });
  if (error) throw error;
}
