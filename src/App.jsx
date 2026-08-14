
// src/App.jsx

// src/App.jsx
// src/App.jsx
// src/App.jsx

import TrackingLinkCreate from "./components/TrackingLinkCreate";
import TrackingVariantCreate from "./components/TrackingVariantCreate";
import TrackingStats from "./components/TrackingStats";

import {
  getContactsList,
  exportContactsCsv,
} from "./api/contacts";

import { getLogs } from "./api/logs";

import CampaignsOverview from "./components/CampaignsOverview";

import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { getCampaigns } from "./api/campaigns";



// Pages
import LoginPage from "./pages/LoginPage";
import SettingsApiKeys from "./pages/SettingsApiKeys";
import SettingsDomainPage from "./pages/SettingsDomainPage";

// Components
import CampaignCreate from "./components/CampaignCreate";
import ContactImport from "./components/ContactImport";
import SendAllButton from "./components/SendAllButton";
import JobsMonitor from "./components/JobsMonitor";
import CampaignList from "./components/CampaignList";
import SettingsPage from "./components/SettingsPage";
import SettingsGeneralPage from "./components/SettingsGeneralPage";

// API auth helpers
import { loadToken } from "./api";

/* -------------------------------------------------------------------------- */
/*  LAYOUT GLOBAL : Sidebar + Topbar                                           */
/* -------------------------------------------------------------------------- */

function AppLayout({ children, onLogout }) {
  const nav = useNavigate();
  const location = useLocation();

  const links = [
    { to: "/", label: "Dashboard" },
    { to: "/campaigns/create", label: "New Campaign" },
    { to: "/contacts", label: "Contacts" },
    { to: "/campaigns", label: "Campaigns" },
    { to: "/logs", label: "Logs" },
    { to: "/tracking", label: "Tracking" },
    { to: "/settings/general", label: "Settings (General)" },
    { to: "/settings", label: "Settings (SMTP)" },
    { to: "/settings/api-keys", label: "Settings (API Keys)" },
    { to: "/settings/domain", label: "Settings (Domain)" },
  ];

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* SIDEBAR */}
      <aside className="w-56 bg-slate-950 text-slate-50 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="text-lg font-semibold tracking-tight">iBCB RoketMail</div>
          <div className="text-xs text-slate-400 mt-1">Email marketing console</div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1 text-sm">
          {links.map((link) => {
            const isActive =
              location.pathname === link.to ||
              (link.to !== "/" && location.pathname.startsWith(link.to));

            return (
              <button
                key={link.to}
                type="button"
                onClick={() => nav(link.to)}
                className={[
                  "w-full text-left px-3 py-2 rounded-md transition",
                  isActive ? "bg-slate-800 text-slate-50" : "text-slate-200 hover:bg-slate-800/60",
                ].join(" ")}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-slate-800 text-[11px] text-slate-500">
          © {new Date().getFullYear()} iBCB RoketMail
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-white flex items-center justify-between px-4">
          <div className="text-sm font-semibold">iBCB RoketMail Console</div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">support@ibcb-s.com</span>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="ml-2 px-3 py-1 rounded-md border border-slate-300 text-xs hover:bg-slate-50"
              >
                Logout
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-4 overflow-auto">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  UI HELPERS                                                                 */
/* -------------------------------------------------------------------------- */

function Card({ children }) {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  PAGES                                                                      */
/* -------------------------------------------------------------------------- */

function DashboardPage({ campaigns, selectedCampaignId, setSelectedCampaignId }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
        <p className="text-xs text-slate-500">Overview of your campaigns and sending jobs.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr),minmax(0,1.8fr)]">
        <section className="space-y-4">
          <Card>
            <h2 className="text-sm font-semibold mb-2">Campaigns (session)</h2>

            <div className="max-h-72 overflow-y-auto pr-1">
               <CampaignList
                 campaigns={campaigns}
                 selectedId={selectedCampaignId}
                 onSelect={setSelectedCampaignId}
              />
            </div>


          </Card>

          <Card>
            <h2 className="text-sm font-semibold mb-2">Send to all contacts</h2>
            <p className="text-xs text-slate-500 mb-2">
              Select a campaign above, then trigger the sending job.
            </p>
            <SendAllButton campaignId={selectedCampaignId} />
          </Card>
        </section>

        <Card>
          <h2 className="text-sm font-semibold mb-2">Jobs monitor</h2>
          <p className="text-xs text-slate-500 mb-2">
            Follow background tasks and sending status for the selected campaign.
          </p>
          <JobsMonitor campaignId={selectedCampaignId} />
        </Card>
      </div>
    </div>
  );
}

function CampaignsPage({ campaigns }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Campaigns
        </h1>
        <p className="text-xs text-slate-500">
          List of campaigns and their aggregated stats.
        </p>
      </div>

      <Card>
        <CampaignsOverview campaigns={campaigns} />
      </Card>
    </div>
  );
}



// src/App.jsx

function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  async function loadContacts() {
    setLoading(true);
    setError("");

    try {
      const data = await getContactsList();
      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Unable to load contacts.");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setError("");

    try {
      const { blob, filename } = await exportContactsCsv();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Unable to export contacts.");
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    loadContacts();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Contacts</h1>
        <p className="text-xs text-slate-500">
          Manage contacts, imports, exports, and audience data.
        </p>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.7fr),minmax(0,1fr)]">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold">Contacts list</h2>
              <p className="text-xs text-slate-500">
                {contacts.length} contact(s)
              </p>
            </div>

            <button
              type="button"
              onClick={loadContacts}
              disabled={loading}
              className="px-3 py-2 rounded-md border border-slate-300 text-sm bg-white hover:bg-slate-50 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              {loading ? "Loading contacts..." : "No contacts available."}
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3">ID</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">First name</th>
                    <th className="py-2 pr-3">Last name</th>
                    <th className="py-2 pr-3">Language</th>
                    <th className="py-2">Created</th>
                  </tr>
                </thead>

                <tbody>
                  {contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="py-2 pr-3">#{contact.id}</td>

                      <td className="py-2 pr-3">
                        {contact.email}
                      </td>

                      <td className="py-2 pr-3">
                        {contact.first_name || "-"}
                      </td>

                      <td className="py-2 pr-3">
                        {contact.last_name || "-"}
                      </td>

                      <td className="py-2 pr-3">
                        {contact.language || "-"}
                      </td>

                      <td className="py-2 whitespace-nowrap">
                        {contact.created_at
                          ? new Date(contact.created_at).toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold mb-2">Import / Export</h2>

          <div className="space-y-3">
            <ContactImport />

            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm bg-white hover:bg-slate-50 disabled:opacity-60"
            >
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ContactsUploadPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-lg font-semibold tracking-tight">Upload contacts</h1>
      <p className="text-xs text-slate-500 mb-2">Import contacts from CSV or other sources.</p>
      <ContactImport />
    </div>
  );
}

// src/App.jsx

function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadLogs() {
    setLoading(true);
    setError("");

    try {
      const data = await getLogs(200);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Unable to load logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Logs</h1>
          <p className="text-xs text-slate-500">
            Global sending log from the FastAPI backend.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
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

      <Card>
        {logs.length === 0 ? (
          <div className="text-sm text-slate-500">
            {loading ? "Loading logs..." : "No logs available."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3">Job</th>
                  <th className="py-2 pr-3">Campaign</th>
                  <th className="py-2 pr-3">Recipient</th>
                  <th className="py-2 pr-3">Provider</th>
                  <th className="py-2 pr-3">State</th>
                  <th className="py-2 pr-3">Sent at</th>
                  <th className="py-2">Error</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr key={log.job_id} className="border-b last:border-b-0">
                    <td className="py-2 pr-3">
                      #{log.job_id}
                    </td>

                    <td className="py-2 pr-3">
                      <div className="font-medium">
                        #{log.campaign_id}
                      </div>
                      <div className="text-xs text-slate-500">
                        {log.campaign_subject || "-"}
                      </div>
                    </td>

                    <td className="py-2 pr-3">
                      {log.email || "-"}
                    </td>

                    <td className="py-2 pr-3">
                      {log.provider || "-"}
                    </td>

                    <td className="py-2 pr-3">
                      {log.state || "-"}
                    </td>

                    <td className="py-2 pr-3 whitespace-nowrap">
                      {log.sent_at
                        ? new Date(log.sent_at).toLocaleString()
                        : "-"}
                    </td>

                    <td className="py-2">
                      {log.error_message ? (
                        <span className="text-red-700">
                          {log.error_message}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}



function TrackingPage({ campaigns }) {

 const TRACKING_CAMPAIGN_KEY = "rocketmail_tracking_campaign_id";
 const [campaignId, setCampaignId] = useState(
  () => localStorage.getItem(TRACKING_CAMPAIGN_KEY) || ""
);

  const [lastCreatedLinkId, setLastCreatedLinkId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
  if (!campaigns.length) return;

  const exists = campaigns.some(
    (campaign) => String(campaign.id) === String(campaignId)
  );

  if (campaignId && exists) return;

  const defaultId = String(campaigns[0].id);

  setCampaignId(defaultId);
  localStorage.setItem(TRACKING_CAMPAIGN_KEY, defaultId);
}, [campaigns, campaignId]);

  const selectedCampaignId =
    campaignId === "" ? null : Number(campaignId);

  function handleLinkCreated(link) {
    if (link?.link_id != null) {
      setLastCreatedLinkId(link.link_id);
      setRefreshKey((prev) => prev + 1);
    }
  }

  function handleVariantCreated() {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Tracking</h1>
        <p className="text-xs text-slate-500">
          Manage campaign links, variants, and click analytics.
        </p>
      </div>

      <Card>
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Campaign
          </label>

          <select>
            className="w-full border rounded-lg px-3 py-2"
            value={campaignId}

            onChange={(e) => {
  const value = e.target.value;

  setCampaignId(value);
  setLastCreatedLinkId(null);

  if (value) {
    localStorage.setItem(TRACKING_CAMPAIGN_KEY, value);
  } else {
    localStorage.removeItem(TRACKING_CAMPAIGN_KEY);
  }
}}


            <option value="">Select a campaign</option>

            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                #{campaign.id} - {campaign.subject}
              </option>
            ))}
          </select>

        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold mb-3">
            Campaign links
          </h2>

          <TrackingLinkCreate
            campaignId={selectedCampaignId}
            onCreated={handleLinkCreated}
          />
        </Card>

        <Card>
          <h2 className="text-sm font-semibold mb-3">
            Rotator / Variants
          </h2>

          <TrackingVariantCreate
            linkId={lastCreatedLinkId}
            onCreated={handleVariantCreated}
          />
        </Card>
      </div>

      <Card>
        <h2 className="text-sm font-semibold mb-3">
          Click analytics
        </h2>

        <TrackingStats
          campaignId={selectedCampaignId}
          refreshKey={refreshKey}
        />
      </Card>
    </div>
  );
}


function CreateCampaignPage({ onCreated }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">New campaign</h1>
        <p className="text-xs text-slate-500">Create a campaign (subject + sender code + HTML).</p>
      </div>
      <CampaignCreate onCreated={onCreated} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  APP ROOT                                                                   */
/* -------------------------------------------------------------------------- */

export default function App() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);

  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(loadToken()));

useEffect(() => {
  let active = true;

  async function loadCampaigns() {
    try {
      const data = await getCampaigns();

      if (!active) return;

      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Unable to load campaigns:", err);
    }
  }

  loadCampaigns();

  return () => {
    active = false;
  };
}, []);




  function handleCampaignCreated(campaign) {
    setCampaigns((prev) => [...prev, campaign]);
    if (campaign && campaign.id != null) setSelectedCampaignId(campaign.id);
  }

  function handleLogin() {
    setIsAuthenticated(true);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("ibcb_token");
    setIsAuthenticated(false);
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <AppLayout onLogout={handleLogout}>
      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              campaigns={campaigns}
              selectedCampaignId={selectedCampaignId}
              setSelectedCampaignId={setSelectedCampaignId}
            />
          }
        />

        <Route
          path="/campaigns/create"
          element={<CreateCampaignPage onCreated={handleCampaignCreated} />}
        />

        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/contacts/upload" element={<ContactsUploadPage />} />

        <Route
               path="/campaigns"
               element={<CampaignsPage campaigns={campaigns} />}
/>

        <Route path="/logs" element={<LogsPage />} />

        <Route
          path="/tracking"
          element={<TrackingPage campaigns={campaigns} />}
        />

        <Route path="/settings/general" element={<SettingsGeneralPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/api-keys" element={<SettingsApiKeys />} />
        <Route path="/settings/domain" element={<SettingsDomainPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}


