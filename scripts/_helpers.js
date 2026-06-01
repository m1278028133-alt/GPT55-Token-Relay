const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.warn(".env.local not found. Using current process environment.");
    return;
  }
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1).replace(/^["']|["']$/g, "");
    process.env[key] = process.env[key] || value;
  }
}

function baseUrl() {
  return process.env.TEST_BASE_URL || "http://localhost:3000";
}

async function request(pathname, options = {}) {
  const resp = await fetch(`${baseUrl()}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await resp.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  console.log(resp.status, data);
  if (resp.ok) console.log("✓ PASS");
  if (!resp.ok) process.exitCode = 1;
  return { resp, data };
}

loadEnv();

module.exports = { request };
