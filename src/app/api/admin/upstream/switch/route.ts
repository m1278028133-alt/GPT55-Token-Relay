import { assertAdmin, error, json } from "@/lib/http";
import { setPrimaryUpstream, type UpstreamName } from "@/lib/upstream";

const allowed = new Set(["aliyun", "cxzweb", "no1api", "freemodel"]);

export async function POST(req: Request) {
  if (!assertAdmin(req)) return error("Admin token required.", "UNAUTHORIZED", 401);
  const { upstream_service, reason = "manual admin switch" } = await req.json();
  if (!allowed.has(upstream_service)) {
    return error("Invalid upstream_service.", "VALIDATION_ERROR", 422);
  }

  await setPrimaryUpstream(upstream_service as UpstreamName, reason);
  return json({ ok: true, upstream_service, reason });
}
