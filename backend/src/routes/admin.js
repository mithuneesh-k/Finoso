import express from "express";
import { query } from "../db.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, adminOnly);

router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await query(`SELECT COUNT(*) AS count FROM users WHERE LOWER(role) = 'investor'`);
    const activeUsers = await query(`SELECT COUNT(*) AS count FROM users WHERE LOWER(role) = 'investor' AND LOWER(status) = 'active'`);
    const totalTrades = await query(`SELECT COUNT(*) AS count FROM trades`);
    const totalVolume = await query(`SELECT COALESCE(SUM(total_amount),0) AS total FROM trades`);
    const newThisMonth = await query(`SELECT COUNT(*) AS count FROM users WHERE LOWER(role) = 'investor' AND created_at >= datetime('now', 'start of month')`);

    res.json({
      totalUsers: Number(totalUsers.rows[0].count),
      activeUsers: Number(activeUsers.rows[0].count),
      totalTrades: Number(totalTrades.rows[0].count),
      totalVolume: Number(totalVolume.rows[0].total || 0),
      newUsersThisMonth: Number(newThisMonth.rows[0].count),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/users", async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.email, u.role, u.status, u.created_at,
              ip.full_name AS name,
              w.available_balance AS balance,
              COALESCE((
                SELECT SUM((h.quantity * s.current_price) - (h.quantity * h.average_buy_price))
                FROM holdings h
                JOIN stocks s ON s.id = h.stock_id
                WHERE h.user_id = u.id
              ), 0) AS pnl,
              (SELECT COUNT(*) FROM trades t WHERE t.user_id = u.id) AS trades
       FROM users u
       LEFT JOIN investor_profiles ip ON ip.user_id = u.id
       LEFT JOIN wallets w ON w.user_id = u.id
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/users/:id/status", async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE users SET status = ? WHERE id = ? RETURNING id, email, role, status`,
      [String(req.body.status || "ACTIVE").toUpperCase(), req.params.id]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/trades", async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT t.id,
              t.side,
              CASE WHEN t.side = 'BUY' THEN 'BUY' ELSE 'SELL' END AS type,
              t.quantity,
              t.price,
              t.total_amount,
              t.executed_at,
              u.email,
              ip.full_name AS user_name,
              c.symbol,
              c.name AS company_name
       FROM trades t
       JOIN users u ON u.id = t.user_id
       LEFT JOIN investor_profiles ip ON ip.user_id = u.id
       LEFT JOIN stocks s ON s.id = t.stock_id
       LEFT JOIN companies c ON c.id = s.company_id
       ORDER BY t.executed_at DESC
       LIMIT 200`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
