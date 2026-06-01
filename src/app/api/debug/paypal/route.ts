import { env } from "@/lib/env";
import { error, json } from "@/lib/http";
import { paypalApiBaseUrl } from "@/lib/payments";

export const dynamic = "force-dynamic";

function fingerprint(value: string) {
  return {
    present: value.length > 0,
    length: value.length,
    suffix: value ? value.slice(-6) : ""
  };
}

export async function GET(req: Request) {
  const expectedToken = process.env.ADMIN_BEARER_TOKEN?.trim();
  const providedToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (expectedToken && providedToken !== expectedToken) {
    return error("Admin token required.", "UNAUTHORIZED", 401);
  }

  const result: Record<string, unknown> = {
    paypal_env: env.paypalEnv,
    paypal_base_url: paypalApiBaseUrl(),
    client_id: fingerprint(env.paypalClientId),
    client_secret: fingerprint(env.paypalClientSecret),
    webhook_id: fingerprint(env.paypalWebhookId),
    app_url: env.appUrl,
    deployment_id: process.env.VERCEL_DEPLOYMENT_ID ?? null
  };

  try {
    const basic = Buffer.from(`${env.paypalClientId}:${env.paypalClientSecret}`).toString("base64");
    const resp = await fetch(`${paypalApiBaseUrl()}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });
    const data = await resp.json();
    result.auth_ok = resp.ok;
    result.auth_status = resp.status;
    result.auth_error = data.error ?? data.name ?? null;
    result.auth_error_description = data.error_description ?? data.message ?? null;
  } catch (error) {
    result.auth_ok = false;
    result.auth_error = error instanceof Error ? error.message : "Unknown error";
  }

  return json(result);
}
