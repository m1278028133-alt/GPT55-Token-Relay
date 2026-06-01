import { NextResponse } from "next/server";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    }
  });
}

export function error(message: string, code: string, status = 400, extra: Record<string, unknown> = {}) {
  return json({ error: { message, code, ...extra } }, status);
}

export function bearer(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export function assertAdmin(req: Request) {
  const token = bearer(req);
  return Boolean(token && token === process.env.ADMIN_BEARER_TOKEN);
}
