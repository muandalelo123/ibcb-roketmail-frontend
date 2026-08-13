// src/components/EmailSettingsForm.jsx
// src/components/EmailSettingsForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getSmtpSettings, updateSmtpSettings } from "../api";
import { useAbortableEffect } from "../hooks/useAbortableEffect";

/**
 * EmailSettingsForm.jsx (SMTP/Email provider settings) — version corrigée & durable
 *
 * Objectifs (anti-régression):
 * - Composant 100% "SMTP settings" (pas de confusion avec le builder campagne)
 * - apiKey uniquement via prop (SettingsPage gère localStorage + réactivité)
 * - AbortController via useAbortableEffect (pas de setState après unmount)
 * - Ne pré-remplit jamais les secrets (smtp_password / sendgrid_api_key / ses_secret_access_key)
 * - Normalise smtp_port en number|null
 * - Messages error/success séparés + auto-clear success
 * - Désactive Save si apiKey manquante ou pendant saving
 * - Reset des secrets au changement de provider
 */

const SUCCESS_CLEAR_MS = 3500;

function normalizeFromApi(data) {
  return {
    provider: data?.provider ?? "gmail",

    smtp_host: data?.smtp_host ?? "smtp.gmail.com",
    smtp_port: data?.smtp_port ?? 587,
    smtp_username: data?.smtp_username ?? "",
    smtp_password: "", // jamais pré-remplir

    use_tls: typeof data?.use_tls === "boolean" ? data.use_tls : true,

    from_name: data?.from_name ?? "iBCB RoketMail",
    from_email: data?.from_email ?? "",

    sendgrid_api_key: "", // jamais pré-remplir

    ses_region: data?.ses_region ?? "",
    ses_access_key_id: data?.ses_access_key_id ?? "",
    ses_secret_access_key: "", // jamais pré-remplir
  };
}

function normalizeToApi(form) {
  const toNull = (v) => (v === "" || v === undefined ? null : v);

  const portRaw = form.smtp_port;
  const port =
    portRaw === "" || portRaw === null || portRaw === undefined ? null : Number(portRaw);

  return {
    provider: form.provider,

    smtp_host: toNull(form.smtp_host),
    smtp_port: Number.isFinite(port) ? port : null,
    smtp_username: toNull(form.smtp_username),

    // on n'envoie un secret que s'il est saisi
    smtp_password: form.smtp_password ? form.smtp_password : null,

    use_tls: Boolean(form.use_tls),

    from_name: toNull(form.from_name),
    from_email: toNull(form.from_email),

    sendgrid_api_key: form.sendgrid_api_key ? form.sendgrid_api_key : null,

    ses_region: toNull(form.ses_region),
    ses_access_key_id: toNull(form.ses_access_key_id),
    ses_secret_access_key: form.ses_secret_access_key ? form.ses_secret_access_key : null,
  };
}

function maskForDevLog(payload) {
  return {
    ...payload,
    smtp_password: payload.smtp_password ? "***" : null,
    sendgrid_api_key: payload.sendgrid_api_key ? "***" : null,
    ses_secret_access_key: payload.ses_secret_access_key ? "***" : null,
  };
}

export default function EmailSettingsForm({ apiKey }) {
  const apiKeyTrim = (apiKey || "").trim();
  const hasApiKey = useMemo(() => Boolean(apiKeyTrim), [apiKeyTrim]);

  const [form, setForm] = useState(() =>
    normalizeFromApi({
      provider: "gmail",
      smtp_host: "smtp.gmail.com",
      smtp_port: 587,
      smtp_username: "",
      use_tls: true,
      from_name: "iBCB RoketMail",
      from_email: "",
    })
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Auto-clear success
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), SUCCESS_CLEAR_MS);
    return () => clearTimeout(t);
  }, [success]);

  // Load current SMTP settings (abortable)
  useAbortableEffect(({ signal, isActive }) => {
    (async () => {
      // reset messages
      if (isActive()) {
        setError("");
        setSuccess("");
      }

      if (!hasApiKey) {
        if (!isActive()) return;
        setLoading(false);
        setError(
          'API key manquante. Ajoute-la côté front: localStorage.setItem("apiKey", "sk_ibcb.xxx.yyy")'
        );
        return;
      }

      try {
        if (isActive()) setLoading(true);

        const data = await getSmtpSettings(apiKeyTrim, { signal });

        if (!isActive()) return;
        setForm(normalizeFromApi(data || {}));
      } catch (e) {
        if (e?.name !== "AbortError" && isActive()) {
          setError(e?.message || "Impossible de charger les settings SMTP.");
        }
      } finally {
        if (isActive()) setLoading(false);
      }
    })();
  }, [apiKeyTrim, hasApiKey]);

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function clearSecrets(next = {}) {
    return {
      ...next,
      smtp_password: "",
      sendgrid_api_key: "",
      ses_secret_access_key: "",
    };
  }

  function onProviderChange(nextProvider) {
    setForm((prev) => {
      const base = clearSecrets({ ...prev, provider: nextProvider });

      // Defaults utiles
      if (nextProvider === "gmail") {
        base.smtp_host = base.smtp_host || "smtp.gmail.com";
        base.smtp_port = base.smtp_port ?? 587;
        base.use_tls = typeof base.use_tls === "boolean" ? base.use_tls : true;
      }
      if (nextProvider === "smtp") {
        base.smtp_port = base.smtp_port ?? 587;
      }

      return base;
    });
  }

  async function onSave(e) {
    e.preventDefault();
    if (!hasApiKey || saving) return;

    setError("");
    setSuccess("");

    try {
      setSaving(true);

      const payload = normalizeToApi(form);

      if (import.meta?.env?.DEV) {
        // eslint-disable-next-line no-console
        console.log("[EmailSettingsForm] PUT /settings/smtp payload:", maskForDevLog(payload));
      }

      const saved = await updateSmtpSettings(apiKeyTrim, payload);

      // Applique la réponse backend mais garde la règle: secrets toujours vides côté UI
      setForm((prev) => {
        const merged = normalizeFromApi(saved || {});
        return {
          ...merged,
          ...clearSecrets({}),
          // préserver ces champs si backend ne les renvoie pas
          ses_region: (saved && saved.ses_region) ?? prev.ses_region,
          ses_access_key_id: (saved && saved.ses_access_key_id) ?? prev.ses_access_key_id,
        };
      });

      setSuccess("Configuration email enregistrée.");
    } catch (e2) {
      setError(e2?.message || "Erreur lors de l’enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  const isSmtpLike = form.provider === "gmail" || form.provider === "smtp";

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Configuration Email (SMTP / Provider)</h3>
        <p className="text-xs text-slate-500">
          Configure le fournisseur d’envoi (Gmail/Workspace, SMTP custom, SendGrid, SES).
        </p>
      </div>

      {!hasApiKey && (
        <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          API key manquante. Mets-la dans le front:
          <div className="mt-2 font-mono text-xs bg-white/60 border rounded-lg px-2 py-1">
            localStorage.setItem("apiKey", "sk_ibcb.&lt;secret&gt;")
          </div>
          <div className="mt-1 text-xs text-amber-800/80">
            (Le backend attend le format <b>prefix.secret</b> avec un point.)
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-600">Loading…</div>
      ) : (
        <form onSubmit={onSave} className="space-y-4">
          {/* Provider */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Fournisseur</label>
            <select
              className="w-full border rounded-xl px-3 py-2"
              value={form.provider}
              onChange={(e) => onProviderChange(e.target.value)}
            >
              <option value="gmail">Gmail / Google Workspace (SMTP)</option>
              <option value="smtp">Serveur SMTP custom</option>
              <option value="sendgrid">SendGrid (API)</option>
              <option value="ses">Amazon SES</option>
            </select>
          </div>

          {/* Host/Port */}
          {isSmtpLike && (
            <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">SMTP host</label>
                <input
                  className="w-full border rounded-xl px-3 py-2"
                  value={form.smtp_host || ""}
                  onChange={(e) => setField("smtp_host", e.target.value)}
                  placeholder="smtp.gmail.com"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">SMTP port</label>
                <input
                  type="number"
                  className="w-full border rounded-xl px-3 py-2"
                  value={form.smtp_port ?? ""}
                  onChange={(e) => setField("smtp_port", e.target.value)}
                  placeholder="587"
                  min="1"
                />
              </div>
            </div>
          )}

          {/* Credentials */}
          {isSmtpLike && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">SMTP username</label>
                <input
                  className="w-full border rounded-xl px-3 py-2"
                  value={form.smtp_username || ""}
                  onChange={(e) => setField("smtp_username", e.target.value)}
                  placeholder="user@example.com"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">SMTP password / App password</label>
                <input
                  type="password"
                  className="w-full border rounded-xl px-3 py-2"
                  value={form.smtp_password || ""}
                  onChange={(e) => setField("smtp_password", e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <p className="text-xs text-slate-500">
                  Le mot de passe n’est jamais affiché; remplis-le seulement si tu veux le changer.
                </p>
              </div>
            </div>
          )}

          {/* TLS */}
          {isSmtpLike && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form.use_tls)}
                onChange={(e) => setField("use_tls", e.target.checked)}
              />
              Utiliser STARTTLS (recommandé)
            </label>
          )}

          {/* SendGrid */}
          {form.provider === "sendgrid" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">SendGrid API key</label>
              <input
                type="password"
                className="w-full border rounded-xl px-3 py-2"
                value={form.sendgrid_api_key || ""}
                onChange={(e) => setField("sendgrid_api_key", e.target.value)}
                placeholder="SG.xxxxx"
                autoComplete="new-password"
              />
              <p className="text-xs text-slate-500">
                La clé n’est jamais pré-remplie; saisis-la uniquement si tu veux la remplacer.
              </p>
            </div>
          )}

          {/* SES */}
          {form.provider === "ses" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SES region</label>
                  <input
                    className="w-full border rounded-xl px-3 py-2"
                    value={form.ses_region || ""}
                    onChange={(e) => setField("ses_region", e.target.value)}
                    placeholder="us-east-1"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">SES access key id</label>
                  <input
                    className="w-full border rounded-xl px-3 py-2"
                    value={form.ses_access_key_id || ""}
                    onChange={(e) => setField("ses_access_key_id", e.target.value)}
                    placeholder="AKIA..."
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">SES secret access key</label>
                <input
                  type="password"
                  className="w-full border rounded-xl px-3 py-2"
                  value={form.ses_secret_access_key || ""}
                  onChange={(e) => setField("ses_secret_access_key", e.target.value)}
                  autoComplete="new-password"
                />
                <p className="text-xs text-slate-500">
                  Le secret n’est jamais pré-rempli; saisis-le uniquement si tu veux le remplacer.
                </p>
              </div>
            </div>
          )}

          {/* From */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">From name</label>
              <input
                className="w-full border rounded-xl px-3 py-2"
                value={form.from_name || ""}
                onChange={(e) => setField("from_name", e.target.value)}
                placeholder="iBCB RoketMail"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">From email</label>
              <input
                type="email"
                className="w-full border rounded-xl px-3 py-2"
                value={form.from_email || ""}
                onChange={(e) => setField("from_email", e.target.value)}
                placeholder="support@ibcb-s.com"
                autoComplete="email"
              />
            </div>
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
              disabled={!hasApiKey || saving}
              className={[
                "px-4 py-2 rounded-xl text-white text-sm",
                "bg-blue-600 hover:bg-blue-700",
                !hasApiKey || saving ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

