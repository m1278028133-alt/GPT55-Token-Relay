type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  return { allowed: true, remaining: limit - current.count, resetAt: current.resetAt };
}

export function isAllowedIp(req: Request, allowedIps: string[]) {
  if (allowedIps.length === 0) return true;
  const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
  const realIp = req.headers.get("x-real-ip") ?? "";
  const candidates = [realIp, ...forwardedFor.split(",").map((value) => value.trim())].filter(Boolean);
  return candidates.some((ip) => allowedIps.includes(ip));
}

export function parseIpAllowlist(value = "") {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
