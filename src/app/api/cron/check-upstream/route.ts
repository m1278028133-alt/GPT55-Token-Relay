import { error, json } from "@/lib/http";
import { checkAliyunBalance, getUpstreamStatuses } from "@/lib/upstream";
import { logError, logEvent } from "@/lib/logger";

export const runtime = "nodejs";

function isAuthorized(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  return expected ? auth === expected : req.headers.get("x-vercel-cron") === "1";
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return error("Cron secret required.", "UNAUTHORIZED", 401);

  try {
    const check = await checkAliyunBalance();
    const upstreams = await getUpstreamStatuses();
    await logEvent({
      event: "upstream_check",
      message: "Cron checked upstream balances.",
      metadata: { check, upstreams }
    });
    return json({ ok: true, check, upstreams });
  } catch (err) {
    await logError("Cron upstream check failed.", err);
    return error("Cron upstream check failed.", "CRON_FAILED", 500);
  }
}
