
// import EmailSettingsForm from "./EmailSettingsForm.jsx";
// src/components/SettingsPage.jsx
// src/components/SettingsPage.jsx
// src/components/SettingsPage.jsx
// Version corrigée et complète
// - Corrige l'erreur "EmailSettingsForm is not defined" (import manquant)
// - Évite le patch global de localStorage (source fréquente de bugs)
// - Réactivité apiKey : même onglet + multi-onglets (via polling léger)
// - Ping API via getGeneralSettings (client unifié src/api/api.js)
// - Onglets: Email (EmailSettingsForm) / General (SettingsGeneral)
// src/components/SettingsPage.jsx
// Version propre + robuste
// - Import EmailSettingsForm corrigé (évite "is not defined")
// - Pas de patch global localStorage (évite bugs)
// - Réactivité apiKey : multi-onglets (storage) + même onglet (polling léger)
// - Ping API via getGeneralSettings (client unifié src/api/api.js)
// - Onglets: Email (EmailSettingsForm) / General (SettingsGeneral)

// src/components/SettingsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import SettingsGeneral from "./SettingsGeneral";
import EmailSettingsForm from "./EmailSettingsForm";
import { getGeneralSettings } from "../api";

const TABS = [
  { id: "email", label: "Configuration Email" },
  { id: "general", label: "Préférences & Profil" },
];

function ApiKeyBanner({ apiKey }) {
  const hasApiKey = Boolean(apiKey && apiKey.trim());
  if (hasApiKey) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="font-medium">API key manquante</div>
      <div className="mt-1 text-amber-800">
        Ajoute ta clé dans{" "}
        <code className="px-1 rounded bg-amber-100">localStorage</code> :{" "}
        <code className="ml-2 px-1 rounded bg-amber-100">apiKey</code>
      </div>
      <div className="mt-2 text-xs text-amber-700">
        Exemple (DevTools Console):{" "}
        <code className="px-1 rounded bg-amber-100">
          localStorage.setItem("apiKey","TA_CLE")
        </code>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("email");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("apiKey") || "");

  // Cross-tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "apiKey") setApiKey(e.newValue || "");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Same-tab (polling léger)
  useEffect(() => {
    let last = localStorage.getItem("apiKey") || "";
    const t = setInterval(() => {
      const cur = localStorage.getItem("apiKey") || "";
      if (cur !== last) {
        last = cur;
        setApiKey(cur);
      }
    }, 900);

    return () => clearInterval(t);
  }, []);

  const apiKeyTrim = (apiKey || "").trim();
  const hasApiKey = useMemo(() => Boolean(apiKeyTrim), [apiKeyTrim]);

  // Ping backend (optionnel, uniquement si apiKey présente)
  const [pingError, setPingError] = useState("");
  useEffect(() => {
    const controller = new AbortController();

    async function ping() {
      if (!hasApiKey) {
        setPingError("");
        return;
      }

      try {
        setPingError("");
        await getGeneralSettings(apiKeyTrim, { signal: controller.signal });
      } catch (e) {
        if (e?.name !== "AbortError") {
          setPingError(
            e?.message ||
              "Impossible de joindre l’API. Vérifie VITE_API_BASE_URL (front) et le backend."
          );
        }
      }
    }

    ping();
    return () => controller.abort();
  }, [hasApiKey, apiKeyTrim]);

  return (
    <div className="space-y-6">
      <ApiKeyBanner apiKey={apiKeyTrim} />

      {pingError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {pingError}
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={[
              "px-3 py-2 text-sm rounded-t-md",
              activeTab === t.id
                ? "bg-white border border-slate-200 border-b-white -mb-px font-medium"
                : "text-slate-600 hover:text-slate-900",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "email" && <EmailSettingsForm apiKey={apiKeyTrim} />}
        {activeTab === "general" && <SettingsGeneral apiKey={apiKeyTrim} />}
      </div>
    </div>
  );
}

