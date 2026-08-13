

// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { login as apiLogin, saveToken } from "../api";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("support@ibcb-s.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await apiLogin(email, password);
      const token = res?.access_token;

      if (!token) {
        setError("Login failed: missing token in response.");
        return;
      }

      saveToken(token);
      if (typeof onLogin === "function") onLogin();
    } catch (err) {
      setError(err?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h1 className="text-lg font-semibold tracking-tight mb-1">iBCB RoketMail</h1>
        <p className="text-xs text-slate-500 mb-4">Sign in to access your email console.</p>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block mb-1 text-[11px] text-slate-600">Email</label>
            <input
              type="email"
              className="w-full px-2 py-1.5 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-slate-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block mb-1 text-[11px] text-slate-600">Password</label>
            <input
              type="password"
              className="w-full px-2 py-1.5 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-slate-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="text-[11px] text-red-600">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className={[
              "w-full mt-2 px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700",
              loading ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}


