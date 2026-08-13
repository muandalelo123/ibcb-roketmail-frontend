

// src/api.js

// src/api.js
// Version complète + propre + corrigée
// - Supporte 2 modes d'auth: Bearer token ET x-api-key
// - BASE URL configurable via VITE_API_URL (fallback 127.0.0.1:8000)
// - Gestion JSON robuste (réponses json / texte / vide)
// - Erreurs normalisées (detail FastAPI / validation errors)
// - AbortController support (signal)
// - Exporte aussi les endpoints "General settings" (corrige updateGeneralSettings not found)

const API_BASE_URL = (import.meta?.env?.VITE_API_URL || "http://127.0.0.1:8000").replace(
  /\/+$/,
  ""
);

function buildUrl(path) {
  if (!path.startsWith("/")) return `${API_BASE_URL}/${path}`;
  return `${API_BASE_URL}${path}`;
}

function isJsonContentType(contentType) {
  return (contentType || "").toLowerCase().includes("application/json");
}

function extractFastApiErrorMessage(data, fallback) {
  // FastAPI: {"detail":"..."} ou {"detail":[{"msg":"..."}]}
  if (!data) return fallback;

  if (typeof data === "string") {
    const t = data.trim();
    return t ? t : fallback;
  }

  if (typeof data === "object") {
    const detail = data.detail;

    if (typeof detail === "string" && detail.trim()) return detail;

    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (first?.msg) return first.msg;
      // parfois: {"detail":[{"loc":[...],"msg":"...","type":"..."}]}
      try {
        return JSON.stringify(detail);
      } catch {
        return fallback;
      }
    }

    try {
      return JSON.stringify(data);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

async function parseResponse(res) {
  const ct = res.headers.get("content-type") || "";
  if (isJsonContentType(ct)) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  try {
    const txt = await res.text();
    return txt === "" ? null : txt;
  } catch {
    return null;
  }
}

export async function request(
  path,
  {
    method = "GET",
    token, // Bearer token
    apiKey, // x-api-key
    body,
    signal,
    headers: extraHeaders,
  } = {}
) {
  const headers = {
    Accept: "application/json",
    ...(extraHeaders || {}),
  };

  // JSON body
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  // Auth headers
  if (token) headers.Authorization = `Bearer ${token}`;
  if (apiKey) headers["x-api-key"] = apiKey;

  let res;
  try {
    res = await fetch(buildUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e) {
    // Network errors, CORS, server down, aborted...
    if (e?.name === "AbortError") throw e;
    const err = new Error("Impossible de contacter l’API (réseau/CORS/serveur).");
    err.cause = e;
    err.status = 0;
    throw err;
  }

  const data = await parseResponse(res);

  if (!res.ok) {
    const fallback = `Erreur API ${res.status} ${res.statusText}`;
    const msg = extractFastApiErrorMessage(data, fallback);

    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/* ---------------------------
   AUTH (login)
   --------------------------- */
// Retour attendu: {access_token, token_type}
export async function login(email, password, { signal } = {}) {
  return request("/auth/login", {
    method: "POST",
    body: { email, password },
    signal,
  });
}

/* ---------------------------
   CONTACTS (Bearer token)
   --------------------------- */
export async function getContacts(token, { signal } = {}) {
  return request("/contacts", { method: "GET", token, signal });
}

/* ---------------------------
   EMAILS (Bearer token)
   --------------------------- */
export async function sendEmailToAll(token, { subject, body }, { signal } = {}) {
  return request("/emails/send-to-all", {
    method: "POST",
    token,
    body: { subject, body },
    signal,
  });
}

/* ---------------------------
   SMTP SETTINGS (x-api-key)
   GET /settings/smtp/
   PUT /settings/smtp/
   --------------------------- */
export async function getSmtpSettings(apiKey, { signal } = {}) {
  return request("/settings/smtp/", { method: "GET", apiKey, signal });
}

export async function updateSmtpSettings(apiKey, payload, { signal } = {}) {
  return request("/settings/smtp/", { method: "PUT", apiKey, body: payload, signal });
}

/* ---------------------------
   GENERAL SETTINGS (x-api-key)
   GET /settings/general
   PUT /settings/general
   --------------------------- */
export async function getGeneralSettings(apiKey, { signal } = {}) {
  return request("/settings/general", { method: "GET", apiKey, signal });
}

export async function updateGeneralSettings(apiKey, payload, { signal } = {}) {
  return request("/settings/general", { method: "PUT", apiKey, body: payload, signal });
}

/* ---------------------------
   (Optionnel) Helpers stockage
   --------------------------- */
const API_KEY_STORAGE_KEY = "rocketmail_apiKey";

export function saveApiKey(apiKey) {
  if (apiKey && String(apiKey).trim()) {
    localStorage.setItem(API_KEY_STORAGE_KEY, String(apiKey).trim());
  }
}

export function loadApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || "";
}

export function saveToken(token) {
  if (token && String(token).trim()) localStorage.setItem("token", String(token).trim());
}

export function loadToken() {
  return localStorage.getItem("token") || "";
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}


