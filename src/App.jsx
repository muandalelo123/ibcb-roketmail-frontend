
// src/App.jsx

// src/App.jsx
// src/App.jsx
// src/App.jsx

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

function CampaignsPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-lg font-semibold tracking-tight">Campaigns</h1>
      <p className="text-xs text-slate-500">
        List of campaigns and their aggregated stats.
      </p>
    </div>
  );
}

function ContactsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Contacts</h1>
        <p className="text-xs text-slate-500">
          Manage contacts, imports, exports, and audience data.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold mb-2">Contacts list</h2>
          <p className="text-xs text-slate-500 mb-3">
            This section will display your contacts from the backend.
          </p>

          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Table to connect later with GET /contacts
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold mb-2">Import / Export</h2>
          <p className="text-xs text-slate-500 mb-3">
            Import contacts from CSV and export your audience.
          </p>

          <div className="space-y-3">
            <ContactImport />

            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-2 rounded-md border border-slate-300 text-sm bg-white hover:bg-slate-50"
              >
                Refresh Contacts
              </button>

              <button
                type="button"
                className="px-3 py-2 rounded-md border border-slate-300 text-sm bg-white hover:bg-slate-50"
              >
                Export CSV
              </button>
            </div>
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

function LogsPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-lg font-semibold tracking-tight">Logs</h1>
      <p className="text-xs text-slate-500">
        Global sending log, linked to your FastAPI backend.
      </p>
    </div>
  );
}

function TrackingPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Tracking</h1>
        <p className="text-xs text-slate-500">
          Manage campaign links, rotator variants, and click analytics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold mb-2">Campaign links</h2>
          <p className="text-xs text-slate-500 mb-3">
            Create tracked links for a selected campaign.
          </p>

          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Form to connect later with POST /campaigns/{`{campaign_id}`}/links
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold mb-2">Rotator / Variants</h2>
          <p className="text-xs text-slate-500 mb-3">
            Add link variants and control traffic distribution by weight.
          </p>

          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Form to connect later with POST /links/{`{link_id}`}/variants
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold mb-2">Click analytics</h2>
          <p className="text-xs text-slate-500 mb-3">
            View clicks per campaign and per variant.
          </p>

          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Stats to connect later with GET /campaigns/{`{campaign_id}`}/clicks
          </div>
        </Card>
      </div>
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
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/tracking" element={<TrackingPage />} />

        <Route path="/settings/general" element={<SettingsGeneralPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/api-keys" element={<SettingsApiKeys />} />
        <Route path="/settings/domain" element={<SettingsDomainPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}


