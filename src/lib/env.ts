function readEnv(name: string, fallback = "") {
  return process.env[name] ?? fallback;
}

export const env = {
  supabaseUrl: readEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co"),
  supabaseAnonKey: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "missing-anon-key"),
  supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY", "missing-service-role-key"),
  cxzwebApiKey: readEnv("CXZWEB_API_KEY"),
  cxzwebBaseUrl: readEnv("CXZWEB_BASE_URL", "https://api.euzhi.com/v1"),
  cxzwebEnabled: readEnv("CXZWEB_ENABLED", "false") === "true",
  cxzwebAutoRechargeEnabled: readEnv("CXZWEB_AUTO_RECHARGE_ENABLED", "false") === "true",
  cxzwebRechargeUrl: readEnv("CXZWEB_RECHARGE_URL", "https://api.euzhi.com/api/recharge"),
  cxzwebRechargeReserveRatio: Number(readEnv("CXZWEB_RECHARGE_RESERVE_RATIO", "0.02")),
  no1ApiKey: readEnv("NO1API_API_KEY"),
  no1BaseUrl: readEnv("NO1API_BASE_URL", "https://api.rcouyi.com/v1"),
  no1Enabled: readEnv("NO1API_ENABLED", "false") === "true",
  freemodelApiKey: readEnv("FREEMODEL_API_KEY"),
  freemodelBaseUrl: readEnv("FREEMODEL_BASE_URL", "https://api.freemodel.dev/v1"),
  freemodelEnabled: readEnv("FREEMODEL_ENABLED", "false") === "true",
  aliyunApiKey: readEnv("ALIYUN_BAILIEN_API_KEY"),
  aliyunBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  aliyunEnabled: readEnv("ALIYUN_ENABLED", "true") === "true",
  defaultUpstream: readEnv("DEFAULT_UPSTREAM", "aliyun"),
  aliyunLowBalanceThresholdTokens: Number(readEnv("ALIYUN_LOW_BALANCE_THRESHOLD_TOKENS", "100000")),
  paypalClientId: readEnv("PAYPAL_CLIENT_ID"),
  paypalClientSecret: readEnv("PAYPAL_CLIENT_SECRET"),
  paypalWebhookId: readEnv("PAYPAL_WEBHOOK_ID"),
  stripeSecretKey: readEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: readEnv("STRIPE_WEBHOOK_SECRET"),
  coinbaseApiKey: readEnv("COINBASE_API_KEY"),
  coinbaseWebhookSecret: readEnv("COINBASE_WEBHOOK_SECRET"),
  coinbaseApiVersion: readEnv("COINBASE_API_VERSION", "2021-08-05"),
  adminBearerToken: readEnv("ADMIN_BEARER_TOKEN")
};
