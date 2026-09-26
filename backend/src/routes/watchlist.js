import express from "express";
import { query } from "../db.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const listWatchlist = async (userId) => {
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
};

router.get("/", protect, async (req, res) => {
  try {
    const watchlist = await listWatchlist(req.user.id);
    res.json(watchlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:symbol", protect, async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    const { rows } = await query(
      `SELECT s.id
       FROM stocks s
       JOIN companies c ON c.id = s.company_id
       WHERE c.symbol = $1`,
      [symbol]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: "Stock not found" });
    }

    const watchlistId = await query(
      `SELECT id FROM watchlists WHERE user_id = $1 LIMIT 1`,
      [req.user.id]
    );

    if (watchlistId.rowCount === 0) {
      const created = await query(`INSERT INTO watchlists (user_id, name) VALUES ($1, 'My Watchlist') RETURNING id`, [req.user.id]);
      const watchlistRowId = created.rows[0].id;
      await query(`INSERT INTO watchlist_items (watchlist_id, stock_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [watchlistRowId, rows[0].id]);
      return res.json({ watchlist: await listWatchlist(req.user.id) });
    }

    await query(
      `INSERT INTO watchlist_items (watchlist_id, stock_id)
       VALUES ($1, $2)
       ON CONFLICT (watchlist_id, stock_id) DO NOTHING`,
      [watchlistId.rows[0].id, rows[0].id]
    );

    res.json({ watchlist: await listWatchlist(req.user.id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:symbol", protect, async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    await query(
      `DELETE FROM watchlist_items
       WHERE watchlist_id = (SELECT id FROM watchlists WHERE user_id = $1 LIMIT 1)
         AND stock_id = (SELECT s.id FROM stocks s JOIN companies c ON c.id = s.company_id WHERE c.symbol = $1)`,
      [req.user.id, symbol]
    );
    res.json({ watchlist: await listWatchlist(req.user.id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
