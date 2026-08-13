

// src/utils/apiKeyStorage.js

export const API_KEY_STORAGE_KEY = "rocketmail_apiKey"; // nom libre

export function setApiKey(fullKey) {
  if (!fullKey) return;
  localStorage.setItem(API_KEY_STORAGE_KEY, fullKey);
}

export function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

export function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

/**
 * Retourne le prefix de la clé stockée, ex: "rk_7fa3c9b4"
 * si fullKey = "rk_7fa3c9b4.e2d4f9a3c2..."
 */
export function getStoredApiKeyPrefix() {
  const fullKey = getApiKey();
  if (!fullKey) return null;
  const parts = fullKey.split(".");
  if (parts.length < 2) return null;
  return parts[0];
}


