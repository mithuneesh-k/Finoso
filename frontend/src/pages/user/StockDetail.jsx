import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ResponsiveContainer } from "recharts";
import AppLayout from "../../components/AppLayout.jsx";
import BuySellModal from "../../components/BuySellModal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMockStocks, getMockHistory } from "../../data/mockStocks.js";
import CandleChart from "../../components/CandleChart.jsx";

const PERIOD_DAYS = { "1W": 7, "1M": 30, "3M": 90, "1Y": 365 };

export default function StockDetail() {
  const { symbol }    = useParams();
  const navigate      = useNavigate();
  const { addToWatchlist, watchlist } = useAuth();

  const [stock,     setStock]     = useState(null);
  const [chart,     setChart]     = useState([]);
  const [period,    setPeriod]    = useState("3M");
  const [tradeType, setTradeType] = useState(null);
  const [loading,   setLoading]   = useState(true);

  const inWatchlist = watchlist.includes(symbol);

  useEffect(() => {
    const sym = symbol.toUpperCase();
    setLoading(true);

    const all = getMockStocks();
    const s = all.find((x) => x.symbol === sym) || all[0];
    setStock(s);
    setChart(getMockHistory(sym, period));
    setLoading(false);
  }, [symbol]);

  useEffect(() => {
    if (stock) {
      setChart(getMockHistory(symbol.toUpperCase(), period));
    }
  }, [period]);

  if (loading || !stock) return (
    <AppLayout title="Stock Detail">
      <div className="page-body" style={{ paddingTop: 40, textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>Loading {symbol}…</div>
      </div>
    </AppLayout>
  );

  const priceChange = chart.length > 1 ? chart[chart.length - 1].close - chart[0].close : 0;
  const pctChange   = chart.length > 1 && chart[0].close > 0 ? (priceChange / chart[0].close) * 100 : 0;
  const chartColor  = pctChange >= 0 ? "var(--accent-green)" : "var(--accent-red)";
  const minPrice    = chart.length ? Math.min(...chart.map((c) => c.close || c.value)) : 0;
  const maxPrice    = chart.length ? Math.max(...chart.map((c) => c.close || c.value)) : 0;

  return (
    <AppLayout title={`${stock.symbol} — ${stock.name}`}>
      <div className="page-body" style={{ paddingTop: 20 }}>

        {/* Back button */}
        <button className="btn btn-outline btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>
          ← Back
        </button>

        {/* Header card */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800 }}>{stock.symbol}</h1>
                <span className="badge badge-cyan">{stock.sector}</span>
                <span className="badge badge-muted">{stock.exchange || "NSE"}</span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 10 }}>{stock.name}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "2.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                ₹{stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                <span className={stock.changePercent >= 0 ? "pos" : "neg"} style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem" }}>
                  {stock.changePercent >= 0 ? "▲" : "▼"} ₹{Math.abs(stock.change).toFixed(2)} ({Math.abs(stock.changePercent).toFixed(2)}%)
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>Today</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignSelf: "flex-start" }}>
              <button className="btn btn-green" onClick={() => setTradeType("BUY")}>▲ Buy</button>
              <button className="btn btn-red" onClick={() => setTradeType("SELL")}>▼ Sell</button>
              <button
                className={`btn ${inWatchlist ? "btn-primary" : "btn-outline"}`}
                onClick={() => inWatchlist ? null : addToWatchlist(stock.symbol)}
              >
                {inWatchlist ? "★ Watching" : "☆ Watch"}
              </button>
            </div>
          </div>

          {/* Key stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: 10, marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
            {[
              ["Open",       `₹${stock.open?.toFixed(2) ?? "—"}`],
              ["Prev Close", `₹${stock.prevClose?.toFixed(2) ?? "—"}`],
              ["Day High",   `₹${stock.high?.toFixed(2) ?? "—"}`],
              ["Day Low",    `₹${stock.low?.toFixed(2) ?? "—"}`],
              ["52W High",   stock.week52High ? `₹${stock.week52High.toFixed(2)}` : "—"],
              ["52W Low",    stock.week52Low  ? `₹${stock.week52Low.toFixed(2)}`  : "—"],
              ["Volume",     stock.volume ?? "—"],
              ["Avg Volume", stock.avgVolume ?? "—"],
              ["Market Cap", stock.marketCap ?? "—"],
              ["P/E Ratio",  stock.pe ? stock.pe.toFixed(2) : "—"],
              ["EPS",        stock.eps ? `₹${stock.eps}` : "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 12px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>{k}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Price chart */}
        {(
          <div className="card">
            <div className="card-header" style={{ marginBottom: 12 }}>
              <div>
                <div className="card-title">Price History</div>
                <div className="card-subtitle" style={{ color: pctChange >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
                  {pctChange >= 0 ? "▲" : "▼"} {Math.abs(pctChange).toFixed(2)}% over period · Range ₹{minPrice.toFixed(0)} – ₹{maxPrice.toFixed(0)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["1W","1M","3M","1Y"].map((p) => (
                  <button key={p} className={`btn btn-sm ${period === p ? "btn-primary" : "btn-outline"}`} onClick={() => setPeriod(p)}>{p}</button>
                ))}
              </div>
            </div>
            <div className="chart-container" style={{ height: 420, background: "#fbfdff" }}>
              <ResponsiveContainer width="100%" height="100%">
                <CandleChart data={chart} height={420} accent={chartColor} prevClose={stock.prevClose ?? null} />
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>

      {tradeType && (
        <BuySellModal stock={stock} defaultType={tradeType} onClose={() => setTradeType(null)} />
      )}
    </AppLayout>
  );
}
