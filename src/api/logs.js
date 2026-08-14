
// src/api/logs.js

import { request, loadToken, loadApiKey } from "./api";

function authHeaders({ token, apiKey } = {}) {
  const t = token || loadToken();
  const k = apiKey || loadApiKey();

  return {
    token: t || undefined,
    apiKey: k || undefined,
  };
}

/**
 * GET /logs?limit=...
 */
export async function getLogs(
  limit = 200,
  { token, apiKey, signal } = {}
) {
  const safeLimit = Math.max(1, Number(limit) || 200);

  return request(`/logs?limit=${encodeURIComponent(String(safeLimit))}`, {
    method: "GET",
    ...authHeaders({ token, apiKey }),
    signal,
  });
}



