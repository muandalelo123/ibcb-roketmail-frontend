// frontend/src/components/ContactImport.jsx
// frontend/src/components/ContactImport.jsx
// frontend/src/components/ContactImport.jsx
import React, { useState } from "react";
import { importContacts } from "../api/contacts";

export default function ContactImport() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [previewHeaders, setPreviewHeaders] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);

  function handleFileChange(e) {
    const f = e.target.files[0] || null;
    setFile(f);
    setMessage("");
    setPreviewHeaders([]);
    setPreviewRows([]);

    if (!f) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target.result;

      // Découpage des lignes, suppression des lignes vides
      const lines = text
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0);

      if (lines.length === 0) return;

      // Détection simple du séparateur : ";" ou ","
      const delimiter = lines[0].includes(";") ? ";" : ",";

      const headers = lines[0].split(delimiter).map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const cols = line.split(delimiter);
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = (cols[i] || "").trim();
        });
        return obj;
      });

      setPreviewHeaders(headers);
      setPreviewRows(rows);
    };

    reader.readAsText(f);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setMessage("");

    try {
      const contacts = await importContacts(file);
      // Backend actuel : liste de contacts créés
      setMessage(`Imported ${contacts.length} contacts`);
    } catch (err) {
      console.error(err);
      setMessage("Error importing contacts");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <h2 className="text-xl font-semibold">Upload Contacts (CSV)</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
        />

        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm"
          disabled={loading || !file}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {message && <p className="text-sm text-slate-700">{message}</p>}

      {previewRows.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-2">
            Preview ({previewRows.length} rows)
          </h3>
          <div className="overflow-auto border rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  {previewHeaders.map(h => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    {previewHeaders.map(h => (
                      <td key={h} className="px-3 py-1">
                        {row[h]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
