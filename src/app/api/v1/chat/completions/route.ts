import { bearer, error, json } from "@/lib/http";
import { verifyApiKey } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { debitTokens, ensureBalance } from "@/lib/billing";
import { estimateTokens, tokensToUsd, type ChatMessage } from "@/lib/tokens";
import { callUpstream, UpstreamError } from "@/lib/upstream";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { logEvent } from "@/lib/logger";

export const runtime = "nodejs";

export function OPTIONS() {
  return json({});
}

export async function POST(req: Request) {
  const apiKey = bearer(req);
  if (!apiKey) return error("Missing API key.", "UNAUTHORIZED", 401);
  const rate = checkRateLimit(apiKey);
  if (!rate.allowed) {
    await logEvent({ level: "warn", event: "api_call", message: "Rate limit exceeded." });
    return error("Rate limit exceeded.", "RATE_LIMITED", 429, { reset_at: rate.resetAt });
  }

  const keyRecord = await verifyApiKey(apiKey);
  if (!keyRecord) return error("Invalid or revoked API key.", "UNAUTHORIZED", 401);

  const body = await req.json();
  const messages = (body.messages ?? []) as ChatMessage[];
  const estimate = estimateTokens(messages, Number(body.max_tokens ?? body.max_completion_tokens ?? 500));
  const balance = await ensureBalance(keyRecord.user_id, estimate.totalTokens);

  if (!balance.ok) {
    await logEvent({
      level: "warn",
      event: "api_call",
      message: "API call rejected due to insufficient balance.",
      userId: keyRecord.user_id,
      metadata: { required_tokens: balance.requiredTokens, current_balance: balance.balance }
    });
    return error("Balance is insufficient. Please recharge before continuing.", "INSUFFICIENT_BALANCE", 402, {
      required_tokens: balance.requiredTokens,
      current_balance: balance.balance,
      required_amount: tokensToUsd(balance.requiredTokens)
    });
  }

  let upstream;
  try {
    upstream = await callUpstream(body);
  } catch (err) {
    if (err instanceof UpstreamError) {
      await logEvent({
        level: "error",
        event: "api_call",
        message: err.message,
        userId: keyRecord.user_id,
        metadata: { code: err.code, status: err.status }
      });
      return error(err.message, err.code, err.status);
    }
    await logEvent({ level: "error", event: "api_call", message: "Upstream request failed.", userId: keyRecord.user_id });
    return error("Upstream request failed.", "UPSTREAM_UNAVAILABLE", 503);
  }
  const usage = upstream.data?.usage ?? {};
  const actualTokens = Number(usage.total_tokens ?? estimate.totalTokens);
  const inputTokens = Number(usage.prompt_tokens ?? estimate.inputTokens);
  const outputTokens = Number(usage.completion_tokens ?? Math.max(0, actualTokens - inputTokens));

  await debitTokens(keyRecord.user_id, actualTokens);
  await supabaseAdmin.from("api_calls").insert({
    user_id: keyRecord.user_id,
    api_key_id: keyRecord.id,
    model: String(body.model ?? "qwen3.5"),
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: actualTokens,
    cost_usd: tokensToUsd(actualTokens),
    upstream_service: upstream.provider
  });
  await logEvent({
    event: "api_call",
    message: "API call completed.",
    userId: keyRecord.user_id,
    metadata: { model: String(body.model ?? "qwen3.5"), upstream: upstream.provider, total_tokens: actualTokens }
  });

  return json(upstream.data);
}
