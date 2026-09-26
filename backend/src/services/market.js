import { query } from "../db.js";

const defaultStocks = [
  { symbol: "TCS", name: "Tata Consultancy Services", sector: "IT" },
  { symbol: "INFY", name: "Infosys", sector: "IT" },
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy" },
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking" },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Banking" },
  { symbol: "SBIN", name: "State Bank of India", sector: "Banking" },
  { symbol: "ITC", name: "ITC", sector: "FMCG" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", sector: "Telecommunications" },
  { symbol: "SUNPHARMA", name: "Sun Pharma", sector: "Pharmaceuticals" },
  { symbol: "MARUTI", name: "Maruti Suzuki", sector: "Automobile" },
];

export async function getMarketStocks() {
  const { rows } = await query(`
    SELECT c.symbol, c.name, c.sector,
           s.current_price AS price,
           s.previous_close AS prev_close,
           s.day_open AS open_price,
           s.day_high AS high,
           s.day_low AS low,
           s.volatility,
           s.trend_bias,
           s.is_trading_enabled,
           s.available_simulated_shares,
           s.total_simulated_shares,
           s.current_price - s.previous_close AS change,
           ((s.current_price - s.previous_close) / NULLIF(s.previous_close, 0)) * 100 AS change_percent,
           (s.current_price * s.total_simulated_shares) AS market_cap
    FROM companies c
    JOIN stocks s ON s.company_id = c.id
    ORDER BY c.symbol ASC
  `);

  return rows.map((row) => ({
    symbol: row.symbol,
    name: row.name,
    sector: row.sector || "Other",
    price: Number(row.price),
    change: Number(row.change || 0),
    changePercent: Number(row.change_percent || 0),
    open: Number(row.open_price || 0),
    high: Number(row.high || 0),
    low: Number(row.low || 0),
    prevClose: Number(row.prev_close || 0),
    volume: `${Math.round((Number(row.total_simulated_shares || 0) / 1000000) * 10)}M`,
    marketCap: row.market_cap ? `₹${Number(row.market_cap).toLocaleString("en-IN")}` : "N/A",
    currency: "INR",
    exchange: "NSE",
    availableShares: Number(row.available_simulated_shares || 0),
    isTradingEnabled: row.is_trading_enabled,
  }));
}

export async function getSingleStock(symbol) {
  const stocks = await getMarketStocks();
  const match = stocks.find((s) => s.symbol === symbol.toUpperCase());
  if (match) return match;

  const fallback = defaultStocks.find((s) => s.symbol === symbol.toUpperCase());
  if (!fallback) return null;

  return {
    ...fallback,
    price: 0,
    change: 0,
    changePercent: 0,
    open: 0,
    high: 0,
    low: 0,
    prevClose: 0,
    volume: "N/A",
    marketCap: "N/A",
    currency: "INR",
    exchange: "NSE",
    isTradingEnabled: false,
  };
}

export async function getMarketIndices() {
  const { rows } = await query(`
    SELECT 'NIFTY 50' AS name, 21500.75 AS value, 1.36 AS change_percent
    UNION ALL
    SELECT 'SENSEX', 71250.2, 0.92
    UNION ALL
    SELECT 'NIFTY BANK', 46380.6, 1.14
  `);
  return rows;
}

export async function getStockHistory(symbol, period = "3M") {
  const row = await query(
    `SELECT symbol FROM companies WHERE symbol = $1`,
    [symbol.toUpperCase()]
  );
  if (row.rowCount === 0) return [];

  const { rows } = await query(
    `SELECT s.symbol, c.candle_time AS date, c.close_price AS close, c.open_price AS open,
            c.high_price AS high, c.low_price AS low, c.volume
     FROM price_candles c
     JOIN stocks st ON st.id = c.stock_id
     JOIN companies s ON s.id = st.company_id
     WHERE s.symbol = $1
     ORDER BY c.candle_time DESC
     LIMIT 40`,
    [symbol.toUpperCase()]
  );

  return rows
    .slice()
    .reverse()
    .map((row) => ({
      date: new Date(row.date).toISOString().slice(0, 10),
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume || 0),
    }));
}
