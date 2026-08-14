// src/api/contacts.js
// src/api/contacts.js

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
 * GET /contacts
 */
export async function getContactsList(
  { token, apiKey, signal } = {}
) {
  return request("/contacts", {
    method: "GET",
    ...authHeaders({ token, apiKey }),
    signal,
  });
}

/**
 * GET /contacts/{contactId}/submissions
 */
export async function getContactSubmissions(
  contactId,
  { token, apiKey, signal } = {}
) {
  if (contactId == null) {
    throw new Error("contactId manquant.");
  }

  return request(
    `/contacts/${encodeURIComponent(String(contactId))}/submissions`,
    {
      method: "GET",
      ...authHeaders({ token, apiKey }),
      signal,
    }
  );
}

/**
 * POST /contacts/import
 *
 * Cas spécial : multipart/form-data.
 * On utilise fetch directement pour laisser le navigateur
 * générer automatiquement le Content-Type + boundary.
 */
export async function importContacts(
  file,
  { token, apiKey, signal } = {}
) {
  if (!file) {
    throw new Error("CSV file manquant.");
  }

  const t = token || loadToken();
  const k = apiKey || loadApiKey();

  const baseUrl = (
    import.meta?.env?.VITE_API_BASE_URL ||
    import.meta?.env?.VITE_API_URL ||
    "http://127.0.0.1:8000"
  ).replace(/\/+$/, "");

  const formData = new FormData();
  formData.append("file", file);

  const headers = {
    Accept: "application/json",
  };

  if (t) headers.Authorization = `Bearer ${t}`;
  if (k) headers["x-api-key"] = k;

  const response = await fetch(`${baseUrl}/contacts/import`, {
    method: "POST",
    headers,
    body: formData,
    signal,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      `Erreur API ${response.status} ${response.statusText}`;

    throw new Error(
      typeof message === "string" ? message : JSON.stringify(message)
    );
  }

  return data;
}

/**
 * GET /contacts/export
 *
 * Retourne un Blob CSV.
 */
export async function exportContactsCsv(
  { token, apiKey, signal } = {}
) {
  const t = token || loadToken();
  const k = apiKey || loadApiKey();

  const baseUrl = (
    import.meta?.env?.VITE_API_BASE_URL ||
    import.meta?.env?.VITE_API_URL ||
    "http://127.0.0.1:8000"
  ).replace(/\/+$/, "");

  const headers = {};

  if (t) headers.Authorization = `Bearer ${t}`;
  if (k) headers["x-api-key"] = k;

  const response = await fetch(`${baseUrl}/contacts/export`, {
    method: "GET",
    headers,
    signal,
  });

  if (!response.ok) {
    let message = `Erreur API ${response.status} ${response.statusText}`;

    try {
      const data = await response.json();
      if (data?.detail) {
        message =
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail);
      }
    } catch {
      // garder le fallback
    }

    throw new Error(message);
  }

  const blob = await response.blob();

  const disposition = response.headers.get("content-disposition") || "";

  const match = disposition.match(/filename="?([^"]+)"?/i);

  const filename = match?.[1] || "contacts_export.csv";

  return {
    blob,
    filename,
  };
}

