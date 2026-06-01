import { supabaseAdmin } from "./supabase-admin";

export type LogLevel = "info" | "warn" | "error";
export type LogEvent =
  | "api_call"
  | "payment"
  | "upstream_switch"
  | "upstream_check"
  | "webhook"
  | "auth"
  | "system_error";

export async function logEvent(input: {
  level?: LogLevel;
  event: LogEvent;
  message: string;
  userId?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("system_logs").insert({
      level: input.level ?? "info",
      event: input.event,
      message: input.message,
      user_id: input.userId ?? null,
      request_id: input.requestId ?? null,
      metadata: input.metadata ?? {}
    });
  } catch (err) {
    console.error("Failed to write system log", err);
  }
}

export async function logError(message: string, err: unknown, metadata: Record<string, unknown> = {}) {
  await logEvent({
    level: "error",
    event: "system_error",
    message,
    metadata: {
      ...metadata,
      error: err instanceof Error ? err.message : String(err)
    }
  });
}
