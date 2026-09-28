import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import LogoMark from "../components/LogoMark.jsx";

export default function AuthPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode]       = useState("login");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    let result;
    if (mode === "login") {
      result = await login(email, password);
    } else {
      if (!name.trim()) { setError("Name is required"); setLoading(false); return; }
      result = await signup(name, email, password);
    }
    setLoading(false);
    if (result.success) {
      navigate(result.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-base)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "center" }}><LogoMark size={44} wordmark className="auth-brand" /></div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 6 }}>
            Advanced Trading Workspace
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "32px 28px" }}>
          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: 28 }}>
            <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); setError(""); }}>
              Sign In
            </button>
            <button className={`tab ${mode === "signup" ? "active" : ""}`} onClick={() => { setMode("signup"); setError(""); }}>
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "signup" && (
              <div>
                <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Full Name</label>
                <input
                  type="text" placeholder="Your name"
                  value={name} onChange={(e) => setName(e.target.value)}
                  required style={{ width: "100%" }}
                />
              </div>
            )}
            <div>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Email Address</label>
              <input
                type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Password</label>
              <input
                type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPass(e.target.value)}
                required style={{ width: "100%" }}
              />
            </div>

            {error && (
              <div style={{ background: "rgba(255,51,102,0.1)", border: "1px solid rgba(255,51,102,0.3)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--accent-red)" }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: 4, width: "100%", padding: "12px", fontSize: "0.85rem" }} disabled={loading}>
              {loading ? "Please wait…" : mode === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </form>

        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-dim)" }}>
          Secure, fast, and robust platform for market professionals. *No real money involved*
        </div>
      </div>
    </div>
  );
}



