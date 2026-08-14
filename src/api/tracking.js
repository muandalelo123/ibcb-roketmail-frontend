import { request, loadToken, loadApiKey } from "./api";

function authHeaders({ token, apiKey } = {}) {
  const t = token || loadToken();
  const k = apiKey || loadApiKey();

  return {
    token: t || undefined,
    apiKey: k || undefined,
  };
}

export async function createCampaignLink(
  campaignId,
  { originalUrl, label },
  { token, apiKey, signal } = {}
) {
  if (campaignId == null) {
    throw new Error("campaignId manquant.");
  }

  const params = new URLSearchParams();
  params.set("original_url", originalUrl);

  if (label && label.trim()) {
    params.set("label", label.trim());
  }

  return request(
    `/campaigns/${encodeURIComponent(String(campaignId))}/links?${params.toString()}`,
    {
      method: "POST",
      ...authHeaders({ token, apiKey }),
      signal,
    }
  );
}

export async function addLinkVariant(
  linkId,
  { url, weight = 100, isActive = true },
  { token, apiKey, signal } = {}
) {
  if (linkId == null) {
    throw new Error("linkId manquant.");
  }

  return request(
    `/links/${encodeURIComponent(String(linkId))}/variants`,
    {
      method: "POST",
      ...authHeaders({ token, apiKey }),
      body: {
        url,
        weight: Number(weight),
        is_active: Boolean(isActive),
      },
      signal,
    }
  );
}

export async function getCampaignClicks(
  campaignId,
  { token, apiKey, signal } = {}
) {
  if (campaignId == null) {
    throw new Error("campaignId manquant.");
  }

  return request(
    `/campaigns/${encodeURIComponent(String(campaignId))}/clicks`,
    {
      method: "GET",
      ...authHeaders({ token, apiKey }),
      signal,
    }
  );
}

