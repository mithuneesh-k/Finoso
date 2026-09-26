import { query } from "../db.js";

export async function getUserPortfolio(userId) {
  const { rows } = await query(
    `SELECT h.id, c.symbol, c.name, h.quantity, h.average_buy_price AS avgPrice,
            s.current_price AS currentPrice, 
            (h.quantity * s.current_price) AS value,
            ((h.quantity * s.current_price) - (h.quantity * h.average_buy_price)) AS pnl,
            ((s.current_price - h.average_buy_price) / NULLIF(h.average_buy_price,0)) * 100 AS pnlPercent,
            c.sector
     FROM holdings h
     JOIN stocks s ON s.id = h.stock_id
     JOIN companies c ON c.id = s.company_id
     WHERE h.user_id = $1 AND h.quantity > 0
     ORDER BY c.symbol`,
    [userId]
  );

  return rows.map((row) => ({
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    qty: Number(row.quantity),
    avgPrice: Number(row.avgprice),
    currentPrice: Number(row.currentprice),
    value: Number(row.value),
    pnl: Number(row.pnl),
    pnlPercent: Number(row.pnlpercent),
    sector: row.sector,
  }));
}

export async function getUserBalance(userId) {
  const { rows } = await query(
    `SELECT available_balance AS balance
     FROM wallets
     WHERE user_id = $1`,
    [userId]
  );
  return rows[0]?.balance != null ? Number(rows[0].balance) : 0;
}

export async function getUserWatchlist(userId) {
  const { rows } = await query(
    `SELECT c.symbol
     FROM watchlist_items wi
     JOIN watchlists w ON w.id = wi.watchlist_id
     JOIN stocks s ON s.id = wi.stock_id
     JOIN companies c ON c.id = s.company_id
     WHERE w.user_id = $1
     ORDER BY c.symbol`,
    [userId]
  );
  return rows.map((row) => row.symbol);
}

export async function getUserSummary(userId) {
  const portfolio = await getUserPortfolio(userId);
  const balance = await getUserBalance(userId);
  const totalInvested = portfolio.reduce((sum, p) => sum + (p.avgPrice * p.qty), 0);
  const totalValue = portfolio.reduce((sum, p) => sum + p.value, 0);
  const totalPnl = portfolio.reduce((sum, p) => sum + p.pnl, 0);

  return {
    balance,
    totalInvested,
    totalValue,
    totalPnl,
    positions: portfolio.length,
  };
}
