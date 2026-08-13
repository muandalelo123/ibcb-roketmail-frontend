

// src/components/SettingsGeneralPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getGeneralSettings, updateGeneralSettings } from "../api";
import { useAbortableEffect } from "../hooks/useAbortableEffect";

/**
 * SettingsGeneralPage.jsx (General settings)
 * Version complète + corrigée :
 * - Utilise api.js (pas de fetch direct)
 * - Supporte x-api-key (prop ou localStorage apiKey)
 * - AbortController via useAbortableEffect (évite setState après unmount)
 * - Normalisation du payload (nulls + booleans)
 * - Messages error/success + auto-clear success
 *
 * Attendu côté backend:
 *   GET /settings/general
 *   PUT /settings/general
 *   Header: x-api-key (si ton endpoint est protégé comme /settings/smtp)
 */

function normalizeFromApi(data) {
  return {
    display_name: data?.display_name ?? "iBCB RoketMail Admin",
    language: data?.language ?? "fr",
    timezone: data?.timezone ?? "Europe/Paris",
    theme: data?.theme ?? "light",
    notify_on_errors: typeof data?.notify_on_errors === "boolean" ? data.notify_on_errors : true,
    notify_on_quota: typeof data?.notify_on_quota === "boolean" ? data.notify_on_quota : true,
    notify_on_login: typeof data?.notify_on_login === "boolean" ? data.notify_on_login : true,
  };
}

function normalizeToApi(form) {
  const toNull = (v) => (v === "" || v === undefined ? null : v);

  return {
    display_name: toNull(form.display_name),
    language: form.language || "fr",
    timezone: form.timezone || "Europe/Paris",
    theme: form.theme || "light",
    notify_on_errors: Boolean(form.notify_on_errors),
    notify_on_quota: Boolean(form.notify_on_quota),
    notify_on_login: Boolean(form.notify_on_login),
  };
}

export default function SettingsGeneralPage({ apiKey: apiKeyProp }) {
  const [apiKeyState] = useState(() => localStorage.getItem("apiKey") || "");
  const apiKey = apiKeyProp ?? apiKeyState;

  const hasApiKey = useMemo(() => Boolean(apiKey && apiKey.trim()), [apiKey]);

  const [form, setForm] = useState(() => normalizeFromApi({}));

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Auto-clear success
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3500);
    return () => clearTimeout(t);
  }, [success]);

  // Load initial general settings (abortable)
  useAbortableEffect(({ signal, isActive }) => {
    (async () => {
      // Si ton endpoint /settings/general n'est PAS protégé, tu peux enlever ce bloc.
      if (!hasApiKey) {
        if (!isActive()) return;
        setLoading(false);
        setError("API key manquante. Ajoute ta clé dans localStorage: apiKey");
        return;
      }

      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const data = await getGeneralSettings(apiKey, { signal });

        if (!isActive()) return;
        setForm(normalizeFromApi(data || {}));
      } catch (e) {
        if (e?.name !== "AbortError" && isActive()) {
          setError(e?.message || "Impossible de charger les paramètres généraux.");
        }
      } finally {
        if (isActive()) setLoading(false);
      }
    })();
  }, [apiKey, hasApiKey]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!hasApiKey || saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = normalizeToApi(form);

      if (import.meta?.env?.DEV) {
        // eslint-disable-next-line no-console
        console.log("[SettingsGeneralPage] PUT payload:", payload);
      }

      const saved = await updateGeneralSettings(apiKey, payload);

      setForm((prev) => ({
        ...prev,
        ...normalizeFromApi(saved || {}),
      }));

      setSuccess("General settings successfully saved.");
    } catch (err) {
      setError(err?.message || "Failed to save general settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-semibold tracking-tight">General Settings</h1>
        <p className="text-xs text-slate-500">
          Profile, language, time zone and notification preferences for iBCB RoketMail.
        </p>
      </header>

      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 text-xs">
        {loading ? (
          <div className="mb-3 text-[11px] text-slate-500">Loading general settings…</div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Profil */}
            <div>
              <label className="block mb-1 text-[11px] text-slate-600">Display name</label>
              <input
                type="text"
                name="display_name"
                value={form.display_name || ""}
                onChange={handleChange}
                className="w-full px-2 py-1.5 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="Claude / iBCB Admin"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Shown in the console header or account menu.
              </p>
            </div>

            {/* Langue + fuseau horaire */}
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-[11px] text-slate-600">Language</label>
                <select
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-slate-500"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-[11px] text-slate-600">Time zone</label>
                <input
                  type="text"
                  name="timezone"
                  value={form.timezone}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-slate-500"
                  placeholder="Europe/Paris"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Used for scheduling and logs timestamps.
                </p>
              </div>
            </div>

            {/* Thème */}
            <div>
              <label className="block mb-1 text-[11px] text-slate-600">Theme</label>
              <select
                name="theme"
                value={form.theme}
                onChange={handleChange}
                className="w-full px-2 py-1.5 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            {/* Notifications */}
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-slate-700">Notifications</div>

              <label className="flex items-center gap-2 text-[11px] text-slate-700">
                <input
                  type="checkbox"
                  name="notify_on_errors"
                  checked={Boolean(form.notify_on_errors)}
                  onChange={handleChange}
                />
                Notify on sending errors
              </label>

              <label className="flex items-center gap-2 text-[11px] text-slate-700">
                <input
                  type="checkbox"
                  name="notify_on_quota"
                  checked={Boolean(form.notify_on_quota)}
                  onChange={handleChange}
                />
                Notify when quota is almost reached
              </label>

              <label className="flex items-center gap-2 text-[11px] text-slate-700">
                <input
                  type="checkbox"
                  name="notify_on_login"
                  checked={Boolean(form.notify_on_login)}
                  onChange={handleChange}
                />
                Notify on new login or session
              </label>
            </div>

            {/* Messages */}
            {(error || success) && (
              <div className="mt-2">
                {error && (
                  <div className="mb-1 px-2 py-1.5 rounded-md bg-red-50 border border-red-200 text-[11px] text-red-700">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mb-1 px-2 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700">
                    {success}
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={!hasApiKey || saving}
                className={[
                  "px-3 py-1.5 rounded-md text-xs font-medium border",
                  "border-transparent bg-blue-600 text-white hover:bg-blue-700",
                  !hasApiKey || saving ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
              >
                {saving ? "Saving general settings…" : "Save general settings"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}



