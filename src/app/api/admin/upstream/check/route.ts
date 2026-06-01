import { assertAdmin, error, json } from "@/lib/http";
import { checkAliyunBalance, getUpstreamStatuses } from "@/lib/upstream";

export async function GET(req: Request) {
  if (!assertAdmin(req)) return error("Admin token required.", "UNAUTHORIZED", 401);
  const check = await checkAliyunBalance();
  const upstreams = await getUpstreamStatuses();
  return json({ check, upstreams });
}
