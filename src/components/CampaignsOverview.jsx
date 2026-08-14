
// src/components/CampaignsOverview.jsx

import React, { useEffect, useState } from "react";
import { getCampaignStatus } from "../api/campaigns";

export default function CampaignsOverview({ campaigns }) {
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadStatuses() {
    if (!Array.isArray(campaigns) || campaigns.length === 0) {
      setStatuses({});
      return;
    }

    setLoading(true);
    setError("");

    try {
      const results = await Promise.all(
        campaigns.map(async (campaign) => {
          try {
            const status = await getCampaignStatus(campaign.id);
            return [campaign.id, status];
          } catch (err) {
            console.error(
              `Unable to load status for campaign ${campaign.id}:`,
              err
            );

            return [
              campaign.id,
              {
                campaign_id: campaign.id,
                subject: campaign.subject,
                status: "error",
                total_jobs: 0,
                pending_jobs: 0,
                sent_jobs: 0,
                error_jobs: 0,
              },
            ];
          }
        })
      );

      setStatuses(Object.fromEntries(results));
    } catch (err) {
      console.error(err);
      setError(err?.message || "Unable to load campaign statistics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatuses();
  }, [campaigns]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">
            Campaign overview
          </h2>
          <p className="text-xs text-slate-500">
            Persistent campaigns with aggregated sending statistics.
          </p>
        </div>

        <button
          type="button"
          onClick={loadStatuses}
          disabled={loading}
          className="px-3 py-2 rounded-lg border text-sm bg-white hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {campaigns.length === 0 ? (
        <p className="text-sm text-slate-500">
          No campaigns available.
        </p>
      ) : (

        <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-sm">

            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 pr-3">Subject</th>
                <th className="py-2 pr-3">Provider</th>
                <th className="py-2 pr-3">Created</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Sent</th>
                <th className="py-2 pr-3">Pending</th>
                <th className="py-2">Errors</th>
              </tr>
            </thead>

            <tbody>
              {campaigns.map((campaign) => {
                const status = statuses[campaign.id];

                return (
                  <tr
                    key={campaign.id}
                    className="border-b last:border-b-0"
                  >
                    <td className="py-2 pr-3">
                      #{campaign.id}
                    </td>

                    <td className="py-2 pr-3">
                      {campaign.subject}
                    </td>

                    <td className="py-2 pr-3">
                      {campaign.from_code || "-"}
                    </td>

                    <td className="py-2 pr-3 whitespace-nowrap">
                      {campaign.created_at
                        ? new Date(campaign.created_at).toLocaleString()
                        : "-"}
                    </td>

                    <td className="py-2 pr-3">
                      {status?.status || "-"}
                    </td>

                    <td className="py-2 pr-3">
                      {status?.total_jobs ?? 0}
                    </td>

                    <td className="py-2 pr-3">
                      {status?.sent_jobs ?? 0}
                    </td>

                    <td className="py-2 pr-3">
                      {status?.pending_jobs ?? 0}
                    </td>

                    <td className="py-2">
                      {status?.error_jobs ?? 0}
                    </td>
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


