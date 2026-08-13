// src/components/CampaignCreate.jsx
// src/components/CampaignCreate.jsx

import React, { useEffect, useMemo, useState } from "react";
import EmailEditor from "./EmailEditor";
import { createCampaign } from "../api/campaigns";

/**
 * CampaignCreate.jsx (version propre + robuste)
 * - Validation minimale (subject / from_code)
 * - Messages success/error séparés + auto-clear success
 * - Normalisation d'erreur compatible axios (err.response.data.detail)
 * - Désactive le bouton pendant la requête
 * - Garde la compatibilité EmailEditor (value/onChange)
 */

const DEFAULT_HTML = "<p>Hello {{first_name}},</p>";
const ALLOWED_FROM_CODES = ["smtp", "gmail", "sendgrid", "mailgun"];

function normalizeError(err) {
  if (!err) return "Erreur inconnue.";

  // Axios: err.response.data (souvent {detail: ...})
  const axiosDetail =
    err?.response?.data?.detail ??
    err?.response?.data?.message ??
    err?.response?.data?.error;

  if (typeof axiosDetail === "string" && axiosDetail.trim()) return axiosDetail;

  // Si detail est un tableau (FastAPI validation errors)
  if (Array.isArray(axiosDetail) && axiosDetail.length > 0) {
    const first = axiosDetail[0];
    if (first?.msg) return first.msg;
    try {
      return JSON.stringify(axiosDetail);
    } catch {
      /* ignore */
    }
  }

  if (typeof err === "string") return err;
  if (err?.message) return err.message;

  try {
    return JSON.stringify(err);
  } catch {
    return "Erreur lors de la création de la campagne.";
  }
}

export default function CampaignCreate({ onCreated }) {
  const [subject, setSubject] = useState("");
  const [fromCode, setFromCode] = useState("smtp");
  const [html, setHtml] = useState(DEFAULT_HTML);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Auto-clear success
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3500);
    return () => clearTimeout(t);
  }, [success]);

  const fromCodeTrim = useMemo(() => (fromCode || "").trim().toLowerCase(), [fromCode]);

  const fromCodeIsKnown = useMemo(
    () => Boolean(fromCodeTrim) && ALLOWED_FROM_CODES.includes(fromCodeTrim),
    [fromCodeTrim]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    setError("");
    setSuccess("");

    const subjectTrim = (subject || "").trim();

    if (!subjectTrim) {
      setError("Le sujet est obligatoire.");
      return;
    }
    if (!fromCodeTrim) {
      setError("Le sender code est obligatoire (ex: smtp).");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        subject: subjectTrim,
        html: typeof html === "string" ? html : "",
        from_code: fromCodeTrim,
      };

      const campaign = await createCampaign(payload);

      setSuccess(`Campaign created${campaign?.id != null ? ` (id=${campaign.id})` : ""}.`);
      setSubject("");
      setHtml(DEFAULT_HTML);

      if (typeof onCreated === "function") onCreated(campaign);
    } catch (err) {
      setError(normalizeError(err));
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Create Campaign</h2>
        <p className="text-xs text-slate-500">
          Create a campaign with subject + sender code + HTML content.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject */}
        <div className="space-y-1">
          <label className="block text-sm font-medium">Subject</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Your campaign subject"
            required
            autoComplete="off"
          />
        </div>

        {/* Sender code */}
        <div className="space-y-1">
          <label className="block text-sm font-medium">Sender code</label>

          {/* Input libre (garde ton comportement actuel) */}
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={fromCode}
            onChange={(e) => setFromCode(e.target.value)}
            placeholder="smtp / gmail / sendgrid / mailgun"
            required
            autoComplete="off"
          />

          {/* Option: si tu veux verrouiller, remplace l'input par ce select:
              <select className="w-full border rounded-lg px-3 py-2" value={fromCodeTrim} onChange={(e)=>setFromCode(e.target.value)}>
                {ALLOWED_FROM_CODES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
           */}

          {!fromCodeIsKnown && (
            <p className="text-xs text-amber-700">
              Valeur inhabituelle. Exemples: {ALLOWED_FROM_CODES.join(", ")}.
            </p>
          )}
        </div>

        {/* Editor */}
        <EmailEditor value={html} onChange={setHtml} />

        {/* Alerts */}
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

        {/* Action */}
        <div className="flex justify-end">
          <button
            type="submit"
            className={[
              "px-4 py-2 rounded-xl text-white text-sm",
              "bg-slate-900 hover:bg-slate-800",
              loading ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Campaign"}
          </button>
        </div>
      </form>
    </div>
  );
}


