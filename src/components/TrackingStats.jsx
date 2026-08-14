

import React, { useEffect, useState } from "react";
import { getCampaignClicks } from "../api/tracking";

export default function TrackingStats({ campaignId, refreshKey = 0 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    if (!campaignId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await getCampaignClicks(campaignId);
      setData(result);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Error loading tracking statistics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [campaignId, refreshKey]);

  if (!campaignId) {
    return (
      <p className="text-sm text-slate-500">
        Select a campaign to display tracking statistics.
      </p>
    );
  }

  if (loading && !data) {
    return <p className="text-sm text-slate-500">Loading statistics...</p>;
  }

  const links = Array.isArray(data?.links) ? data.links : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">
            Campaign #{campaignId}
          </h3>
          <p className="text-xs text-slate-500">
            Link and variant click statistics.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="px-3 py-1 rounded-lg border text-xs disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {links.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
          No tracked links for this campaign.
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <div
              key={link.link_id}
              className="border rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium text-sm">
                    {link.label || `Link #${link.link_id}`}
                  </div>

                  <div className="text-xs text-slate-500 break-all">
                    {link.original_url}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-xs text-slate-500">
                    Total clicks
                  </div>
                  <div className="text-lg font-semibold">
                    {link.total_clicks ?? 0}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-600 mb-2">
                  Variants
                </div>

                {Array.isArray(link.variants) && link.variants.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="py-2 pr-3">ID</th>
                          <th className="py-2 pr-3">URL</th>
                          <th className="py-2 pr-3">Weight</th>
                          <th className="py-2 pr-3">Active</th>
                          <th className="py-2">Clicks</th>
                        </tr>
                      </thead>

                      <tbody>
                        {link.variants.map((variant) => (
                          <tr
                            key={variant.variant_id}
                            className="border-b last:border-b-0"
                          >
                            <td className="py-2 pr-3">
                              {variant.variant_id}
                            </td>

                            <td className="py-2 pr-3 break-all">
                              {variant.url}
                            </td>

                            <td className="py-2 pr-3">
                              {variant.weight}
                            </td>

                            <td className="py-2 pr-3">
                              {variant.is_active ? "Yes" : "No"}
                            </td>

                            <td className="py-2">
                              {variant.clicks ?? 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No variants configured.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

