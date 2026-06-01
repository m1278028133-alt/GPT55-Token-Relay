import { assertAdmin, error, json } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  if (!assertAdmin(req)) return error("Admin token required.", "UNAUTHORIZED", 401);
  const { upstream_service, amount_usd } = await req.json();
  if (!upstream_service || !amount_usd) return error("upstream_service and amount_usd are required.", "VALIDATION_ERROR", 422);

  await supabaseAdmin.rpc("record_fund_pool_spend", { p_amount_usd: Number(amount_usd) });
  await supabaseAdmin.from("upstream_balance").upsert(
    {
      upstream_service,
      balance_usd: Number(amount_usd),
      last_updated: new Date().toISOString()
    },
    { onConflict: "upstream_service" }
  );

  return json({ ok: true });
}
