
// src/api/funnels.js

import { request, loadToken, loadApiKey } from "./api";

function authHeaders({ token, apiKey } = {}) {
  const t = token || loadToken();
  const k = apiKey || loadApiKey();

  return {
    token: t || undefined,
    apiKey: k || undefined,
  };
}

export async function getFunnels(
  { token, apiKey, signal } = {}
) {
  return request("/funnels", {
    method: "GET",
    ...authHeaders({ token, apiKey }),
    signal,
  });
}

export async function getFunnel(
  funnelId,
  { token, apiKey, signal } = {}
) {
  if (funnelId == null) {
    throw new Error("funnelId manquant.");
  }

  return request(
    `/funnels/${encodeURIComponent(String(funnelId))}`,
    {
      method: "GET",
      ...authHeaders({ token, apiKey }),
      signal,
    }
  );
}

export async function createFunnel(
  payload,
  { token, apiKey, signal } = {}
) {
  return request("/funnels", {
    method: "POST",
    ...authHeaders({ token, apiKey }),
    body: payload,
    signal,
  });
}

export async function updateFunnel(
  funnelId,
  payload,
  { token, apiKey, signal } = {}
) {
  if (funnelId == null) {
    throw new Error("funnelId manquant.");
  }

  return request(
    `/funnels/${encodeURIComponent(String(funnelId))}`,
    {
      method: "PUT",
      ...authHeaders({ token, apiKey }),
      body: payload,
      signal,
    }
  );
}

export async function getFunnelSteps(
  funnelId,
  { token, apiKey, signal } = {}
) {
  if (funnelId == null) {
    throw new Error("funnelId manquant.");
  }

  return request(
    `/funnels/${encodeURIComponent(String(funnelId))}/steps`,
    {
      method: "GET",
      ...authHeaders({ token, apiKey }),
      signal,
    }
  );
}

export async function createFunnelStep(
  funnelId,
  payload,
  { token, apiKey, signal } = {}
) {
  if (funnelId == null) {
    throw new Error("funnelId manquant.");
  }

  return request(
    `/funnels/${encodeURIComponent(String(funnelId))}/steps`,
    {
      method: "POST",
      ...authHeaders({ token, apiKey }),
      body: payload,
      signal,
    }
  );
}

export async function deleteFunnelStep(
  funnelId,
  stepId,
  { token, apiKey, signal } = {}
) {
  if (funnelId == null || stepId == null) {
    throw new Error("funnelId ou stepId manquant.");
  }

  return request(
    `/funnels/${encodeURIComponent(String(funnelId))}/steps/${encodeURIComponent(
      String(stepId)
    )}`,
    {
      method: "DELETE",
      ...authHeaders({ token, apiKey }),
      signal,
    }
  );
}

export async function getFunnelRuns(
  funnelId,
  { token, apiKey, signal } = {}
) {
  if (funnelId == null) {
    throw new Error("funnelId manquant.");
  }

  return request(
    `/funnels/${encodeURIComponent(String(funnelId))}/runs`,
    {
      method: "GET",
      ...authHeaders({ token, apiKey }),
      signal,
    }
  );
}

export async function getFunnelRun(
  runId,
  { token, apiKey, signal } = {}
) {
  if (runId == null) {
    throw new Error("runId manquant.");
  }

  return request(
    `/funnels/runs/${encodeURIComponent(String(runId))}`,
    {
      method: "GET",
      ...authHeaders({ token, apiKey }),
      signal,
    }
  );
}

export async function getFunnelRunSteps(
  runId,
  { token, apiKey, signal } = {}
) {
  if (runId == null) {
    throw new Error("runId manquant.");
  }

  return request(
    `/funnels/runs/${encodeURIComponent(String(runId))}/steps`,
    {
      method: "GET",
      ...authHeaders({ token, apiKey }),
      signal,
    }
  );
}


