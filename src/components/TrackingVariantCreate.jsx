
import React, { useState } from "react";
import { addLinkVariant } from "../api/tracking";

export default function TrackingVariantCreate({ linkId, onCreated }) {
  const [url, setUrl] = useState("");
  const [weight, setWeight] = useState(100);
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    if (!linkId) {
      setMessage("Create or select a tracked link first.");
      return;
    }

    if (!url.trim()) {
      setMessage("Variant URL is required.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await addLinkVariant(linkId, {
        url: url.trim(),
        weight,
        isActive,
      });

      setMessage(`Variant created (id=${result.variant_id}).`);
      setUrl("");
      setWeight(100);
      setIsActive(true);

      if (typeof onCreated === "function") {
        onCreated(result);
      }
    } catch (err) {
      console.error(err);
      setMessage(err?.message || "Error creating variant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">
          Link ID
        </label>

        <input
          type="text"
          value={linkId || ""}
          readOnly
          className="w-full border rounded-lg px-3 py-2 bg-slate-50"
          placeholder="Create a tracked link first"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Variant URL
        </label>

        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="https://example.com/variant"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Weight
        </label>

        <input
          type="number"
          min="0"
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Active
      </label>

      <button
        type="submit"
        disabled={loading || !linkId}
        className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-60"
      >
        {loading ? "Creating..." : "Add variant"}
      </button>

      {message && (
        <p className="text-sm text-slate-600">
          {message}
        </p>
      )}
    </form>
  );
}
