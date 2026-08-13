// src/api/campaigns.js
// Version corrigée + alignée avec ton client unifié (src/api/api.js)
// - Pas d'axios (évite 2 clients HTTP différents)
// - Utilise request() (gestion erreurs FastAPI, JSON/texte/vide, AbortController)
// - Support Bearer token (recommandé) + optionnel x-api-key si certains endpoints l'exigent
// - BASE URL: VITE_API_URL (comme api.js) via request()

import { request, loadToken, loadApiKey } from "./api";


/**
 * Helpers
 */
function authHeaders({ token, apiKey } = {}) {
  const t = token || loadToken();
  const k = apiKey || loadApiKey();

  return {
    token: t || undefined,
    apiKey: k || undefined,
  };
}

/**
 * POST /campaigns/create
 */
export async function createCampaign(
  { subject, html, from_code },
  { token, apiKey, signal } = {}
) {
  return request("/campaigns/create", {
    method: "POST",
    ...authHeaders({ token, apiKey }),
    body: { subject, html, from_code },
    signal,
  });
}

/**
 * POST /send-to-all/{campaignId}
 */
export async function sendToAll(
  campaignId,
  segmentCode = "internal_test",
  { token, apiKey, signal } = {}
) {
  if (campaignId == null) throw new Error("campaignId manquant.");

  const segment = encodeURIComponent(
    String(segmentCode || "internal_test").trim()
  );

  return request(
    `/send-to-all/${encodeURIComponent(String(campaignId))}?segment_code=${segment}`,
    {
      method: "POST",
      ...authHeaders({ token, apiKey }),
      signal,
    }
  );
}

/**
 * POST /queue/process/{campaignId}
 */
export async function enqueueCampaignJobs(campaignId, { token, apiKey, signal } = {}) {
  if (campaignId == null) throw new Error("campaignId manquant.");
  return request(`/queue/process/${encodeURIComponent(String(campaignId))}`, {
    method: "POST",
    ...authHeaders({ token, apiKey }),
    signal,
  });
}

/**
 * GET /campaigns
 */
export async function getCampaigns({ token, apiKey, signal } = {}) {
  return request("/campaigns", {
    method: "GET",
    ...authHeaders({ token, apiKey }),
    signal,
  });
}


/**
 * GET /campaigns/status/{campaignId}
 */
export async function getCampaignStatus(campaignId, { token, apiKey, signal } = {}) {
  if (campaignId == null) throw new Error("campaignId manquant.");
  return request(`/campaigns/status/${encodeURIComponent(String(campaignId))}`, {
    method: "GET",
    ...authHeaders({ token, apiKey }),
    signal,
  });
}
