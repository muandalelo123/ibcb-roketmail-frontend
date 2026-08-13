

// src/components/Sidebar.jsx

import { NavLink } from "react-router-dom";
import "./Sidebar.css"; // optionnel si tu as un fichier de styles séparé

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 260,
        backgroundColor: "#0b1020",
        color: "white",
        display: "flex",
        flexDirection: "column",
        padding: "16px 0",
      }}
    >
      {/* Header / titre de la console */}
      <div style={{ padding: "0 20px 16px 20px", marginBottom: 8 }}>
        <div style={{ fontSize: 14, opacity: 0.6 }}>Email marketing console</div>
        <div style={{ fontSize: 18, fontWeight: "bold", marginTop: 4 }}>
          iBCB Roke tMail
        </div>
      </div>

      <nav style={{ flex: 1 }}>
        <SectionTitle label="Main" />

        <SidebarLink to="/" label="Dashboard" />
        <SidebarLink to="/campaigns/new" label="New Campaign (builder)" />
        <SidebarLink to="/legacy" label="Legacy Create" />
        <SidebarLink to="/upload" label="Upload Contacts" />
        <SidebarLink to="/campaigns" label="Campaigns" />
        <SidebarLink to="/logs" label="Logs" />

        <SectionTitle label="Settings" />

        <SidebarLink to="/settings/general" label="Settings (General)" />
        <SidebarLink to="/settings/smtp" label="Settings (SMTP)" />
        {/* 🔑 Nouvelle entrée */}
        <SidebarLink to="/settings/api-keys" label="Settings (API Keys)" />
      </nav>

      {/* Footer / info bas de sidebar */}
      <div
        style={{
          padding: "12px 20px 0 20px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          fontSize: 11,
          opacity: 0.7,
        }}
      >
        © 2025 iBCB Roke tMail
      </div>
    </aside>
  );
}

/**
 * Titre de section dans la sidebar ("Main", "Settings", etc.)
 */
function SectionTitle({ label }) {
  return (
    <div
      style={{
        padding: "8px 20px 4px 20px",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        opacity: 0.5,
      }}
    >
      {label}
    </div>
  );
}

/**
 * Lien de la sidebar avec style actif
 */
function SidebarLink({ to, label }) {
  return (
    <NavLink
      to={to}
      end
      style={({ isActive }) => ({
        display: "block",
        padding: "8px 20px",
        fontSize: 14,
        textDecoration: "none",
        color: "white",
        backgroundColor: isActive ? "#1f2937" : "transparent",
        fontWeight: isActive ? 600 : 400,
      })}
    >
      {label}
    </NavLink>
  );
}



