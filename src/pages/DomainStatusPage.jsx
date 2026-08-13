
// src/pages/DomainStatusPage.jsx
import { useEffect, useState } from "react";
import { StatusBadge } from "../components/StatusBadge";

export default function DomainStatusPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("http://localhost:8000/settings/domain-status");
        if (!res.ok) {
          throw new Error("Erreur lors du chargement du statut du domaine");
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  if (loading) {
    return <p>Loading domain status...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  const cardStyle = {
    maxWidth: "800px",
    margin: "20px auto",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
    backgroundColor: "#ffffff",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
  };

  const headerStyle = {
    marginBottom: "16px",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "8px"
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px"
  };

  const thTdCommon = {
    padding: "10px 8px",
    textAlign: "left",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "14px"
  };

  return (
    <div style={{ backgroundColor: "#f3f4f6", minHeight: "100vh", padding: "20px" }}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h2 style={{ fontSize: "20px", margin: 0 }}>Domain & Deliverability Settings</h2>
          <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
            Vérifiez que les enregistrements DNS nécessaires sont correctement configurés
            pour maximiser la délivrabilité de vos emails.
          </p>
          <p style={{ fontSize: "14px", marginTop: "8px" }}>
            <strong>Domaine&nbsp;:</strong> {data.domain}
          </p>
        </div>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thTdCommon, fontWeight: 600 }}>Record</th>
              <th style={{ ...thTdCommon, fontWeight: 600 }}>Status</th>
              <th style={{ ...thTdCommon, fontWeight: 600 }}>Expected / Selector</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.records).map(([name, record]) => (
              <tr key={name}>
                <td style={thTdCommon}>
                  <strong>{name}</strong>
                </td>
                <td style={thTdCommon}>
                  <StatusBadge status={record.status} />
                </td>
                <td style={thTdCommon}>
                  {record.expected && (
                    <div>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>Expected:</span>
                      <div style={{ fontFamily: "monospace", fontSize: "12px" }}>
                        {record.expected}
                      </div>
                    </div>
                  )}
                  {record.selector && (
                    <div style={{ marginTop: record.expected ? "4px" : 0 }}>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>Selector:</span>{" "}
                      <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
                        {record.selector}
                      </span>
                    </div>
                  )}
                  {!record.expected && !record.selector && (
                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                      No additional details
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: "16px", fontSize: "12px", color: "#6b7280" }}>
          <p>
            Si un record est <strong>Not configured</strong>, mettez à jour votre DNS
            chez votre registrar (ex&nbsp;: Namecheap, Cloudflare, etc.) puis revenez
            sur cette page après propagation (quelques minutes à quelques heures).
          </p>
        </div>
      </div>
    </div>
  );
}


