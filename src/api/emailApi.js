// src/api/emailApi.js

// src/api/emailApi.js

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Helper générique pour appeler l'API FastAPI
 */
async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data.detail || JSON.stringify(data);
    } catch {
      detail = res.statusText;
    }
    throw new Error(`HTTP ${res.status} – ${detail}`);
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

/**
 * Sauvegarde un brouillon de campagne
 * → POST /campaigns/drafts
 */
export function saveDraft(payload) {
  return request("/campaigns/drafts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Envoi d'un email de test
 * → POST /campaigns/send-test
 */
export function sendTestEmail(payload) {
  return request("/campaigns/send-test", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Envoi immédiat d'une campagne à tous les contacts
 * → POST /campaigns/send-now
 */
export function sendCampaignNow(payload) {
  return request("/campaigns/send-now", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Planification d’une campagne
 * → POST /campaigns/schedule
 */
export function scheduleCampaign(payload) {
  return request("/campaigns/schedule", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


