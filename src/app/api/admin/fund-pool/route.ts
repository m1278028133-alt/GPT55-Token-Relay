import { assertAdmin, error, json } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  if (!assertAdmin(req)) return error("Admin token required.", "UNAUTHORIZED", 401);
  const { data, error: dbError } = await supabaseAdmin
    .from("fund_pool")
    .select("total_deposited,total_spent,current_balance,last_updated")
    .single();
  if (dbError) return error(dbError.message, "DATABASE_ERROR", 500);
  return json(data);
}
