"use client";

import { useEffect, useMemo, useState } from "react";

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  revoked: boolean;
};

type UsageRow = {
  model: string;
  total_tokens: number;
  cost_usd: number;
  upstream_service: string;
  created_at: string;
};

export function TokenConsole() {
  const [sessionToken, setSessionToken] = useState("");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [newKey, setNewKey] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const activeKeys = useMemo(() => keys.filter((key) => !key.revoked), [keys]);
  const monthlyTokens = useMemo(() => usage.reduce((sum, row) => sum + Number(row.total_tokens ?? 0), 0), [usage]);

  async function api(path: string, init?: RequestInit) {
    const token = sessionToken || window.localStorage.getItem("user_token") || "";
    const resp = await fetch(path, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      }
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data.error?.message ?? "Request failed.");
    return data;
  }

  async function refresh(token = sessionToken) {
    if (!token) return;
    setLoading(true);
    setStatus("");
    try {
      const [keyData, balanceData, usageData] = await Promise.all([
        api("/api/user/api-keys"),
        api("/api/user/balance"),
        api("/api/user/usage")
      ]);
      setKeys(keyData.api_keys ?? []);
      setBalance(Number(balanceData.balance ?? 0));
      setUsage(usageData.usage ?? []);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load console data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = window.localStorage.getItem("user_token") ?? "";
    setSessionToken(token);
    if (!token) return;

    async function loadInitialData() {
      setLoading(true);
      setStatus("");
      try {
        const request = async (path: string) => {
          const resp = await fetch(path, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });
          const data = await resp.json().catch(() => ({}));
          if (!resp.ok) throw new Error(data.error?.message ?? "Request failed.");
          return data;
        };
        const [keyData, balanceData, usageData] = await Promise.all([
          request("/api/user/api-keys"),
          request("/api/user/balance"),
          request("/api/user/usage")
        ]);
        setKeys(keyData.api_keys ?? []);
        setBalance(Number(balanceData.balance ?? 0));
        setUsage(usageData.usage ?? []);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Unable to load console data.");
      } finally {
        setLoading(false);
      }
    }

    void loadInitialData();
  }, []);

  async function saveSessionToken() {
    window.localStorage.setItem("user_token", sessionToken.trim());
    await refresh(sessionToken.trim());
  }

  async function createKey() {
    setLoading(true);
    setStatus("");
    setNewKey("");
    try {
      const data = await api("/api/user/api-keys", {
        method: "POST",
        body: JSON.stringify({ name: "GPTX API key" })
      });
      setNewKey(data.secret_key);
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to create key.");
    } finally {
      setLoading(false);
    }
  }

  async function revokeKey(id: string) {
    setLoading(true);
    setStatus("");
    try {
      await api("/api/user/api-keys", {
        method: "DELETE",
        body: JSON.stringify({ id })
      });
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to revoke key.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-line bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">API Tokens</h1>
            <p className="mt-1 text-sm text-slate-600">Create, copy, and revoke keys for the GPTX API gateway.</p>
          </div>
          <button
            type="button"
            onClick={createKey}
            disabled={loading || !sessionToken}
            className="rounded bg-cobalt px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Create token
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Balance" value={balance === null ? "--" : `${balance.toLocaleString()} tokens`} />
        <Metric label="Active keys" value={String(activeKeys.length)} />
        <Metric label="Recent usage" value={`${monthlyTokens.toLocaleString()} tokens`} />
      </section>

      {!sessionToken ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-base font-semibold text-amber-900">Session token required</h2>
          <p className="mt-2 text-sm text-amber-800">
            Sign in, then paste your session token here once. The console stores it locally in this browser.
          </p>
          <div className="mt-4 flex gap-2">
            <input
              value={sessionToken}
              onChange={(event) => setSessionToken(event.target.value)}
              placeholder="Paste user session token"
              className="min-w-0 flex-1 rounded border border-amber-200 px-3 py-2 text-sm"
            />
            <button onClick={saveSessionToken} className="rounded bg-amber-600 px-4 py-2 text-sm font-semibold text-white">
              Save
            </button>
          </div>
        </section>
      ) : null}

      {newKey ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-base font-semibold text-emerald-900">New token created</h2>
          <p className="mt-1 text-sm text-emerald-800">Copy it now. It will not be shown again.</p>
          <code className="mt-3 block overflow-auto rounded bg-white p-3 text-sm text-emerald-950">{newKey}</code>
        </section>
      ) : null}

      {status ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{status}</div> : null}

      <section className="rounded-lg border border-line bg-white">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold">Token list</h2>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Prefix</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {keys.length ? (
                keys.map((key) => (
                  <tr key={key.id} className="border-t border-line">
                    <td className="px-5 py-3 font-medium">{key.name}</td>
                    <td className="px-5 py-3 font-mono text-xs">{key.prefix}...</td>
                    <td className="px-5 py-3 text-slate-600">{new Date(key.created_at).toLocaleString()}</td>
                    <td className="px-5 py-3">{key.revoked ? "Revoked" : "Active"}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => revokeKey(key.id)}
                        disabled={key.revoked || loading}
                        className="rounded border border-line px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    No API tokens yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
