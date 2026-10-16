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


         {/* Audience targeting — pending implementation */}
        <section
          aria-labelledby="audience-title"
          className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4"
        >
          <div>
            <h3
              id="audience-title"
              className="text-base font-semibold text-slate-900"
            >
              Audience & recipients
            </h3>

            <span className="inline-block mt-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              À connecter au backend
            </span>

            <p
              id="audience-status"
              className="mt-2 text-sm text-slate-600"
            >
              Le ciblage sera disponible ici. Ces options sont
              désactivées et ne sont pas enregistrées avec la campagne.
            </p>
          </div>

          <fieldset
            disabled
            aria-describedby="audience-status"
            className="space-y-4"
          >
            <legend className="sr-only">
              Future recipient selection options
            </legend>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="audience-segment"
                  className="block text-sm font-medium"
                >
                  Segment / group
                </label>
                <select
                  id="audience-segment"
                  defaultValue=""
                  className="w-full border rounded-lg px-3 py-2 bg-white disabled:cursor-not-allowed"
                >
                  <option value="">
                    Segments à charger
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="audience-batch"
                  className="block text-sm font-medium"
                >
                  Import batch — optional
                </label>
                <select
                  id="audience-batch"
                  defaultValue=""
                  className="w-full border rounded-lg px-3 py-2 bg-white disabled:cursor-not-allowed"
                >
                  <option value="">
                    Lots à charger
                  </option>
                </select>
                <p className="text-xs text-slate-500">
                  Exemple de lot à proposer : babycare_import_97.
                </p>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="audience-limit"
                  className="block text-sm font-medium"
                >
                  Maximum recipients
                </label>
                <select
                  id="audience-limit"
                  defaultValue="10"
                  className="w-full border rounded-lg px-3 py-2 bg-white disabled:cursor-not-allowed"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="custom">Custom number</option>
                  <option value="all">All eligible contacts</option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="audience-custom-limit"
                  className="block text-sm font-medium"
                >
                  Custom maximum
                </label>
                <input
                  id="audience-custom-limit"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 25"
                  className="w-full border rounded-lg px-3 py-2 bg-white disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label
                  htmlFor="audience-order"
                  className="block text-sm font-medium"
                >
                  Selection order
                </label>
                <select
                  id="audience-order"
                  defaultValue="oldest_signup"
                  className="w-full border rounded-lg px-3 py-2 bg-white disabled:cursor-not-allowed"
                >
                  <option value="oldest_signup">
                    Oldest signup first
                  </option>
                  <option value="newest_signup">
                    Newest signup first
                  </option>
                </select>
                <p className="text-xs text-slate-500">
                  Utiliser la date réelle d’inscription au formulaire.
                  Sa récupération reste à connecter.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">
                Exclusions prévues
              </p>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked />
                Contacts désabonnés
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked />
                Contacts ayant déjà reçu ce message de suivi
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked />
                Contacts dont ce message est en attente ou en cours
              </label>
            </div>

            <div className="rounded-lg border bg-white p-3 space-y-3">
              <p className="text-sm text-slate-600">
                Admissibles : non calculé · Sélectionnés : non calculé
              </p>

              <button
                type="button"
                className="rounded-lg border px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
              >
                Preview recipients — unavailable
              </button>
            </div>
          </fieldset>
        </section>




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




