import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppLayout from "../../components/AppLayout.jsx";
import BuySellModal from "../../components/BuySellModal.jsx";
import CandleChart from "../../components/CandleChart.jsx";
import { portfolioAPI } from "../../api/index.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMockStocks } from "../../data/mockStocks.js";

const FRAME_MS = { "1m": 60_000, "5m": 300_000, "15m": 900_000, "1D": 86_400_000 };
const fmt = (value, digits = 2) => Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const clockLabel = (date) => new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

function makeInitialCandles(price, interval = "1m", count = 72) {
  const now = Date.now();
  const duration = FRAME_MS[interval] || FRAME_MS["1m"];
  const basePrice = Number(price) || 100;
  let previousClose = basePrice * (1 + (Math.random() - 0.5) * 0.002);
  const candles = [];

  for (let i = 0; i < count; i += 1) {
    const progress = i / Math.max(count - 1, 1);
    const wave = Math.sin(progress * Math.PI * 3) * 0.003;
    const noise = (Math.random() - 0.5) * 0.0008;
    const open = previousClose;
    const close = Math.max(0.01, basePrice * (1 + wave + noise));
    const spread = basePrice * (0.00035 + Math.random() * 0.00065);
    const time = now - (count - 1 - i) * duration;
    candles.push({
      date: clockLabel(time),
      time,
      open,
      close,
      high: Math.max(open, close) + spread,
      low: Math.max(0.01, Math.min(open, close) - spread),
      volume: Math.floor(1500 + Math.random() * 14000),
    });
    previousClose = close;
  }
  return candles;
}

function calculateRsi(candles, period = 14) {
  const closes = candles.map((candle) => Number(candle.close)).filter(Number.isFinite);
  if (closes.length < 2) return 50;
  const changes = closes.slice(1).map((close, index) => close - closes[index]);
  const recent = changes.slice(-period);
  const gains = recent.reduce((sum, change) => sum + Math.max(change, 0), 0) / recent.length;
  const losses = recent.reduce((sum, change) => sum + Math.max(-change, 0), 0) / recent.length;
  if (losses === 0) return 100;
  return 100 - 100 / (1 + gains / losses);
}

export default function TradingTerminal() {
  const { addToWatchlist } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [candles, setCandles] = useState([]);
  const [interval, setIntervalValue] = useState("1m");
  const [search, setSearch] = useState("");
  const [panelTab, setPanelTab] = useState("watchlist");
  const [tradeType, setTradeType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const stockRef = useRef(null);
  const loadStocks = useCallback(async () => {
    try {
      const rows = getMockStocks();
      setStocks(Array.isArray(rows) ? rows : []);
      setSelectedSymbol((current) => current || rows?.[0]?.symbol || "");
      setFeedError("");
    } catch (error) {
      setFeedError(error.message || "Market feed unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStocks();
    const timer = setInterval(loadStocks, 3000);
    portfolioAPI.positions().then((rows) => setPositions(Array.isArray(rows) ? rows : [])).catch(() => setPositions([]));
    return () => clearInterval(timer);
  }, [loadStocks]);

  const selectedStock = stocks.find((stock) => stock.symbol === selectedSymbol) || null;
  stockRef.current = selectedStock;

  useEffect(() => {
    if (!selectedStock) return;
    setCandles(makeInitialCandles(selectedStock.price, interval));
  }, [selectedSymbol, interval]);

  useEffect(() => {
    const timer = setInterval(() => {
      const live = stockRef.current;
      if (!live) return;

      const now = Date.now();
      const bucket = Math.floor(now / FRAME_MS[interval]) * FRAME_MS[interval];
      const jitter = Number(live.price) * (Math.random() - 0.5) * 0.00045;
      const price = Math.max(0.01, Number(live.price) + jitter);
      setCandles((previous) => {
        if (!previous.length) return makeInitialCandles(price, interval);
        const last = previous[previous.length - 1];
        if (last.time === bucket) {
          const updated = { ...last, close: price, high: Math.max(last.high, price), low: Math.min(last.low, price), volume: last.volume + Math.floor(100 + Math.random() * 900) };
          return [...previous.slice(0, -1), updated];
        }
        return [...previous, { date: clockLabel(bucket), time: bucket, open: last.close, close: price, high: Math.max(last.close, price), low: Math.min(last.close, price), volume: Math.floor(500 + Math.random() * 5000) }].slice(-96);
      });
    }, 1500);
    return () => clearInterval(timer);
  }, [interval, selectedSymbol]);

  const searchedStocks = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return stocks;
    return stocks.filter((stock) => stock.symbol?.toLowerCase().includes(value) || stock.name?.toLowerCase().includes(value));
  }, [search, stocks]);

  const heldPositions = useMemo(() => positions.map((position) => {
    const stock = stocks.find((item) => item.symbol === position.symbol);
    const avgPrice = Number(position.avgPrice ?? position.avgprice) > 0
      ? Number(position.avgPrice ?? position.avgprice)
      : Number(position.totalInvested ?? position.total_invested) > 0 && Number(position.qty ?? position.quantity) > 0
        ? Number(position.totalInvested ?? position.total_invested) / Number(position.qty ?? position.quantity)
        : null;
    const qty = Number(position.qty ?? position.quantity ?? 0);
    return { ...position, qty, avgPrice, currentPrice: stock?.price ?? Number(position.currentPrice) ?? 0 };
  }), [positions, stocks]);
  const totalUnrealized = heldPositions.reduce((sum, position) => sum + (position.avgPrice === null ? 0 : (position.currentPrice - position.avgPrice) * Number(position.qty || 0)), 0);
  const chartChange = candles.length > 1 ? candles[candles.length - 1].close - candles[0].close : 0;
  const chartChangePct = candles[0]?.close ? (chartChange / candles[0].close) * 100 : 0;
  const rsiValue = calculateRsi(candles);
  const openTrade = (type, stock = selectedStock) => {
    if (stock) setTradeType(type);
  };

  return (
    <AppLayout title="Trading Terminal">
      <div className="page-body terminal-page">
        <div className="terminal-ticker" aria-label="Market ticker">
          <div className="terminal-search-wrap">
            <span aria-hidden="true">⌕</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search stocks, F&O, indices…" aria-label="Search stocks" />
          </div>
          <div className="terminal-market-status"><span className="live-dot" />MARKET<small>updates every 1.5 sec</small></div>
          <div className="terminal-index-strip">
            {stocks.slice(0, 4).map((stock) => (
              <button key={stock.symbol} onClick={() => setSelectedSymbol(stock.symbol)} className="terminal-index-chip">
                <span>{stock.symbol}</span><strong>₹{fmt(stock.price, 2)}</strong>
                <small className={stock.changePercent >= 0 ? "pos" : "neg"}>{stock.changePercent >= 0 ? "▲" : "▼"} {Math.abs(Number(stock.changePercent || 0)).toFixed(2)}%</small>
              </button>
            ))}
          </div>
        </div>

        {feedError && <div className="terminal-feed-error">Market feed reconnecting: {feedError}. Showing the last available quotes.</div>}

        <div className="trading-terminal-grid">
          <aside className="terminal-panel terminal-positions">
            <div className="terminal-panel-heading"><div><span className="terminal-grip">⠿</span> Positions</div><span className="terminal-count">{heldPositions.length}</span></div>
            <div className="terminal-pnl-box">
              <div className="terminal-muted-label">Equity &amp; F&amp;O positions</div>
              <strong className={totalUnrealized >= 0 ? "pos" : "neg"}>{totalUnrealized >= 0 ? "+" : "−"}₹{fmt(Math.abs(totalUnrealized), 2)}</strong>
              <span>Unrealized P&amp;L</span>
            </div>
            <div className="terminal-position-list">
              {loading ? <div className="terminal-empty">Loading positions…</div> : heldPositions.length === 0 ? (
                <div className="terminal-empty">No open positions yet.<br />Buy a stock to see it here.</div>
              ) : heldPositions.map((position) => {
                const pnl = position.avgPrice === null ? null : (position.currentPrice - position.avgPrice) * Number(position.qty || 0);
                return (
                  <button key={position.symbol} className={`terminal-position ${position.symbol === selectedSymbol ? "active" : ""}`} onClick={() => setSelectedSymbol(position.symbol)}>
                    <span><strong>{position.symbol}</strong><small>{position.qty} shares · Avg {position.avgPrice === null ? "—" : `₹${fmt(position.avgPrice, 2)}`}</small></span>
                    <b className={pnl === null ? "" : pnl >= 0 ? "pos" : "neg"}>{pnl === null ? "—" : `${pnl >= 0 ? "+" : "−"}₹${fmt(Math.abs(pnl), 0)}`}</b>
                  </button>
                );
              })}
            </div>
            <button className="terminal-outline-button" onClick={() => openTrade("BUY")}>＋ Place an order</button>
          </aside>

          <main className="terminal-center">
            {!selectedStock ? (
              <div className="terminal-panel terminal-no-stock">{loading ? "Loading market…" : "No stocks available in the market feed."}</div>
            ) : <>
              <section className="terminal-panel terminal-instrument">
                <div className="terminal-instrument-title">
                  <div className="terminal-symbol-mark">{selectedStock.symbol.slice(0, 1)}</div>
                  <div><div className="terminal-symbol-name">{selectedStock.symbol}<span className="terminal-exchange">NSE · EQ</span></div><small>{selectedStock.name} · {selectedStock.sector}</small></div>
                </div>
                <div className="terminal-price-block">
                  <strong>₹{fmt(selectedStock.price)}</strong>
                  <span className={selectedStock.changePercent >= 0 ? "pos" : "neg"}>{selectedStock.changePercent >= 0 ? "▲" : "▼"} ₹{fmt(Math.abs(Number(selectedStock.change || 0)))} ({Math.abs(Number(selectedStock.changePercent || 0)).toFixed(2)}%)</span>
                </div>
                <div className="terminal-instrument-actions">
                  <button className="btn btn-green btn-sm" onClick={() => openTrade("BUY")}>Buy</button>
                  <button className="btn btn-red btn-sm" onClick={() => openTrade("SELL")}>Sell</button>
                </div>
              </section>

              <section className="terminal-panel terminal-chart-panel">
                <div className="terminal-chart-toolbar">
                  <div className="terminal-chart-tool-title"><span>▥</span> {selectedStock.symbol} <span className="terminal-caret">⌄</span></div>
                  <div className="terminal-chart-tools">
                    {Object.keys(FRAME_MS).map((key) => <button key={key} className={interval === key ? "active" : ""} onClick={() => setIntervalValue(key)}>{key}</button>)}
                    <span className="terminal-toolbar-divider" />
                    <span title="Candlestick chart">▥</span><span title="Indicators">ƒx</span><span title="Chart settings">⚙</span>
                  </div>
                </div>
                <div className="terminal-chart-meta">
                  <div><span className="terminal-live-indicator"><i /> LIVE</span><span>O {fmt(candles.at(-1)?.open)} </span><span className="pos">H {fmt(candles.at(-1)?.high)} </span><span className="neg">L {fmt(candles.at(-1)?.low)} </span><span>C {fmt(candles.at(-1)?.close)}</span></div>
                  <span className={chartChangePct >= 0 ? "pos" : "neg"}>{chartChangePct >= 0 ? "+" : "−"}{Math.abs(chartChangePct).toFixed(2)}% session</span>
                </div>
                <div className="terminal-chart-canvas">
                  {candles.length ? <CandleChart data={candles} height={410} accent="#2563EB" prevClose={selectedStock.prevClose ?? null} /> : <div className="terminal-empty">Preparing live candles…</div>}
                </div>
                <div className="terminal-rsi">
                  <div><strong>RSI 14</strong><span>{rsiValue.toFixed(2)}</span><small>Live momentum</small></div>
                  <div className="terminal-rsi-track"><span style={{ width: `${rsiValue}%` }} /></div>
                  <div className="terminal-rsi-labels"><span>Oversold 30</span><span>Neutral 50</span><span>Overbought 70</span></div>
                </div>
                <div className="terminal-chart-footer"><span>Timeframe <b>{interval}</b></span><span>Exchange time · {clockLabel(Date.now())}</span><span>Prices in INR</span></div>
              </section>
            </>}
          </main>

          <aside className="terminal-panel terminal-market-panel">
            <div className="terminal-panel-heading"><div><span className="terminal-grip">⠿</span> Market watch</div><span className="terminal-live-indicator"><i /> LIVE</span></div>
            <div className="terminal-market-tabs">
              <button className={panelTab === "watchlist" ? "active" : ""} onClick={() => setPanelTab("watchlist")}>All stocks</button>
              <button className={panelTab === "gainers" ? "active" : ""} onClick={() => setPanelTab("gainers")}>Movers</button>
            </div>
            <div className="terminal-watchlist">
              {(panelTab === "gainers" ? [...searchedStocks].sort((a, b) => Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0)) : searchedStocks).map((stock) => (
                <button key={stock.symbol} className={`terminal-watch-row ${stock.symbol === selectedSymbol ? "active" : ""}`} onClick={() => setSelectedSymbol(stock.symbol)}>
                  <span className="terminal-watch-company"><strong>{stock.symbol}</strong><small>{stock.name}</small></span>
                  <span className="terminal-watch-quote"><strong>₹{fmt(stock.price)}</strong><small className={stock.changePercent >= 0 ? "pos" : "neg"}>{stock.changePercent >= 0 ? "+" : "−"}{Math.abs(Number(stock.changePercent || 0)).toFixed(2)}%</small></span>
                  <span className={`terminal-spark ${stock.changePercent >= 0 ? "up" : "down"}`}>{stock.changePercent >= 0 ? "⌁" : "⌁"}</span>
                </button>
              ))}
              {!searchedStocks.length && <div className="terminal-empty">No stocks match that search.</div>}
            </div>
            <div className="terminal-depth">
              <div className="terminal-depth-title"><strong>Market depth</strong><button onClick={() => addToWatchlist(selectedSymbol)}>＋ Watch</button></div>
              <div className="terminal-depth-head"><span>Bid qty</span><span>Bid price</span><span>Ask price</span><span>Ask qty</span></div>
              {[3, 2, 1, 0, -1].map((step) => {
                const price = Number(selectedStock?.price || 0);
                const bid = price - Math.max(price * 0.0005, 0.05) * (step + 1);
                const ask = price + Math.max(price * 0.0005, 0.05) * (step + 1);
                return <div className="terminal-depth-row" key={step}><span>{(1200 + step * 170).toLocaleString("en-IN")}</span><span className="pos">{fmt(bid)}</span><span className="neg">{fmt(ask)}</span><span>{(980 + step * 130).toLocaleString("en-IN")}</span></div>;
              })}
              <div className="terminal-depth-bar"><span /><i /></div>
              <div className="terminal-depth-foot"><span>Buyers 58%</span><span>Sellers 42%</span></div>
            </div>
          </aside>
        </div>
      </div>

      {tradeType && selectedStock && <BuySellModal stock={selectedStock} defaultType={tradeType} onClose={() => setTradeType(null)} onTradeSuccess={() => portfolioAPI.positions().then((rows) => setPositions(Array.isArray(rows) ? rows : [])).catch(() => {})} />}
    </AppLayout>
  );
}
