import { env } from "./env";
import { supabaseAdmin } from "./supabase-admin";

export type UpstreamName = "aliyun" | "cxzweb" | "no1api" | "freemodel";

type Provider = {
  name: UpstreamName;
  label: string;
  baseUrl: string;
  apiKey: string;
  enabledByEnv: boolean;
  priority: number;
  balanceTokens?: number;
  balanceUsd?: number;
  modelMap: Record<string, string>;
};

export type UpstreamErrorCode = "MODEL_UNAVAILABLE" | "UPSTREAM_UNAVAILABLE" | "UPSTREAM_BALANCE_EMPTY";

export class UpstreamError extends Error {
  constructor(
    public code: UpstreamErrorCode,
    message: string,
    public status = 503
  ) {
    super(message);
  }
}

const baseProviders: Provider[] = [
  {
    name: "aliyun",
    label: "Aliyun Bailian",
    baseUrl: env.aliyunBaseUrl,
    apiKey: env.aliyunApiKey,
    enabledByEnv: env.aliyunEnabled,
    priority: 1,
    balanceTokens: 1_000_000,
    modelMap: {
      "qwen3.5": "qwen3.5-coder-480b",
      "qwen3.5-coder-480b": "qwen3.5-coder-480b",
      "qwen-turbo": "qwen-turbo",
      "qwen-max": "qwen-max"
    }
  },
  {
    name: "cxzweb",
    label: "cxzweb",
    baseUrl: env.cxzwebBaseUrl,
    apiKey: env.cxzwebApiKey,
    enabledByEnv: env.cxzwebEnabled,
    priority: 2,
    balanceUsd: 0,
    modelMap: {
      "gpt-5.5": "gpt-5.5",
      "gpt-5.4": "gpt-5.4",
      "gpt-5.3-codex": "gpt-5.3-codex"
    }
  },
  {
    name: "no1api",
    label: "No.1-API",
    baseUrl: env.no1BaseUrl,
    apiKey: env.no1ApiKey,
    enabledByEnv: env.no1Enabled,
    priority: 3,
    modelMap: {
      "gpt-5.5": "gpt-5.5",
      "gpt-5.4": "gpt-5.4"
    }
  },
  {
    name: "freemodel",
    label: "freemodel.dev",
    baseUrl: env.freemodelBaseUrl,
    apiKey: env.freemodelApiKey,
    enabledByEnv: env.freemodelEnabled,
    priority: 4,
    modelMap: {
      "gpt-5.5": "gpt-5.5",
      "gpt-5.4": "gpt-5.4"
    }
  }
];

export async function getUpstreamStatuses() {
  const { data } = await supabaseAdmin
    .from("upstream_config")
    .select("upstream_service,enabled,is_primary,balance_tokens,balance_usd,status,last_checked_at,warning_message");

  const db = new Map((data ?? []).map((row) => [row.upstream_service as UpstreamName, row]));
  return baseProviders.map((provider) => {
    const row = db.get(provider.name);
    const balanceTokens = Number(row?.balance_tokens ?? provider.balanceTokens ?? 0);
    const balanceUsd = Number(row?.balance_usd ?? provider.balanceUsd ?? 0);
    const enabled = Boolean(provider.apiKey && provider.enabledByEnv && (row?.enabled ?? true));
    const status = row?.status ?? inferStatus(provider.name, enabled, balanceTokens, balanceUsd);
    return {
      ...provider,
      enabled,
      isPrimary: Boolean(row?.is_primary ?? provider.name === env.defaultUpstream),
      balanceTokens,
      balanceUsd,
      status,
      lastCheckedAt: row?.last_checked_at ?? null,
      warningMessage: row?.warning_message ?? null
    };
  });
}

export async function setPrimaryUpstream(upstream: UpstreamName, reason: string) {
  await supabaseAdmin.rpc("set_primary_upstream", {
    p_upstream_service: upstream,
    p_reason: reason
  });
}

export async function recordUpstreamSwitch(from: UpstreamName | null, to: UpstreamName, reason: string) {
  await supabaseAdmin.from("upstream_switch_logs").insert({
    from_upstream: from,
    to_upstream: to,
    reason
  });
}

export async function checkAliyunBalance() {
  const statuses = await getUpstreamStatuses();
  const aliyun = statuses.find((provider) => provider.name === "aliyun");
  const cxzweb = statuses.find((provider) => provider.name === "cxzweb");
  if (!aliyun) return null;

  const warning =
    aliyun.balanceTokens <= 0
      ? "Aliyun Bailian balance is empty."
      : aliyun.balanceTokens < env.aliyunLowBalanceThresholdTokens
        ? "Aliyun Bailian balance is below 100k tokens."
        : null;

  await supabaseAdmin
    .from("upstream_config")
    .update({
      status: warning ? "warning" : "normal",
      warning_message: warning,
      last_checked_at: new Date().toISOString()
    })
    .eq("upstream_service", "aliyun");

  if (aliyun.balanceTokens <= 0 && cxzweb?.enabled && cxzweb.balanceUsd > 0) {
    await setPrimaryUpstream("cxzweb", "Aliyun balance is empty; switched to cxzweb automatically.");
  }

  return { warning, balanceTokens: aliyun.balanceTokens };
}

export async function callUpstream(payload: Record<string, unknown>) {
  const requestedModel = String(payload.model ?? "qwen3.5");
  const statuses = await getUpstreamStatuses();
  const primary = statuses.find((provider) => provider.isPrimary);
  const ordered = [...statuses].sort((a, b) => {
    if (a.name === primary?.name) return -1;
    if (b.name === primary?.name) return 1;
    return a.priority - b.priority;
  });

  if (requestedModel === "gpt-5.5") {
    const cxzweb = statuses.find((provider) => provider.name === "cxzweb");
    if (!cxzweb?.enabled || cxzweb.balanceUsd <= 0) {
      throw new UpstreamError("MODEL_UNAVAILABLE", "上游暂不可用，请稍后再试", 503);
    }
    return callProvider(cxzweb, payload, requestedModel);
  }

  const candidates = ordered.filter((provider) => {
    return provider.enabled && provider.modelMap[requestedModel] && hasBalance(provider);
  });

  let lastError = "";
  for (const provider of candidates) {
    try {
      return await callProvider(provider, payload, requestedModel);
    } catch (err) {
      lastError = err instanceof Error ? err.message : "unknown upstream error";
      await recordUpstreamSwitch(provider.name, nextCandidateName(candidates, provider.name), `Automatic failover: ${lastError}`);
    }
  }

  throw new UpstreamError("UPSTREAM_UNAVAILABLE", lastError || "No available upstream provider for this model.", 503);
}

function inferStatus(provider: UpstreamName, enabled: boolean, balanceTokens: number, balanceUsd: number) {
  if (!enabled) return "disabled";
  if (provider === "aliyun" && balanceTokens <= 0) return "empty";
  if (provider === "aliyun" && balanceTokens < env.aliyunLowBalanceThresholdTokens) return "warning";
  if (provider === "cxzweb" && balanceUsd <= 0) return "no_quota";
  return "normal";
}

function hasBalance(provider: Awaited<ReturnType<typeof getUpstreamStatuses>>[number]) {
  if (provider.name === "aliyun") return provider.balanceTokens > 0;
  if (provider.name === "cxzweb") return provider.balanceUsd > 0;
  return true;
}

async function callProvider(provider: Awaited<ReturnType<typeof getUpstreamStatuses>>[number], payload: Record<string, unknown>, requestedModel: string) {
  const upstreamModel = provider.modelMap[requestedModel];
  const resp = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ...payload, model: upstreamModel })
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    if (resp.status === 402 || resp.status === 429) {
      await markProviderEmpty(provider.name, `${provider.label} returned ${resp.status}.`);
    }
    throw new UpstreamError("UPSTREAM_UNAVAILABLE", `${provider.label}: ${resp.status}`, resp.status);
  }
  return { provider: provider.name, upstreamModel, data };
}

async function markProviderEmpty(provider: UpstreamName, warning: string) {
  await supabaseAdmin
    .from("upstream_config")
    .update({
      status: "warning",
      warning_message: warning,
      last_checked_at: new Date().toISOString()
    })
    .eq("upstream_service", provider);
}

function nextCandidateName(candidates: Array<{ name: UpstreamName }>, current: UpstreamName) {
  const index = candidates.findIndex((provider) => provider.name === current);
  return candidates[index + 1]?.name ?? current;
}
