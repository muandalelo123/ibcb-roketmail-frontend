
// src/pages/SettingsDomainPage.jsx
// src/pages/SettingsDomainPage.jsx
import { useEffect, useState } from "react";
import { loadApiKey } from "../api";


// ⚙️ à adapter pour utiliser la même logique que SettingsGeneralPage
const API_BASE_URL = "http://localhost:8000";

// même endroit que pour General / SMTP : soit constante, soit localStorage

function StatusBadge({ status }) {
  const isOk = status === "Configured";

  const style = {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: 600,
    backgroundColor: isOk ? "rgba(34,197,94,0.1)" : "rgba(248,113,113,0.1)",
    color: isOk ? "rgb(34,197,94)" : "rgb(239,68,68)",
    border: `1px solid ${isOk ? "rgba(34,197,94,0.4)" : "rgba(248,113,113,0.4)"}`
  };

  return <span style={style}>{isOk ? "Configured" : "Not configured"}</span>;
}

export default function SettingsDomainPage() {
  const apiKey = loadApiKey();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/settings/domain-status`, {
          headers: {
            "Content-Type": "application/json",
           "x-api-key": apiKey,   // 🔑 même logique que General / SMTP
          },
        });

        if (!res.ok) {
          let detail = "";
          try {
            const body = await res.json();
            detail = body.detail || JSON.stringify(body);
          } catch {
            detail = await res.text();
          }
          throw new Error(
            `HTTP ${res.status} – ${detail || "Failed to load domain status"}`
          );
        }

        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error("Error loading domain status:", e);
        setError(e.message || "Failed to load domain status");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-xs text-slate-500">Loading domain status…</div>;
  }

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-lg font-semibold tracking-tight">
          Settings (Domain)
        </h1>
        <p className="text-xs text-red-600">{error}</p>
        <p className="text-[11px] text-slate-500">
          Vérifie que l’endpoint <code>/settings/domain-status</code> est
          accessible et que la clé API envoyée est la même que pour les autres
          pages de réglages.
        </p>
      </div>
    );
  }

  const records = data.records || {};

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Settings (Domain &amp; Deliverability)
        </h1>
        <p className="text-xs text-slate-500">
          Vérifie SPF, DKIM et DMARC pour améliorer la délivrabilité de tes emails.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 text-xs">
        <div className="mb-3 border-b border-slate-100 pb-2">
          <p className="text-[11px] text-slate-500 mb-1">
            Domaine analysé :
          </p>
          <p className="text-sm font-medium">{data.domain}</p>
        </div>

        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 pr-2">Record</th>
              <th className="text-left py-2 pr-2">Status</th>
              <th className="text-left py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(records).map(([name, rec]) => (
              <tr key={name} className="border-b border-slate-50">
                <td className="py-2 pr-2 align-top">
                  <strong>{name}</strong>
                </td>
                <td className="py-2 pr-2 align-top">
                  <StatusBadge status={rec.status} />
                </td>
                <td className="py-2 align-top">
                  {rec.expected && (
                    <div>
                      <span className="text-[11px] text-slate-500">
                        Expected:
                      </span>
                      <div className="font-mono text-[11px]">
                        {rec.expected}
                      </div>
                    </div>
                  )}
                  {rec.selector && (
                    <div className="mt-1">
                      <span className="text-[11px] text-slate-500">
                        Selector:
                      </span>{" "}
                      <span className="font-mono text-[11px]">
                        {rec.selector}
                      </span>
                    </div>
                  )}
                  {!rec.expected && !rec.selector && (
                    <span className="text-[11px] text-slate-400">
                      No extra details
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-3 text-[11px] text-slate-500">
          Si un record est <strong>Not configured</strong>, ajoute les valeurs
          indiquées dans la configuration DNS de ton registrar (Namecheap,
          Cloudflare, etc.), puis reviens sur cette page après propagation DNS.
        </p>
      </div>
    </div>
  );
}




