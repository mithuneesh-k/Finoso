import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LogoMark from "../components/LogoMark.jsx";

/* ─── Features ─── */
const FEATURES = [
  {
    icon: "◉",
    title: "Market Workspace",
    desc: "Explore NSE/BSE instruments with candlestick charts, price movements, and configurable alerts in one focused workspace.",
    accent: "--accent-cyan",
  },
  {
    icon: "◈",
    title: "Smart Watchlist",
    desc: "Track unlimited stocks, set custom alerts for breakouts, and monitor price movements across all your favourites.",
    accent: "--accent-green",
  },
  {
    icon: "PF",
    title: "Portfolio Tracker",
    desc: "Your complete P&L dashboard — positions, unrealised gains, realised profit and daily net worth movement.",
    accent: "--accent-gold",
  },
  {
    icon: "⟳",
    title: "Strategy Backtesting",
    desc: "Run SMA Crossover, RSI, MACD, Bollinger Bands and more against years of historical data in seconds.",
    accent: "--accent-purple",
  },
  {
    icon: "⬢",
    title: "Paper Trading",
    desc: "Trade risk-free with virtual capital. Practise buy and sell decisions and build confidence at your own pace.",
    accent: "--accent-orange",
  },
];

/* ─── How it works ─── */
const STEPS = [
  { num: "01", title: "Create Your Account",  desc: "Sign up free. Get ₹10,00,000 virtual capital instantly. No real money needed." },
  { num: "02", title: "Explore the Market",   desc: "Browse NSE/BSE stocks, read charts, and organise instruments into watchlists." },
  { num: "03", title: "Place Paper Trades",   desc: "Buy and sell with virtual money. Track P&L, positions, and order history." },
  { num: "04", title: "Backtest Strategies",  desc: "Test your ideas on historical data. Find what works before risking a rupee." },
];

/* ─── Main component ─── */
export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);

  /* parallax dots */
  useEffect(() => {
    const handler = (e) => {
      const el = heroRef.current;
      if (!el) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      el.style.setProperty("--px", `${x}px`);
      el.style.setProperty("--py", `${y}px`);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div className="lp-root">
      {/* ── Topbar ── */}
      <header className="lp-header">
        <div className="lp-header-inner">
          <div className="lp-logo"><LogoMark size={31} wordmark /></div>
          <nav className="lp-nav">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
          </nav>
          <div className="lp-header-cta">
            <button className="lp-btn-ghost" onClick={() => navigate("/login")}>Log In</button>
            <button className="lp-btn-primary" onClick={() => navigate("/login")}>Start Free</button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="lp-hero" ref={heroRef}>
        <div className="lp-hero-bg-grid" />
        <div className="lp-hero-orb lp-orb-1" />
        <div className="lp-hero-orb lp-orb-2" />
        <div className="lp-hero-orb lp-orb-3" />

        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <span className="lp-badge-dot" />
            Paper Trading Platform · Risk-Free Learning
          </div>
          <h1 className="lp-hero-title">
            Trade Smarter.<br />
            <span className="lp-gradient-text">Zero Risk.</span><br />
            Better Decisions.
          </h1>
          <p className="lp-hero-sub">
            Finoso gives you a focused market workspace, ₹10 lakh virtual capital,
            portfolio tracking, and strategy backtesting — everything you need to become
            a disciplined trader before putting money on the line.
          </p>
          <div className="lp-hero-actions">
            <button className="lp-btn-primary lp-btn-lg" onClick={() => navigate("/login")}>
              Start Paper Trading — Free
            </button>
            <button className="lp-btn-ghost lp-btn-lg" onClick={() => {
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }}>
              See Features ↓
            </button>
          </div>

        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-section" id="features">
        <div className="lp-section-inner">
          <div className="lp-section-label">What you get</div>
          <h2 className="lp-section-title">Everything a serious trader needs</h2>
          <p className="lp-section-sub">One platform to learn, practise, and backtest without risking a single rupee.</p>

          <div className="lp-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="lp-feature-card">
                <div className="lp-feature-icon" style={{ color: `var(${f.accent})`, textShadow: `0 0 16px var(${f.accent})` }}>{f.icon}</div>
                <div className="lp-feature-title">{f.title}</div>
                <div className="lp-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="lp-section lp-section-dark" id="how">
        <div className="lp-section-inner">
          <div className="lp-section-label">How it works</div>
          <h2 className="lp-section-title">Four steps to trading confidence</h2>

          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div key={s.num} className="lp-step">
                <div className="lp-step-num">{s.num}</div>
                <div className="lp-step-line" style={{ opacity: i < STEPS.length - 1 ? 1 : 0 }} />
                <div className="lp-step-body">
                  <div className="lp-step-title">{s.title}</div>
                  <div className="lp-step-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta-section">
        <div className="lp-cta-orb" />
        <div className="lp-cta-inner">
          <h2 className="lp-cta-title">Your trading journey starts here.</h2>
          <p className="lp-cta-sub">No credit card. No deposits. Just focused trading practice.</p>
          <button className="lp-btn-primary lp-btn-xl" onClick={() => navigate("/login")}>
            Create Free Account →
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-logo"><LogoMark size={29} wordmark /></div>
          <div className="lp-footer-note">
            Paper trading only. No real financial transactions. For educational purposes.
          </div>
          <button className="lp-btn-ghost lp-footer-login" onClick={() => navigate("/login")}>
            Log In →
          </button>
        </div>
      </footer>
    </div>
  );
}
