import express from "express";
import { query } from "../db.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT t.id, c.symbol, c.name, t.side AS type, t.quantity AS qty, t.price, t.total_amount AS total,
              t.status, t.created_at AS "createdAt"
       FROM trades t
       JOIN stocks s ON s.id = t.stock_id
       JOIN companies c ON c.id = s.company_id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/export", protect, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT c.symbol, t.side AS type, t.quantity AS qty, t.price, t.total_amount AS total, t.status, t.executed_at
       FROM trades t
       JOIN stocks s ON s.id = t.stock_id
       JOIN companies c ON c.id = s.company_id
       WHERE t.user_id = $1
       ORDER BY t.executed_at DESC`,
      [req.user.id]
    );
    const header = "Symbol,Type,Qty,Price,Total,Status,Date";
    const csv = [header].concat(rows.map((r) => [r.symbol, r.type, r.qty, Number(r.price).toFixed(2), Number(r.total).toFixed(2), r.status, new Date(r.executed_at).toISOString().slice(0, 10)].join(","))).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=trades.csv");
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, async (req, res) => {
  const { symbol, name, type, qty, price, orderType = "MARKET", sector } = req.body;
  if (!symbol || !type || !qty || !price) {
    return res.status(400).json({ message: "symbol, type, qty, price are required" });
  }

  try {
    const side = String(type).toUpperCase();
    const quantity = Number(qty);
    const unitPrice = Number(price);
    const total = Number((quantity * unitPrice).toFixed(2));

    const stockResult = await query(
      `SELECT s.id, s.current_price, c.symbol, c.name, c.sector
       FROM stocks s
       JOIN companies c ON c.id = s.company_id
       WHERE c.symbol = $1`,
      [String(symbol).toUpperCase()]
    );

    if (!stockResult.rowCount) {
      return res.status(404).json({ message: "Stock not found" });
    }

    const stock = stockResult.rows[0];
    const wallet = await query(`SELECT available_balance FROM wallets WHERE user_id = $1`, [req.user.id]);
    const balance = Number(wallet.rows[0]?.available_balance || 0);

    if (side === "BUY") {
      if (balance < total) {
        return res.status(400).json({ message: "Insufficient funds" });
      }
    }

    if (side === "SELL") {
      const holdings = await query(
        `SELECT quantity, average_buy_price FROM holdings WHERE user_id = $1 AND stock_id = $2`,
        [req.user.id, stock.id]
      );
      if (!holdings.rowCount || Number(holdings.rows[0].quantity) < quantity) {
        return res.status(400).json({ message: `Not enough shares — you hold ${holdings.rows[0]?.quantity ?? 0}` });
      }
    }

    const orderResult = await query(
      `INSERT INTO orders (user_id, stock_id, side, order_type, quantity, requested_price, execution_price, status, estimated_amount, executed_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'FILLED', ?, ?)
       RETURNING id`,
      [req.user.id, stock.id, side, String(orderType).toUpperCase(), quantity, unitPrice, unitPrice, total, total]
    );

    const orderId = orderResult.rows[0].id;

    if (side === "BUY") {
      await query(
        `UPDATE wallets SET available_balance = available_balance - $1 WHERE user_id = $2`,
        [total, req.user.id]
      );

      const holding = await query(
        `SELECT * FROM holdings WHERE user_id = $1 AND stock_id = $2`,
        [req.user.id, stock.id]
      );

      if (holding.rowCount > 0) {
        await query(
          `UPDATE holdings
           SET quantity = quantity + ?,
               average_buy_price = ((average_buy_price * quantity) + (? * ?)) / (quantity + ?),
               total_invested = total_invested + ? * ?,
               updated_at = datetime('now')
           WHERE user_id = ? AND stock_id = ?`,
          [quantity, unitPrice, quantity, quantity, unitPrice, quantity, req.user.id, stock.id]
        );
      } else {
        await query(
          `INSERT INTO holdings (user_id, stock_id, quantity, average_buy_price, total_invested)
           VALUES (?, ?, ?, ?, ?)`,
          [req.user.id, stock.id, quantity, unitPrice, total]
        );
      }
    } else {
      await query(
        `UPDATE wallets SET available_balance = available_balance + $1 WHERE user_id = $2`,
        [total, req.user.id]
      );

      await query(
        `UPDATE holdings
         SET quantity = quantity - ?,
             total_invested = total_invested - (? * average_buy_price),
             updated_at = datetime('now')
         WHERE user_id = ? AND stock_id = ?`,
        [quantity, quantity, req.user.id, stock.id]
      );

      await query(
        `DELETE FROM holdings WHERE user_id = ? AND stock_id = ? AND quantity <= 0`,
        [req.user.id, stock.id]
      );
    }

    const trade = await query(
      `INSERT INTO trades (order_id, user_id, stock_id, side, quantity, price, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [orderId, req.user.id, stock.id, side, quantity, unitPrice, total]
    );

    await query(
      `UPDATE stocks SET current_price = ?, previous_close = previous_close, updated_at = datetime('now') WHERE id = ?`,
      [unitPrice, stock.id]
    );

    const { rows: walletRows } = await query(`SELECT available_balance FROM wallets WHERE user_id = $1`, [req.user.id]);
    res.status(201).json({ trade: trade.rows[0], balance: Number(walletRows[0]?.available_balance || 0) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
