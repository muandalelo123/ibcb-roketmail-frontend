// src/components/CampaignCreate.jsx
// src/components/CampaignCreate.jsx

// src/components/CampaignCreate.jsx

import React, { useEffect, useMemo, useState } from "react";
import EmailEditor from "./EmailEditor";
import { createCampaign } from "../api/campaigns";

/**
 * CampaignCreate.jsx
 *
 * - Création d'une campagne
 * - Sélection du provider préféré
 * - Affichage de l'ordre de fallback automatique
 * - Validation minimale
 * - Gestion success/error
 * - Compatible avec le backend actuel:
 *   POST /campaigns/create
 *   payload: { subject, html, from_code }
 */

const DEFAULT_HTML = "<p>Hello {{first_name}},</p>";

const ALLOWED_FROM_CODES = [
  "gmail",
  "ses",
  "sendgrid",
  "smtp",
];

const PROVIDER_LABELS = {
  gmail: "Gmail / Google Workspace",
  ses: "Amazon SES",
  sendgrid: "SendGrid",
  smtp: "Custom SMTP",
};

const PROVIDER_FALLBACKS = {
  gmail: ["gmail", "sendgrid", "ses"],
  smtp: ["smtp", "sendgrid", "ses"],
  sendgrid: ["sendgrid", "ses", "gmail"],
  ses: ["ses", "sendgrid", "gmail"],
};

function normalizeError(err) {
  if (!err) return "Unknown error.";

  const detail =
    err?.response?.data?.detail ??
    err?.data?.detail ??
    err?.response?.data?.message ??
    err?.response?.data?.error;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];

    if (first?.msg) {
      return first.msg;
    }

    try {
      return JSON.stringify(detail);
    } catch {
      return "Campaign creation failed.";
    }
  }

  if (typeof err === "string") {
    return err;
  }

  if (err?.message) {
    return err.message;
  }

  try {
    return JSON.stringify(err);
  } catch {
    return "Campaign creation failed.";
  }
}

export default function CampaignCreate({ onCreated }) {
  const [subject, setSubject] = useState("");
  const [fromCode, setFromCode] = useState("gmail");
  const [html, setHtml] = useState(DEFAULT_HTML);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [success]);

  const fromCodeTrim = useMemo(
    () => (fromCode || "").trim().toLowerCase(),
    [fromCode]
  );

  const fromCodeIsKnown = useMemo(
    () =>
      Boolean(fromCodeTrim) &&
      ALLOWED_FROM_CODES.includes(fromCodeTrim),
    [fromCodeTrim]
  );

  const fallbackOrder = useMemo(
    () => PROVIDER_FALLBACKS[fromCodeTrim] || [],
    [fromCodeTrim]
  );

  async function handleSubmit(e) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const subjectTrim = (subject || "").trim();

    if (!subjectTrim) {
      setError("Subject is required.");
      return;
    }

    if (!fromCodeTrim || !fromCodeIsKnown) {
      setError("Select a valid preferred provider.");
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

      setSuccess(
        `Campaign created${
          campaign?.id != null ? ` (id=${campaign.id})` : ""
        }.`
      );

      setSubject("");
      setHtml(DEFAULT_HTML);

      if (typeof onCreated === "function") {
        onCreated(campaign);
      }
    } catch (err) {
      console.error(err);
      setError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Create Campaign</h2>

        <p className="text-xs text-slate-500">
          Select the preferred email provider. RoketMail automatically
          uses fallback providers if necessary.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject */}
        <div className="space-y-1">
          <label className="block text-sm font-medium">
            Subject
          </label>

          <input
            className="w-full border rounded-lg px-3 py-2"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Your campaign subject"
            required
            autoComplete="off"
          />
        </div>

        {/* Preferred provider */}
        <div className="space-y-1">
          <label className="block text-sm font-medium">
            Preferred provider
          </label>

          <select
            className="w-full border rounded-lg px-3 py-2"
            value={fromCode}
            onChange={(e) => setFromCode(e.target.value)}
            required
          >
            {ALLOWED_FROM_CODES.map((provider) => (
              <option key={provider} value={provider}>
                {PROVIDER_LABELS[provider]}
              </option>
            ))}
          </select>

          {!fromCodeIsKnown && (
            <p className="text-xs text-amber-700">
              Invalid provider selected.
            </p>
          )}

          <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
            <div className="text-xs font-medium text-slate-700">
              Automatic fallback
            </div>

            <div className="text-xs text-slate-500 mt-1">
              {fallbackOrder.length > 0
                ? fallbackOrder.join(" → ")
                : "No fallback strategy available"}
            </div>
          </div>
        </div>

        {/* Email editor */}
        <EmailEditor
          value={html}
          onChange={setHtml}
        />

        {/* Messages */}
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
            disabled={loading}
            className={[
              "px-4 py-2 rounded-xl text-white text-sm",
              "bg-slate-900 hover:bg-slate-800",
              loading
                ? "opacity-60 cursor-not-allowed"
                : "",
            ].join(" ")}
          >
            {loading ? "Creating..." : "Create Campaign"}
          </button>
        </div>
      </form>
    </div>
  );
}




