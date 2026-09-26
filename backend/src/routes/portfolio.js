import express from "express";
import { query } from "../db.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const { rows } = await query(
            `SELECT h.id, c.symbol, c.name, h.quantity AS qty, h.average_buy_price AS avg_price, h.total_invested AS total_invested,
              s.current_price AS current_price,
              (h.quantity * s.current_price) AS value,
              ((h.quantity * s.current_price) - (h.quantity * h.average_buy_price)) AS pnl,
              c.sector
       FROM holdings h
       JOIN stocks s ON s.id = h.stock_id
       JOIN companies c ON c.id = s.company_id
       WHERE h.user_id = $1 AND h.quantity > 0
       ORDER BY c.symbol`,
      [req.user.id]
    );
    res.json(rows.map((row) => {
      const qty = Number(row.qty) || 0;
      const value = Number(row.value) || 0;
      const pnl = Number(row.pnl) || 0;
      const totalInvested = Number(row.total_invested) || Math.max(value - pnl, 0);
      const avgPrice = Number(row.avg_price) || (qty > 0 ? totalInvested / qty : 0);
      return {
        id: row.id,
        symbol: row.symbol,
        name: row.name,
        qty,
        avgPrice,
        totalInvested,
        currentPrice: Number(row.current_price) || (qty > 0 ? value / qty : 0),
        value,
        pnl,
        sector: row.sector,
      };
    }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/equity", protect, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    const { rows } = await query(
      `SELECT DATE(t.executed_at) AS date,
              SUM(CASE WHEN t.side = 'BUY' THEN -t.total_amount ELSE t.total_amount END) AS delta
       FROM trades t
       WHERE t.user_id = ? AND t.executed_at >= datetime('now', '-' || ? || ' days')
       GROUP BY DATE(t.executed_at)
       ORDER BY date`,
      [req.user.id, days]
    );

    const base = Number((await query(`SELECT available_balance FROM wallets WHERE user_id = $1`, [req.user.id])).rows[0]?.available_balance || 0);
    const result = [];
    let running = base;
    const today = new Date();

    for (let i = days; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const delta = rows.find((r) => r.date === key)?.delta || 0;
      running += Number(delta || 0);
      result.push({ date: key, value: Number(running.toFixed(2)) });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/stats", protect, async (req, res) => {
  try {
    const wallet = await query(`SELECT available_balance AS balance FROM wallets WHERE user_id = ?`, [req.user.id]);
    const today = await query(
      `SELECT SUM(CASE WHEN side = 'BUY' THEN 1 ELSE 0 END) AS buy_count,
              SUM(CASE WHEN side = 'SELL' THEN 1 ELSE 0 END) AS sell_count,
              COALESCE(SUM(CASE WHEN side = 'SELL' THEN total_amount ELSE -total_amount END), 0) AS day_pnl,
              COUNT(*) AS total_trades
       FROM trades
       WHERE user_id = ? AND executed_at >= datetime('now', 'start of day')`,
      [req.user.id]
    );

    const holdings = await query(`SELECT COALESCE(SUM((quantity * current_price)), 0) AS total_value FROM holdings h JOIN stocks s ON s.id = h.stock_id WHERE h.user_id = ?`, [req.user.id]);
    const pnl = await query(`SELECT COALESCE(SUM(((h.quantity * s.current_price) - (h.quantity * h.average_buy_price))), 0) AS pnl FROM holdings h JOIN stocks s ON s.id = h.stock_id WHERE h.user_id = ?`, [req.user.id]);

    res.json({
      dayPnl: Number(today.rows[0]?.day_pnl || 0),
      buyCount: Number(today.rows[0]?.buy_count || 0),
      sellCount: Number(today.rows[0]?.sell_count || 0),
      totalTrades: Number(today.rows[0]?.total_trades || 0),
      balance: Number(wallet.rows[0]?.balance || 0),
      pnl: Number(pnl.rows[0]?.pnl || 0),
      portfolioValue: Number(holdings.rows[0]?.total_value || 0),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
