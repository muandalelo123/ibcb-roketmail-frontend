import React, { useState } from "react";
import { sendToAll, enqueueCampaignJobs } from "../api/campaigns";

const SEGMENTS = [
  {
    code: "internal_test",
    label: "Internal Test",
  },
  {
    code: "baby_care",
    label: "Baby Care",
  },
  {
    code: "clickfunnels_online_business",
    label: "ClickFunnels - Online Business",
  },
];

export default function SendAllButton({ campaignId }) {
  const [segmentCode, setSegmentCode] = useState("internal_test");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSendAll() {
    if (!campaignId) {
      setMessage("Select a campaign first");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res1 = await sendToAll(campaignId, segmentCode);
      const res2 = await enqueueCampaignJobs(campaignId);

      setMessage(
        `Segment ${res1.segment_code}: created ${res1.jobs_created} jobs, enqueued ${res2.enqueued} jobs`
      );
    } catch (err) {
      console.error(err);
      setMessage(err?.message || "Error launching campaign");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Launch Campaign</h2>
        <p className="text-xs text-slate-500">
          Select the audience segment before creating sending jobs.
        </p>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">
          Audience segment
        </label>

        <select
          className="w-full border rounded-lg px-3 py-2"
          value={segmentCode}
          onChange={(e) => setSegmentCode(e.target.value)}
          disabled={loading}
        >
          {SEGMENTS.map((segment) => (
            <option key={segment.code} value={segment.code}>
              {segment.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={handleSendAll}
        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={loading || !campaignId}
      >
        {loading ? "Sending..." : "Launch Campaign"}
      </button>

      {message && (
        <p className="text-sm text-slate-700">
          {message}
        </p>
      )}
    </div>
  );
}


