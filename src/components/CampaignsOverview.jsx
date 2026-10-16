// src/components/CampaignsOverview.jsx
import React, { useEffect, useRef, useState } from "react";
import EmailEditor from "./EmailEditor";
import {
  getCampaignStatus,
  getCampaignDetail,
  updateCampaign,
  duplicateCampaign,
} from "../api/campaigns";

const PROVIDERS = ["gmail", "smtp", "sendgrid", "ses"];
const BUTTON =
  "px-3 py-2 rounded-lg border text-sm bg-white hover:bg-slate-50 disabled:opacity-50";
const INPUT = "w-full border rounded-lg px-3 py-2";

export default function CampaignsOverview({
  campaigns = [],
  onChanged,
}) {
  const [statuses, setStatuses] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState(null);
  const [sourceMode, setSourceMode] = useState(false);
  const actionLock = useRef(false);
  const editorRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setStatuses({});

    async function loadStatuses() {
      const results = await Promise.all(
        campaigns.map(async (campaign) => {
          try {
            const status = await getCampaignStatus(campaign.id);
            return [campaign.id, status];
          } catch {
            return [campaign.id, { unavailable: true }];
          }
        })
      );

      if (active) {
        setStatuses(Object.fromEntries(results));
        setLoading(false);
      }
    }

    loadStatuses();
    return () => { active = false; };
  }, [campaigns, refreshKey]);

  useEffect(() => {
    if (draft) {
      editorRef.current?.scrollIntoView({ block: "start" });
    }
  }, [draft?.id]);

  function beginAction() {
    if (actionLock.current) return false;
    actionLock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    return true;
  }

  function endAction() {
    actionLock.current = false;
    setBusy(false);
  }

  function openDraft(campaign) {
    setSourceMode(false);
    setDraft({
      id: campaign.id,
      subject: campaign.subject || "",
      html: campaign.html || "",
      from_code: campaign.from_code || "",
    });
  }

  async function edit(campaignId) {
    if (!beginAction()) return;
    try {
      const campaign = await getCampaignDetail(campaignId);
      openDraft(campaign);
    } catch (err) {
      setError(err?.message || "Unable to load campaign.");
    } finally {
      endAction();
    }
  }

  async function duplicate(campaignId) {
    if (!beginAction()) return;
    try {
      const campaign = await duplicateCampaign(campaignId);
      onChanged?.(campaign);
      openDraft(campaign);
      setMessage(`Copy #${campaign.id} created. You can now edit it.`);
    } catch (err) {
      setError(err?.message || "Unable to duplicate campaign.");
    } finally {
      endAction();
    }
  }

  async function save(event) {
    event.preventDefault();
    if (!draft || !beginAction()) return;

    try {
      const subject = draft.subject.trim();
      if (!subject) throw new Error("Subject is required.");
      if (!PROVIDERS.includes(draft.from_code)) {
        throw new Error("Select a valid preferred provider.");
      }

      const document = new DOMParser().parseFromString(
        draft.html, "text/html"
      );
      const text = (document.body.textContent || "")
        .replace(/\u00a0/g, " ")
        .trim();

      if (!text && !document.querySelector("img")) {
        throw new Error("Email content is required.");
      }

      const campaign = await updateCampaign(draft.id, {
        subject,
        html: draft.html,
        from_code: draft.from_code,
      });

      onChanged?.(campaign);
      setDraft(null);
      setMessage(`Campaign #${campaign.id} saved. No email sent.`);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(err?.message || "Unable to save campaign.");
    } finally {
      endAction();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Campaign overview</h2>
          <p className="text-xs text-slate-500">
            Edit unused campaigns or duplicate an existing campaign.
          </p>
        </div>
        <button
          type="button"
          className={BUTTON}
          disabled={loading || busy}
          onClick={() => setRefreshKey((value) => value + 1)}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <p role="alert" className="p-3 rounded-lg bg-red-50 text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="p-3 rounded-lg bg-emerald-50 text-emerald-800">
          {message}
        </p>
      )}

      {draft && (
        <section
          ref={editorRef}
          aria-labelledby="campaign-editor-title"
          className="border rounded-xl p-4 bg-slate-50 space-y-3"
        >
          <h3 id="campaign-editor-title" className="font-semibold">
            Edit campaign #{draft.id}
          </h3>
          <p className="text-sm text-slate-600">
            Saving changes does not send emails. Campaigns with jobs,
            history, or a funnel association cannot be edited.
          </p>

          <form onSubmit={save}>
            <fieldset disabled={busy} className="space-y-4">
              <label className="block text-sm space-y-1">
                <span>Subject</span>
                <input
                  required
                  maxLength={255}
                  className={INPUT}
                  value={draft.subject}
                  onChange={(e) => setDraft({
                    ...draft, subject: e.target.value,
                  })}
                />
              </label>

              <label className="block text-sm space-y-1">
                <span>Preferred provider</span>
                <select
                  required
                  className={INPUT}
                  value={draft.from_code}
                  onChange={(e) => setDraft({
                    ...draft, from_code: e.target.value,
                  })}
                >
                  <option value="" disabled>Select a provider</option>
                  {!PROVIDERS.includes(draft.from_code) && draft.from_code && (
                    <option value={draft.from_code} disabled>
                      {draft.from_code} — select a supported provider
                    </option>
                  )}
                  {PROVIDERS.map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  className={BUTTON}
                  aria-pressed={!sourceMode}
                  onClick={() => setSourceMode(false)}
                >
                  Visual
                </button>
                <button
                  type="button"
                  className={BUTTON}
                  aria-pressed={sourceMode}
                  onClick={() => setSourceMode(true)}
                >
                  HTML
                </button>
              </div>

              <div
                className={busy ? "pointer-events-none opacity-60" : ""}
                aria-busy={busy}
              >
                {sourceMode ? (
                  <label className="block text-sm space-y-1">
                    <span>HTML source</span>
                    <textarea
                      rows={14}
                      className={`${INPUT} font-mono`}
                      value={draft.html}
                      onChange={(e) => setDraft({
                        ...draft, html: e.target.value,
                      })}
                    />
                  </label>
                ) : (
                  <EmailEditor
                    value={draft.html}
                    onChange={(html) => {
                      if (!actionLock.current) {
                        setDraft((current) => current
                          ? { ...current, html } : current);
                      }
                    }}
                  />
                )}
              </div>

              <div className="flex gap-2">
                <button type="submit" className={BUTTON}>
                  {busy ? "Saving..." : "Save changes"}
                </button>
                <button
                  type="button"
                  className={BUTTON}
                  onClick={() => {
                    setDraft(null);
                    setError("");
                    setMessage("");
                  }}
                >
                  Close without saving
                </button>
              </div>
            </fieldset>
          </form>
        </section>
      )}

      {!campaigns.length ? (
        <p className="text-sm text-slate-500">No campaigns available.</p>
      ) : (
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                {["ID", "Subject", "Actions", "Provider", "Created",
                  "Status", "Total", "Sent", "Pending", "Errors"].map((label) => (
                  <th key={label} className="py-2 pr-3">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => {
                const status = statuses[campaign.id];
                const editable =
                  status && !status.unavailable && status.total_jobs === 0;
                const locked = busy || Boolean(draft);

                return (
                  <tr key={campaign.id} className="border-b">
                    <td className="py-2 pr-3">#{campaign.id}</td>
                    <td className="py-2 pr-3">{campaign.subject}</td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={BUTTON}
                          disabled={locked || !editable}
                          title="Editing also requires no history or funnel association."
                          onClick={() => edit(campaign.id)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={BUTTON}
                          disabled={locked}
                          onClick={() => duplicate(campaign.id)}
                        >
                          Duplicate
                        </button>
                      </div>
                    </td>
                    <td className="py-2 pr-3">{campaign.from_code || "-"}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {campaign.created_at
                        ? new Date(campaign.created_at).toLocaleString() : "-"}
                    </td>
                    <td className="py-2 pr-3">
                      {status?.unavailable ? "Unavailable" : status?.status || "…"}
                    </td>
                    {["total_jobs", "sent_jobs", "pending_jobs", "error_jobs"]
                      .map((field) => (
                        <td key={field} className="py-2 pr-3">
                          {status?.[field] ?? "—"}
                        </td>
                      ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
