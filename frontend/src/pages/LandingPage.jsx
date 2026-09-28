import React from "react";
import { useNavigate } from "react-router-dom";
import LogoMark from "../components/LogoMark.jsx";

/* ─── Features ─── */
const FEATURES = [
  {
    code: "01",
    title: "Market Workspace",
    desc: "Explore NSE/BSE instruments with candlestick charts, price movements, and configurable alerts in one focused workspace.",
    accent: "--accent-cyan",
  },
  {
    code: "02",
    title: "Smart Watchlist",
    desc: "Track unlimited stocks, set custom alerts for breakouts, and monitor price movements across all your favourites.",
    accent: "--accent-green",
  },
  {
    code: "03",
    title: "Portfolio Tracker",
    desc: "Your complete P&L dashboard — positions, unrealised gains, realised profit and daily net worth movement.",
    accent: "--accent-gold",
  },
  {
    code: "04",
    title: "Strategy Backtesting",
    desc: "Run SMA Crossover, RSI, MACD, Bollinger Bands and more against years of historical data in seconds.",
    accent: "--accent-purple",
  },
  {
    code: "05",
    title: "Advanced Trading",
    desc: "Execute trades seamlessly and build your strategies with confidence at your own pace.",
    accent: "--accent-orange",
  },
];

/* ─── How it works ─── */
const STEPS = [
  { num: "01", title: "Create Your Account",  desc: "Sign up and fund your account instantly to start your journey." },
  { num: "02", title: "Explore the Market",   desc: "Browse NSE/BSE stocks, read charts, and organise instruments into watchlists." },
  { num: "03", title: "Execute Trades",   desc: "Buy and sell assets with precision. Track P&L, positions, and order history." },
  { num: "04", title: "Backtest Strategies",  desc: "Test your ideas on historical data. Find what works before executing." },
];

/* ─── Main component ─── */
export default function LandingPage() {
  const navigate = useNavigate();

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
      <section className="lp-hero">
        <div className="lp-hero-content">
          <div className="lp-hero-kicker">Paper trading for Indian markets</div>
          <h1 className="lp-hero-title">
            A clearer way to<br />practise trading.
          </h1>
          <p className="lp-hero-sub">
            Follow NSE instruments, test an idea, and understand every position without putting real capital at risk.
          </p>
          <div className="lp-hero-actions">
            <button className="lp-btn-primary lp-btn-lg" onClick={() => navigate("/login")}>
              Open your workspace
            </button>
            <button className="lp-btn-ghost lp-btn-lg" onClick={() => {
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }}>
              Explore the product
            </button>
          </div>
        </div>
        <div className="lp-product-frame" aria-label="Finoso product preview">
          <div className="lp-product-toolbar"><span>Workspace / Overview</span><span className="lp-market-state">Market closed</span></div>
          <div className="lp-product-summary">
            <div><small>Portfolio value</small><strong>₹12,47,832</strong><span className="pos">+2.48% this month</span></div>
            <div><small>Available cash</small><strong>₹4,18,250</strong><span>3 open positions</span></div>
          </div>
          <div className="lp-product-chart">
            <div className="lp-chart-header"><span>Portfolio performance</span><small>30 days</small></div>
            <svg viewBox="0 0 620 190" role="img" aria-label="Example portfolio chart">
              <path className="lp-chart-grid" d="M0 35H620M0 85H620M0 135H620" />
              <path className="lp-chart-line" d="M0 145 C55 138 64 107 112 116 S180 132 220 94 S286 88 330 101 S400 76 438 82 S502 43 548 55 S590 29 620 34" />
            </svg>
          </div>
          <div className="lp-product-rows">
            <span>RELIANCE <b>₹2,847.35</b><i className="pos">+1.50%</i></span>
            <span>TCS <b>₹3,921.50</b><i className="neg">−0.73%</i></span>
            <span>HDFCBANK <b>₹1,678.90</b><i className="pos">+1.42%</i></span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-section" id="features">
        <div className="lp-section-inner">
          <div className="lp-section-label">What you get</div>
          <h2 className="lp-section-title">Everything a serious trader needs</h2>
          <p className="lp-section-sub">One platform to learn, practise, and backtest in a highly intuitive environment.</p>

          <div className="lp-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="lp-feature-card">
                <div className="lp-feature-code">{f.code}</div>
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
          <p className="lp-cta-sub">Fast execution. Robust tracking. Just focused trading.</p>
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
            Platform strictly for demonstration. No real money involved.
          </div>
          <button className="lp-btn-ghost lp-footer-login" onClick={() => navigate("/login")}>
            Log In →
          </button>
        </div>
      </footer>
    </div>
  );
}


