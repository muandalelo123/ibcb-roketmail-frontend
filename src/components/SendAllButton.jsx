import React, { useEffect, useRef, useState } from "react";
import { request, loadToken, loadApiKey } from "../api/api";

const SEGMENTS = [
  { code: "internal_test", label: "Internal Test" },
  { code: "baby_care", label: "Baby Care" },
  {
    code: "clickfunnels_online_business",
    label: "ClickFunnels - Online Business",
  },
];


const BATCH_STORAGE_KEY = "rocketmail_pending_audience_v1";

function loadSavedBatch() {
  try {
    const raw = localStorage.getItem(BATCH_STORAGE_KEY);
    if (!raw) return null;

    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object" || !saved.campaign_id) {
      throw new Error("Invalid saved batch");
    }

    // Une requête interrompue par un rechargement reste à vérifier.
    if (saved.phase === "preparing" || saved.phase === "launching" || saved.phase === "scheduling") {
      return {
        ...saved,
        phase: "review",
        note: "Interrupted request. Check the batch before proceeding.",
      };
    }
    return saved;
  } catch {
    return {
      phase: "review",
      note: "Unable to read the saved batch. Do not launch another batch yet.",
    };
  }
}

function saveBatch(batch) {
  localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(batch));
}

async function postAudience(campaignId, action, body) {
  return request(
    `/campaigns/${encodeURIComponent(String(campaignId))}/${action}`,
    {
      method: "POST",
      token: loadToken() || undefined,
      apiKey: loadApiKey() || undefined,
      body,
    }
  );
}

export default function SendAllButton({ campaignId }) {
  const [segmentCode, setSegmentCode] = useState("internal_test");
  const [sourceBatch, setSourceBatch] = useState("");
  const [limit, setLimit] = useState("10");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [batch, setBatch] = useState(loadSavedBatch);
  const [launchBusy, setLaunchBusy] = useState(false);
  const [scheduleLocal, setScheduleLocal] = useState("");
  const browserTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const launchLock = useRef(false);
  const activeRequest = useRef(null);

  function invalidatePreview() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setLoading(false);
    setPreview(null);
    setError("");
  }

  useEffect(() => {
    invalidatePreview();
    return () => {
      activeRequest.current?.abort();
      activeRequest.current = null;
    };
  }, [campaignId]);

  const selectionKey = JSON.stringify([
    String(campaignId ?? ""),
    segmentCode,
    sourceBatch.trim(),
    Number(limit),
  ]);

  const visiblePreview =
    preview?.selectionKey === selectionKey ? preview.data : null;

  async function handlePreview(event) {
    event.preventDefault();
    if (activeRequest.current) return;

    const count = Number(limit);

    if (!campaignId) {
      setError("Select a campaign first.");
      return;
    }

    if (!Number.isInteger(count) || count < 1 || count > 2000) {
      setError("Enter a whole number between 1 and 2000.");
      return;
    }

    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setError("");
    setPreview(null);

    try {
      const params = new URLSearchParams({
        segment_code: segmentCode,
        source_batch: sourceBatch.trim(),
        limit: String(count),
      });

      const data = await request(
        `/campaigns/${encodeURIComponent(String(campaignId))}/audience-preview?${params}`,
        {
          method: "GET",
          token: loadToken() || undefined,
          apiKey: loadApiKey() || undefined,
          signal: controller.signal,
        }
      );

      if (activeRequest.current !== controller) return;

      if (
        !data ||
        !Array.isArray(data.recipients) ||
        String(data.campaign_id) !== String(campaignId) ||
        data.selected_contacts !== data.recipients.length ||
        data.recipients.length > count
      ) {
        throw new Error("Invalid audience preview response.");
      }

      setPreview({ selectionKey, data });
    } catch (err) {
      if (activeRequest.current !== controller) return;
      setError(err?.message || "Unable to preview recipients.");
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  }


  async function handlePrepare() {
    if (
      launchLock.current ||
      batch ||
      loading ||
      !visiblePreview ||
      visiblePreview.recipients.length === 0
    ) return;

    const snapshot = visiblePreview;
    const intent = {
      phase: "preparing",
      campaign_id: snapshot.campaign_id,
      subject: snapshot.subject,
      segment_code: snapshot.segment_code,
      source_batch: snapshot.source_batch || "",
      limit: snapshot.limit,
      recipients: snapshot.recipients,
      created_at: new Date().toISOString(),
    };

    launchLock.current = true;
    setLaunchBusy(true);
    setError("");

    let requestStarted = false;
    let prepared = null;

    try {
      // Enregistrer l'intention avant toute création côté serveur.
      saveBatch(intent);
      setBatch(intent);
      requestStarted = true;

      const result = await postAudience(
        intent.campaign_id,
        "prepare-audience",
        {
          segment_code: intent.segment_code,
          source_batch: intent.source_batch,
          limit: intent.limit,
          contact_ids: intent.recipients.map((item) => item.contact_id),
        }
      );

      prepared = {
        ...intent,
        phase: "prepared",
        preparation: result,
      };
      setBatch(prepared);

      const expectedIds = intent.recipients.map((item) => item.contact_id);
      if (
        String(result?.campaign_id) !== String(intent.campaign_id) ||
        !Array.isArray(result?.job_ids) ||
        result.job_ids.length !== expectedIds.length ||
        !result.job_ids.every((id) => Number.isInteger(id) && id > 0) ||
        new Set(result.job_ids).size !== result.job_ids.length ||
        JSON.stringify(result.contact_ids) !== JSON.stringify(expectedIds) ||
        result.jobs_created !== expectedIds.length ||
        result.enqueued !== 0
      ) {
        throw new Error("Unexpected preparation response. Check the batch.");
      }

      saveBatch(prepared);
      setPreview(null);
    } catch (err) {
      if (requestStarted) {
        const review = {
          ...(prepared || intent),
          phase: "review",
          note:
            "Preparation could not be confirmed safely. " +
            "Do not prepare another batch until this one is checked.",
        };
        setBatch(review);
        try { saveBatch(review); } catch {}
      }
      setError(err?.message || "Unable to prepare the batch.");
    } finally {
      launchLock.current = false;
      setLaunchBusy(false);
    }
  }

  async function handleLaunchPrepared() {
    if (
      launchLock.current ||
      batch?.phase !== "prepared" ||
      String(batch.campaign_id) !== String(campaignId)
    ) return;

    const jobIds = batch.preparation?.job_ids;
    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      setError("Missing prepared job IDs.");
      return;
    }

    const confirmed = window.confirm(
      `Launch campaign #${batch.campaign_id} — ${batch.subject}\n\n` +
      `${jobIds.length} prepared recipients.\n` +
      `Segment: ${batch.segment_code}\n` +
      `Batch: ${batch.source_batch || "All batches"}\n\n` +
      "Emails may be sent immediately if a worker is running."
    );
    if (!confirmed) return;

    launchLock.current = true;
    setLaunchBusy(true);
    setError("");

    const launching = { ...batch, phase: "launching" };

    try {
      saveBatch(launching);
      setBatch(launching);

      const result = await postAudience(
        batch.campaign_id,
        "enqueue-selected",
        { job_ids: jobIds }
      );

      const acceptedStatuses = new Set([
        "queued", "started", "deferred", "scheduled", "finished",
      ]);

      const hasResponseShape =
        String(result?.campaign_id) === String(batch.campaign_id) &&
        result.requested === jobIds.length &&
        typeof result.interrupted === "boolean" &&
        Array.isArray(result.enqueued_job_ids) &&
        Array.isArray(result.existing_rq_jobs) &&
        Array.isArray(result.skipped_jobs) &&
        Array.isArray(result.uncertain_job_ids) &&
        Array.isArray(result.unattempted_job_ids);

      const reportedIds = hasResponseShape
        ? [
            ...result.enqueued_job_ids,
            ...result.existing_rq_jobs.map((item) => item.job_id),
            ...result.skipped_jobs.map((item) => item.job_id),
            ...result.uncertain_job_ids,
            ...result.unattempted_job_ids,
          ]
        : [];

      const allAccountedFor =
        reportedIds.length === jobIds.length &&
        new Set(reportedIds).size === jobIds.length &&
        reportedIds.every((id) => jobIds.includes(id));

      const needsReview =
        !hasResponseShape ||
        !allAccountedFor ||
        result.interrupted ||
        result.uncertain_job_ids.length > 0 ||
        result.unattempted_job_ids.length > 0 ||
        result.existing_rq_jobs.some(
          (item) => !acceptedStatuses.has(item.rq_status)
        ) ||
        result.skipped_jobs.some(
          (item) => !["SENT", "SendJobState.SENT"].includes(item.state)
        );

      const receipt = {
        ...batch,
        phase: needsReview ? "review" : "submitted",
        queue_result: result,
        note: needsReview
          ? "Check the queue result before any further attempt."
          : "Queue request completed. Check Jobs monitor for sending results.",
      };

      setBatch(receipt);
      saveBatch(receipt);
    } catch (err) {
      // Un timeout ne signifie pas que le serveur n'a rien exécuté.
      const review = {
        ...launching,
        phase: "review",
        note:
          "Queue response uncertain. Keep these job IDs and check their " +
          "status before retrying.",
      };
      setBatch(review);
      try { saveBatch(review); } catch {}
      setError(err?.message || "Unable to confirm queue operation.");
    } finally {
      launchLock.current = false;
      setLaunchBusy(false);
    }
  }


  async function handleSchedulePrepared() {
    if (
      launchLock.current ||
      batch?.phase !== "prepared" ||
      String(batch.campaign_id) !== String(campaignId)
    ) return;

    setError("");

    const jobIds = batch.preparation?.job_ids;
    if (
      !Array.isArray(jobIds) ||
      jobIds.length === 0 ||
      !jobIds.every((id) => Number.isInteger(id) && id > 0) ||
      new Set(jobIds).size !== jobIds.length
    ) {
      setError("Invalid prepared job IDs.");
      return;
    }

    const sendAt = new Date(scheduleLocal);
    if (!scheduleLocal || !Number.isFinite(sendAt.getTime())) {
      setError("Choose a valid sending date and time.");
      return;
    }

    // Refuser une heure inexistante lors du passage à l'heure d'été.
    const pad = (value) => String(value).padStart(2, "0");
    const roundTrip =
      `${sendAt.getFullYear()}-${pad(sendAt.getMonth() + 1)}-` +
      `${pad(sendAt.getDate())}T${pad(sendAt.getHours())}:` +
      `${pad(sendAt.getMinutes())}`;

    if (roundTrip !== scheduleLocal) {
      setError("This local time does not exist. Choose another time.");
      return;
    }

    if (sendAt.getTime() <= Date.now() + 3 * 60 * 1000) {
      setError("Choose a time more than three minutes ahead.");
      return;
    }

    const displayedTime = sendAt.toLocaleString(undefined, {
      dateStyle: "full",
      timeStyle: "long",
    });
    const sendAtUtc = sendAt.toISOString();

    if (!window.confirm(
      `Schedule campaign #${batch.campaign_id} — ${batch.subject}\n\n` +
      `${jobIds.length} prepared recipients.\n` +
      `Sending time: ${displayedTime}\n` +
      `Timezone: ${browserTimezone}\n` +
      `UTC: ${sendAtUtc}\n\n` +
      "This schedules real emails. A worker with scheduler must be running."
    )) return;

    launchLock.current = true;
    setLaunchBusy(true);

    const scheduling = {
      ...batch,
      phase: "scheduling",
      send_at_utc: sendAtUtc,
      display_timezone: browserTimezone,
    };
    let requestStarted = false;

    try {
      saveBatch(scheduling);
      setBatch(scheduling);
      requestStarted = true;

      const result = await postAudience(
        batch.campaign_id,
        "schedule-selected",
        { job_ids: jobIds, send_at: sendAtUtc }
      );

      const hasShape =
        String(result?.campaign_id) === String(batch.campaign_id) &&
        result.requested === jobIds.length &&
        typeof result.interrupted === "boolean" &&
        Array.isArray(result.scheduled_job_ids) &&
        Array.isArray(result.uncertain_job_ids) &&
        Array.isArray(result.unattempted_job_ids) &&
        result.scheduled === result.scheduled_job_ids.length &&
        new Date(result.send_at_utc).getTime() === sendAt.getTime();

      const reported = hasShape ? [
        ...result.scheduled_job_ids,
        ...result.uncertain_job_ids,
        ...result.unattempted_job_ids,
      ] : [];

      const complete =
        hasShape &&
        !result.interrupted &&
        result.uncertain_job_ids.length === 0 &&
        result.unattempted_job_ids.length === 0 &&
        reported.length === jobIds.length &&
        new Set(reported).size === jobIds.length &&
        reported.every((id) => jobIds.includes(id));

      const receipt = {
        ...scheduling,
        phase: complete ? "submitted" : "review",
        schedule_result: result,
        note: complete
          ? `Scheduled for ${displayedTime} (${browserTimezone}). ` +
            "Emails have not been confirmed sent. " +
            "A worker with scheduler is required."
          : "Scheduling incomplete. Check the reported jobs before retrying.",
      };

      setBatch(receipt);
      saveBatch(receipt);
    } catch (err) {
      if (requestStarted) {
        const review = {
          ...scheduling,
          phase: "review",
          note:
            "Scheduling could not be confirmed. Keep these job IDs " +
            "and check their status before retrying.",
        };
        setBatch(review);
        try { saveBatch(review); } catch {}
      }
      setError(err?.message || "Unable to schedule the batch.");
    } finally {
      launchLock.current = false;
      setLaunchBusy(false);
    }
  }

  function closeSubmittedBatch() {
    if (batch?.phase !== "submitted" || launchBusy) return;
    try {
      localStorage.removeItem(BATCH_STORAGE_KEY);
      setBatch(null);
      invalidatePreview();
    } catch {
      setError("Unable to clear the saved batch.");
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Campaign audience</h2>
        <p className="text-xs text-slate-500">
          Choose an audience and review the recipients before sending.
        </p>
      </div>

      <form onSubmit={handlePreview} className="space-y-4">
        <fieldset
          disabled={launchBusy || Boolean(batch)}
          className="space-y-4"
        >
        <div className="space-y-1">
          <label htmlFor="audience-segment" className="block text-sm font-medium">
            Audience segment
          </label>
          <select
            id="audience-segment"
            className="w-full border rounded-lg px-3 py-2"
            value={segmentCode}
            onChange={(event) => {
              invalidatePreview();
              setSegmentCode(event.target.value);
              setSourceBatch(
                event.target.value === "baby_care"
                  ? "babycare_import_97"
                  : ""
              );
            }}
          >
            {SEGMENTS.map((segment) => (
              <option key={segment.code} value={segment.code}>
                {segment.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="audience-batch" className="block text-sm font-medium">
            Import batch
          </label>
          <input
            id="audience-batch"
            className="w-full border rounded-lg px-3 py-2"
            value={sourceBatch}
            placeholder="All batches in this segment"
            onChange={(event) => {
              invalidatePreview();
              setSourceBatch(event.target.value);
            }}
          />
          <p className="text-xs text-slate-500">
            Baby Care batch: babycare_import_97. Leave empty to include
            all batches in the selected segment.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="audience-limit" className="block text-sm font-medium">
            Maximum recipients
          </label>
          <input
            id="audience-limit"
            type="number"
            min="1"
            max="2000"
            step="1"
            required
            className="w-full border rounded-lg px-3 py-2"
            value={limit}
            onChange={(event) => {
              invalidatePreview();
              setLimit(event.target.value);
            }}
          />
          <p className="text-xs text-slate-500">
            Eligible contacts are selected by ascending contact ID.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !campaignId}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm disabled:opacity-50"
        >
          {loading ? "Loading preview..." : "Preview recipients"}
        </button>
        </fieldset>
      </form>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      {visiblePreview && (
        <div className="space-y-3" aria-live="polite">
          <p className="font-medium">
            #{visiblePreview.campaign_id} — {visiblePreview.subject}
          </p>

          <p className="text-sm">
            Matched: {visiblePreview.matched_contacts}
            {" · "}Eligible: {visiblePreview.eligible_contacts}
            {" · "}Selected: {visiblePreview.selected_contacts}
          </p>

          <p className="text-xs text-slate-600">
            Excluded — missing email: {visiblePreview.excluded?.missing_email ?? 0}
            {" · "}Unsubscribed: {visiblePreview.excluded?.unsubscribed ?? 0}
            {" · "}Existing job for this campaign: {visiblePreview.excluded?.existing_job ?? 0}
            {" · "}Duplicate email: {visiblePreview.excluded?.duplicate_email ?? 0}
          </p>

          {visiblePreview.recipients.length > 0 ? (
            <div className="max-h-80 overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr className="text-left">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePreview.recipients.map((contact) => (
                    <tr key={contact.contact_id} className="border-t">
                      <td className="px-3 py-2">{contact.contact_id}</td>
                      <td className="px-3 py-2">{contact.first_name || "—"}</td>
                      <td className="px-3 py-2">{contact.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm">No eligible recipients for this selection.</p>
          )}

          <p className="text-xs text-slate-500">
            Preview only. No sending jobs created and no emails sent.
          </p>
        </div>
      )}

      <div className="border-t pt-3 space-y-3">
        {!batch && (
          <>
            <button
              type="button"
              onClick={handlePrepare}
              disabled={
                launchBusy || loading ||
                !visiblePreview?.recipients?.length
              }
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm disabled:opacity-40"
            >
              Prepare selected recipients
            </button>
            <p className="text-xs text-slate-500">
              Creates the selected sending jobs. Does not queue or send them.
            </p>
          </>
        )}

        {batch && (
          <div className="space-y-3 rounded-lg border p-3">
            <p className="font-medium">
              Saved batch — campaign #{batch.campaign_id || "?"}
            </p>
            <p className="text-sm">{batch.subject}</p>
            <p className="text-sm">
              Status: {batch.phase}
              {" · "}Recipients: {batch.recipients?.length ?? "?"}
            </p>

            {batch.note && (
              <p className="text-sm text-amber-800">{batch.note}</p>
            )}

            {batch.preparation?.job_ids && (
              <p className="text-xs break-words">
                Job IDs: {batch.preparation.job_ids.join(", ")}
              </p>
            )}

            {batch.phase === "prepared" && (
              <>
                {String(batch.campaign_id) !== String(campaignId) && (
                  <p className="text-sm text-amber-800">
                    Select campaign #{batch.campaign_id} above to launch
                    this prepared batch.
                  </p>
                )}
                <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                  <label
                    htmlFor="batch-send-at"
                    className="block text-sm font-medium"
                  >
                    Schedule sending
                  </label>
                  <p className="text-xs text-slate-600">
                    Timezone: {browserTimezone}
                  </p>
                  <input
                    id="batch-send-at"
                    type="datetime-local"
                    step="60"
                    value={scheduleLocal}
                    onChange={(event) => setScheduleLocal(event.target.value)}
                    disabled={launchBusy}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={handleSchedulePrepared}
                    disabled={
                      launchBusy || !scheduleLocal ||
                      String(batch.campaign_id) !== String(campaignId)
                    }
                    className="px-4 py-2 rounded-xl bg-blue-700 text-white text-sm disabled:opacity-40"
                  >
                    Schedule prepared batch
                  </button>
                  <p className="text-xs text-slate-500">
                    Choose a time at least four minutes ahead.
                    Your Mac must remain awake with the worker running.
                  </p>
                </div>

                <p className="text-sm font-medium">Or send now</p>
                <button
                  type="button"
                  onClick={handleLaunchPrepared}
                  disabled={
                    launchBusy ||
                    String(batch.campaign_id) !== String(campaignId)
                  }
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-sm disabled:opacity-40"
                >
                  Launch prepared batch
                </button>
                <p className="text-xs text-slate-500">
                  This action can send real emails.
                </p>
              </>
            )}

            {batch.schedule_result && (
              <details>
                <summary className="cursor-pointer text-sm">
                  Scheduling result
                </summary>
                <pre className="text-xs whitespace-pre-wrap break-all mt-2">
                  {JSON.stringify(batch.schedule_result, null, 2)}
                </pre>
              </details>
            )}

            {batch.queue_result && (
              <details>
                <summary className="cursor-pointer text-sm">
                  Queue result
                </summary>
                <pre className="text-xs whitespace-pre-wrap break-all mt-2">
                  {JSON.stringify(batch.queue_result, null, 2)}
                </pre>
              </details>
            )}

            {batch.phase === "submitted" && (
              <button
                type="button"
                onClick={closeSubmittedBatch}
                disabled={launchBusy}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                Close receipt and prepare another selection
              </button>
            )}
          </div>
        )}

        {launchBusy && (
          <p role="status" className="text-sm">
            Processing… Please keep this page open.
          </p>
        )}
      </div>
    </div>
  );
}
