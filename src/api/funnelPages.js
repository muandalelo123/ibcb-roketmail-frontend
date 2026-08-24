// frontend/src/api/funnelPages.js

import { request, loadToken, loadApiKey } from "./api";

function authHeaders({ token, apiKey } = {}) {
  const t = token || loadToken();
  const k = apiKey || loadApiKey();

  return {
    token: t || undefined,
    apiKey: k || undefined,
  };
}


// ============================================================
// FUNNEL PAGE CONFIGURATIONS
// ============================================================

export async function getFunnelPages(
  { token, apiKey, signal } = {}
) {
  return request("/funnel-pages", {
    method: "GET",
    ...authHeaders({ token, apiKey }),
    signal,
  });
}


export async function getFunnelPage(
  funnelId,
  { token, apiKey, signal } = {}
) {
  if (!funnelId) {
    throw new Error("funnelId manquant.");
  }

  return request(
    `/funnel-pages/${encodeURIComponent(String(funnelId))}`,
    {
      method: "GET",
      ...authHeaders({ token, apiKey }),
      signal,
    }
  );
}


export async function createFunnelPage(
  payload,
  { token, apiKey, signal } = {}
) {
  if (!payload) {
    throw new Error("Configuration du funnel manquante.");
  }

  return request("/funnel-pages", {
    method: "POST",
    ...authHeaders({ token, apiKey }),
    body: payload,
    signal,
  });
}


export async function updateFunnelPage(
  funnelId,
  payload,
  { token, apiKey, signal } = {}
) {
  if (!funnelId) {
    throw new Error("funnelId manquant.");
  }

  if (!payload) {
    throw new Error("Configuration du funnel manquante.");
  }

  return request(
    `/funnel-pages/${encodeURIComponent(String(funnelId))}`,
    {
      method: "PUT",
      ...authHeaders({ token, apiKey }),
      body: payload,
      signal,
    }
  );
}


// ============================================================
// GENERATION
// ============================================================

export async function generateFunnelPage(
  funnelId,
  { token, apiKey, signal } = {}
) {
  if (!funnelId) {
    throw new Error("funnelId manquant.");
  }

  return request(
    `/funnel-pages/${encodeURIComponent(String(funnelId))}/generate`,
    {
      method: "POST",
      ...authHeaders({ token, apiKey }),
      signal,
    }
  );
}


// ============================================================
// PUBLISH
// ============================================================

export async function publishFunnelPage(
  funnelId,
  { token, apiKey, signal } = {}
) {
  if (!funnelId) {
    throw new Error("funnelId manquant.");
  }

  return request(
    `/funnel-pages/${encodeURIComponent(String(funnelId))}/publish`,
    {
      method: "POST",
      ...authHeaders({ token, apiKey }),
      signal,
    }
  );
}


// ============================================================
// PREVIEW
// ============================================================

export async function getLandingPreview(
  funnelId,
  { token, apiKey, signal } = {}
) {
  if (!funnelId) {
    throw new Error("funnelId manquant.");
  }

  return request(
    `/funnel-pages/${encodeURIComponent(
      String(funnelId)
    )}/preview/landing`,
    {
      method: "GET",
      ...authHeaders({ token, apiKey }),
      signal,
      headers: {
        Accept: "text/html",
      },
    }
  );
}


export async function getThankYouPreview(
  funnelId,
  { token, apiKey, signal } = {}
) {
  if (!funnelId) {
    throw new Error("funnelId manquant.");
  }

  return request(
    `/funnel-pages/${encodeURIComponent(
      String(funnelId)
    )}/preview/thank-you`,
    {
      method: "GET",
      ...authHeaders({ token, apiKey }),
      signal,
      headers: {
        Accept: "text/html",
      },
    }
  );
}





