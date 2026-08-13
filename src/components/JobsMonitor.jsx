import React, { useEffect, useState } from "react";
import { getCampaignStatus } from "../api/campaigns";
import { retryFailedJobs } from "../api/jobs";

export default function JobsMonitor({ campaignId }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    if (!campaignId) return;
    setLoading(true);
    try {
      const s = await getCampaignStatus(campaignId);
      setStatus(s);
    } catch (err) {
      console.error(err);
      setMessage("Error loading status");
    } finally {
      setLoading(false);
    }
  }

  async function handleRetry() {
    if (!campaignId) return;
    setRetryLoading(true);
    setMessage("");
    try {
      const res = await retryFailedJobs(campaignId);
      setMessage(`Retried ${res.retried} failed jobs`);
      await refresh();
    } catch (err) {
      console.error(err);
      setMessage("Error retrying failed jobs");
    } finally {
      setRetryLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [campaignId]);

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Campaign Dashboard</h2>
        <button
          onClick={refresh}
          className="text-xs px-3 py-1 rounded-lg border"
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {status ? (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
    <div className="p-3 rounded-xl bg-slate-50">
      <div className="text-xs text-slate-500">Total</div>
      <div className="text-lg font-semibold">
        {status.total_jobs ?? 0}
      </div>
    </div>

    <div className="p-3 rounded-xl bg-emerald-50">
      <div className="text-xs text-emerald-700">Sent</div>
      <div className="text-lg font-semibold text-emerald-700">
        {status.sent_jobs ?? 0}
      </div>
    </div>

    <div className="p-3 rounded-xl bg-amber-50">
      <div className="text-xs text-amber-700">Pending</div>
      <div className="text-lg font-semibold text-amber-700">
        {status.pending_jobs ?? 0}
      </div>
    </div>

    <div className="p-3 rounded-xl bg-rose-50">
      <div className="text-xs text-rose-700">Errors</div>
      <div className="text-lg font-semibold text-rose-700">
        {status.error_jobs ?? 0}
      </div>
    </div>
  </div>
) : (
  <p className="text-sm text-slate-600">
    Select a campaign and wait for data.
  </p>
)}


      <button
        onClick={handleRetry}
        className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm"
        disabled={retryLoading || !campaignId}
      >
        {retryLoading ? "Retrying..." : "Retry failed jobs"}
      </button>

      {message && <p className="text-sm text-slate-700">{message}</p>}
    </div>
  );
}
