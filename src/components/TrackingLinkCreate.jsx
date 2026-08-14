
import React, { useState } from "react";
import { createCampaignLink } from "../api/tracking";

export default function TrackingLinkCreate({ campaignId, onCreated }) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    if (!campaignId) {
      setMessage("Select a campaign first.");
      return;
    }

    if (!originalUrl.trim()) {
      setMessage("Original URL is required.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await createCampaignLink(campaignId, {
        originalUrl: originalUrl.trim(),
        label: label.trim(),
      });

      setMessage(`Link created (id=${result.link_id}).`);
      setOriginalUrl("");
      setLabel("");

      if (typeof onCreated === "function") {
        onCreated(result);
      }
    } catch (err) {
      console.error(err);
      setMessage(err?.message || "Error creating tracked link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">
          Original URL
        </label>
        <input
          type="url"
          className="w-full border rounded-lg px-3 py-2"
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          placeholder="https://example.com/product"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Label
        </label>
        <input
          type="text"
          className="w-full border rounded-lg px-3 py-2"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Main CTA"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !campaignId}
        className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create tracked link"}
      </button>

      {message && (
        <p className="text-sm text-slate-600">
          {message}
        </p>
      )}
    </form>
  );
}

