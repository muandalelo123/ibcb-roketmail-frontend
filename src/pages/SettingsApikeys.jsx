

// src/pages/SettingsApiKeys.jsx
import { loadToken } from "../api";
import { useEffect, useState } from "react";
import {
  setApiKey,
  getApiKey,
  clearApiKey,
  getStoredApiKeyPrefix,
} from "../utils/apiKeyStorage.js";

const API_BASE_URL = "http://localhost:8000"; // adapte si besoin

export default function SettingsApiKeys() {
  const [apiKeyFull, setApiKeyFull] = useState(getApiKey() || "");
  const [apiKeysList, setApiKeysList] = useState([]); // liste depuis le backend
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [name, setName] = useState("Clé principale");
  const [scopesInput, setScopesInput] = useState("emails:send,campaigns:read");

  const storedPrefix = getStoredApiKeyPrefix();

  // Si tu utilises un token simple pour l'admin (auth/login)

  const authToken = loadToken();


  // Charger la liste des clés existantes
  async function fetchApiKeys() {
    setLoadingList(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/settings/api-keys`, {
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Erreur lors du chargement des clés API.");
      }
      setApiKeysList(data);
    } catch (err) {
      setError(err.message || "Erreur inconnue lors du chargement des clés API.");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    fetchApiKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Générer une nouvelle clé
  async function handleGenerate() {
    setLoading(true);
    setError("");
    setSuccess("");

    // scopesInput est une chaine "emails:send,campaigns:read"
    // on la convertit en liste
    const scopes = scopesInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      const res = await fetch(`${API_BASE_URL}/settings/api-keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          name,
          scopes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.detail || "Erreur lors de la génération de la clé API."
        );
      }

      // data.secret contient la clé complète "<key_prefix>.<secret>"
      if (!data.secret) {
        throw new Error("Le backend n'a pas renvoyé de 'secret'.");
      }

      setApiKey(data.secret);
      setApiKeyFull(data.secret);
      setSuccess(
        "Nouvelle clé API générée. Copie-la et garde-la en lieu sûr. Elle est stockée dans ce navigateur."
      );

      // Recharger la liste pour voir la nouvelle clé
      fetchApiKeys();
    } catch (err) {
      setError(err.message || "Erreur inconnue lors de la génération de la clé.");
    } finally {
      setLoading(false);
    }
  }

  function handleClearLocal() {
    clearApiKey();
    setApiKeyFull("");
    setSuccess("Clé API supprimée de ce navigateur.");
    setError("");
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
      <h2>Settings – API Keys</h2>
      <p>
        Cette section permet de gérer les clés API utilisées par le frontend pour
        appeler l'API FastAPI avec le header <code>x-api-key</code>.
      </p>

      {/* Formulaire création */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: 16,
          borderRadius: 8,
          marginBottom: 24,
          marginTop: 8,
        }}
      >
        <h3>Créer / régénérer une clé API</h3>

        <div style={{ marginBottom: 8 }}>
          <label>
            Nom de la clé{" "}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ marginLeft: 8, width: "60%" }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>
            Scopes (séparés par des virgules){" "}
            <input
              type="text"
              value={scopesInput}
              onChange={(e) => setScopesInput(e.target.value)}
              style={{ marginLeft: 8, width: "60%" }}
            />
          </label>
        </div>

        <button
  onClick={handleGenerate}
  disabled={loading}
  className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
>
  {loading ? "Génération..." : "Générer une nouvelle clé API"}
</button>


        {apiKeyFull && (
          <div style={{ marginTop: 16 }}>
            <p>Clé API actuellement stockée dans ce navigateur :</p>
            <pre
              style={{
                background: "#f5f5f5",
                padding: 8,
                borderRadius: 4,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {apiKeyFull}
            </pre>
            <p style={{ fontSize: 12, color: "#555" }}>
              Ne la partage jamais publiquement. Elle permet d'utiliser ton
              backend depuis le frontend.
            </p>
            <button
              onClick={() => {
                navigator.clipboard
                  .writeText(apiKeyFull)
                  .catch(() => {}); // on ignore les erreurs
              }}
              style={{ marginRight: 8 }}
            >
              Copier dans le presse-papiers
            </button>
            <button onClick={handleClearLocal}>Effacer la clé locale</button>
          </div>
        )}
      </div>

      {/* Liste des clés en base */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: 16,
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <h3>Clés API en base</h3>
        {loadingList ? (
          <p>Chargement...</p>
        ) : apiKeysList.length === 0 ? (
          <p>Aucune clé API enregistrée.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
                  ID
                </th>
                <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
                  Nom
                </th>
                <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
                  Prefix
                </th>
                <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
                  Scopes
                </th>
                <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
                  Créée le
                </th>
                <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
                  Utilisation locale
                </th>
              </tr>
            </thead>
            <tbody>
              {apiKeysList.map((k) => (
                <tr key={k.id}>
                  <td style={{ borderBottom: "1px solid #eee" }}>{k.id}</td>
                  <td style={{ borderBottom: "1px solid #eee" }}>{k.name}</td>
                  <td style={{ borderBottom: "1px solid #eee" }}>{k.key_prefix}</td>
                  <td style={{ borderBottom: "1px solid #eee" }}>
                    {k.scopes && k.scopes.length > 0
                      ? k.scopes.join(", ")
                      : "(aucun)"}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee" }}>
                    {new Date(k.created_at).toLocaleString()}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee" }}>
                    {storedPrefix && storedPrefix === k.key_prefix ? (
                      <span style={{ color: "green", fontWeight: "bold" }}>
                        Utilisée dans ce navigateur
                      </span>
                    ) : (
                      <span style={{ color: "#999" }}>–</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {success && <p style={{ color: "green" }}>{success}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}


