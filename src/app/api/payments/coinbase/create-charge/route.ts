import { error, json } from "@/lib/http";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  const { amount_usd, user_id } = await req.json();
  if (!amount_usd || !user_id) return error("amount_usd and user_id are required.", "VALIDATION_ERROR", 422);

  const resp = await fetch("https://api.commerce.coinbase.com/charges", {
    method: "POST",
    headers: {
      "X-CC-Api-Key": env.coinbaseApiKey,
      "X-CC-Version": env.coinbaseApiVersion,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: "GPT-5.5 Token Recharge",
      description: `${amount_usd} USD token recharge`,
      pricing_type: "fixed_price",
      local_price: { amount: String(amount_usd), currency: "USD" },
      metadata: { user_id }
    })
  });
  const data = await resp.json();
  return json({ hosted_url: data.data?.hosted_url, code: data.data?.code });
}
