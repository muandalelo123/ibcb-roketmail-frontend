import React from "react";

export default function CampaignList({ campaigns, selectedId, onSelect }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-3">
      <h2 className="text-xl font-semibold">Campaigns (session)</h2>
      {campaigns.length === 0 && (
        <p className="text-sm text-slate-600">
          Create a campaign to see it here.
        </p>
      )}
      <ul className="space-y-1 text-sm">
        {campaigns.map(c => (
          <li key={c.id}>
            <button
              onClick={() => onSelect(c.id)}
              className={`px-3 py-1 rounded-lg border ${
                c.id === selectedId
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-800"
              }`}
            >
              #{c.id} – {c.subject}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
