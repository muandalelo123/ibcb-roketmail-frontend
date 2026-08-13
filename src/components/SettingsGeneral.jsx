// src/components/SettingsGeneral.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getGeneralSettings, updateGeneralSettings } from "../api";

function normalizeFromApi(data) {
  return {
    display_name: data?.display_name ?? "",
    language: data?.language ?? "fr",
    timezone: data?.timezone ?? "Europe/Paris",
    theme: data?.theme ?? "light",
    notify_on_errors: Boolean(data?.notify_on_errors),
    notify_on_quota: Boolean(data?.notify_on_quota),
    notify_on_login: Boolean(data?.notify_on_login),
  };
}

function normalizeToApi(form) {
  return {
    display_name: form.display_name?.trim() || null,
    language: form.language || "fr",
    timezone: form.timezone?.trim() || "Europe/Paris",
    theme: form.theme || "light",
    notify_on_errors: Boolean(form.notify_on_errors),
    notify_on_quota: Boolean(form.notify_on_quota),
    notify_on_login: Boolean(form.notify_on_login),
  };
}

export default function SettingsGeneral({ apiKey }) {
  const apiKeyTrim = (apiKey || "").trim();
  const hasApiKey = useMemo(() => Boolean(apiKeyTrim), [apiKeyTrim]);

  const [form, setForm] = useState(() =>
    normalizeFromApi({
      display_name: "",
      language: "fr",
      timezone: "Europe/Paris",
      theme: "light",
      notify_on_errors: true,
      notify_on_quota: true,
      notify_on_login: true,
    })
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3500);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      if (!hasApiKey) {
        setLoading(false);
        setError("API key manquante. Ajoute ta clé dans localStorage: apiKey");
        return;
      }

      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const data = await getGeneralSettings(apiKeyTrim, { signal: controller.signal });
        if (cancelled) return;

        setForm(normalizeFromApi(data));
      } catch (e) {
        if (!cancelled && e?.name !== "AbortError") {
          setError(e?.message || "Impossible de charger les paramètres.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [apiKeyTrim, hasApiKey]);

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSave(e) {
    e.preventDefault();
    if (!hasApiKey) return;

    setError("");
    setSuccess("");

    const payload = normalizeToApi(form);

    try {
      setSaving(true);

      if (import.meta?.env?.DEV) {
        // eslint-disable-next-line no-console
        console.log("[SettingsGeneral] PUT payload:", payload);
      }

      const saved = await updateGeneralSettings(apiKeyTrim, payload);
      setForm(normalizeFromApi(saved));
      setSuccess("Enregistré.");
    } catch (e2) {
      setError(e2?.message || "Erreur lors de l’enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">General</h3>
          <p className="text-xs text-slate-500">
            Profil, langue, fuseau horaire, thème et notifications.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-600">Loading…</div>
      ) : (
        <form onSubmit={onSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom affiché</label>
            <input
              className="w-full border rounded-xl px-3 py-2"
              value={form.display_name}
              onChange={(e) => setField("display_name", e.target.value)}
              placeholder="Claude / iBCB Admin"
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Langue</label>
              <select
                className="w-full border rounded-xl px-3 py-2"
                value={form.language}
                onChange={(e) => setField("language", e.target.value)}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Timezone</label>
              <input
                className="w-full border rounded-xl px-3 py-2"
                value={form.timezone}
                onChange={(e) => setField("timezone", e.target.value)}
                placeholder="Africa/Kinshasa"
                autoComplete="off"
              />
              <p className="text-xs text-slate-500">
                Exemple: Africa/Kinshasa, Africa/Lubumbashi, Europe/Paris
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Thème</label>
              <select
                className="w-full border rounded-xl px-3 py-2"
                value={form.theme}
                onChange={(e) => setField("theme", e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Notifications</div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form.notify_on_errors)}
                onChange={(e) => setField("notify_on_errors", e.target.checked)}
              />
              Notifier en cas d’erreurs d’envoi
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form.notify_on_quota)}
                onChange={(e) => setField("notify_on_quota", e.target.checked)}
              />
              Notifier quand le quota approche
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form.notify_on_login)}
                onChange={(e) => setField("notify_on_login", e.target.checked)}
              />
              Notifier lors des connexions
            </label>
          </div>

          {(error || success) && (
            <div className="pt-1">
              {error && (
                <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="mt-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
                  {success}
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className={[
                "px-4 py-2 rounded-xl text-white text-sm",
                "bg-slate-900 hover:bg-slate-800",
                !hasApiKey || saving ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
              disabled={!hasApiKey || saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}


