import express from "express";
import { query } from "../db.js";
import { protect } from "../middleware/auth.js";
import { signToken, comparePassword, hashPassword, sanitizeUser } from "../utils/auth.js";

const router = express.Router();

const WATCHLIST_SELECT = `
  COALESCE((
    SELECT GROUP_CONCAT(symbol)
    FROM (
      SELECT c.symbol
      FROM watchlist_items wi
      JOIN watchlists wl ON wl.id = wi.watchlist_id
      JOIN stocks s ON s.id = wi.stock_id
      JOIN companies c ON c.id = s.company_id
      WHERE wl.user_id = u.id
      ORDER BY c.symbol
    )
  ), '') AS watchlist
`;

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existing = await query("SELECT id FROM users WHERE email = $1", [String(email).toLowerCase()]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const userResult = await query(
      `INSERT INTO users (email, password_hash, role, status)
       VALUES ($1, $2, 'INVESTOR', 'ACTIVE')
       RETURNING id, email, role, status, created_at, updated_at`,
      [String(email).toLowerCase(), await hashPassword(password)]
    );

    const user = userResult.rows[0];
    await query(`INSERT INTO investor_profiles (user_id, full_name) VALUES ($1, $2)`, [user.id, String(name).trim()]);
    await query(
      `INSERT INTO wallets (user_id, available_balance, reserved_balance)
       VALUES ($1, $2, 0)`,
      [user.id, Number(process.env.INITIAL_VIRTUAL_BALANCE || 1000000)]
    );
    await query(`INSERT INTO watchlists (user_id, name) VALUES ($1, 'My Watchlist')`, [user.id]);

    const finalUser = await query(
      `SELECT u.id, u.email, u.role, u.status, u.created_at, u.updated_at,
              ip.full_name AS name,
              w.available_balance,
              ${WATCHLIST_SELECT}
       FROM users u
       LEFT JOIN investor_profiles ip ON ip.user_id = u.id
       LEFT JOIN wallets w ON w.user_id = u.id
       WHERE u.id = $1`,
      [user.id]
    );

    res.status(201).json({ token: signToken(user.id), user: sanitizeUser(finalUser.rows[0]) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const result = await query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.status, u.created_at, u.updated_at,
              ip.full_name AS name,
              w.available_balance,
              ${WATCHLIST_SELECT}
       FROM users u
       LEFT JOIN investor_profiles ip ON ip.user_id = u.id
       LEFT JOIN wallets w ON w.user_id = u.id
       WHERE u.email = $1`,
      [String(email).toLowerCase()]
    );

    const user = result.rows[0];
    if (!user || !(await comparePassword(password, user.password_hash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({ token: signToken(user.id), user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/me", protect, async (req, res) => {
  const result = await query(
    `SELECT u.id, u.email, u.role, u.status, u.created_at, u.updated_at,
            ip.full_name AS name,
            w.available_balance,
            ${WATCHLIST_SELECT}
     FROM users u
     LEFT JOIN investor_profiles ip ON ip.user_id = u.id
     LEFT JOIN wallets w ON w.user_id = u.id
     WHERE u.id = $1`,
    [req.user.id]
  );

  if (!result.rowCount) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({ user: sanitizeUser(result.rows[0]) });
});

router.patch("/profile", protect, async (req, res) => {
  const { name, email, currentPassword, newPassword, balance, avatarColor } = req.body;

  try {
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to set a new password" });
      }
      const current = await query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
      if (!current.rowCount || !(await comparePassword(currentPassword, current.rows[0].password_hash))) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      const passwordHash = await hashPassword(newPassword);
      await query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, req.user.id]);
    }

    if (name) {
      await query("UPDATE investor_profiles SET full_name = $1 WHERE user_id = $2", [String(name).trim(), req.user.id]);
    }

    if (email) {
      const exists = await query("SELECT id FROM users WHERE email = $1 AND id <> $2", [String(email).toLowerCase(), req.user.id]);
      if (exists.rowCount > 0) {
        return res.status(409).json({ message: "Email already in use" });
      }
      await query("UPDATE users SET email = $1 WHERE id = $2", [String(email).toLowerCase(), req.user.id]);
    }

    if (balance !== undefined && balance !== null) {
      const val = Number(balance);
      if (Number.isNaN(val) || val < 0) {
        return res.status(400).json({ message: "Invalid balance" });
      }
      await query("UPDATE wallets SET available_balance = $1 WHERE user_id = $2", [val, req.user.id]);
    }

    if (avatarColor) {
      // avatarColor is kept in the frontend state; the database schema does not use it.
    }

    const result = await query(
      `SELECT u.id, u.email, u.role, u.status, u.created_at, u.updated_at,
              ip.full_name AS name,
              w.available_balance,
              ${WATCHLIST_SELECT}
       FROM users u
       LEFT JOIN investor_profiles ip ON ip.user_id = u.id
       LEFT JOIN wallets w ON w.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    res.json({ user: sanitizeUser(result.rows[0]) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/reset-portfolio", protect, async (req, res) => {
  try {
    const freshBalance = Number(req.body.balance) || Number(process.env.INITIAL_VIRTUAL_BALANCE || 1000000);
    await query("UPDATE wallets SET available_balance = $1, reserved_balance = 0 WHERE user_id = $2", [freshBalance, req.user.id]);
    await query("DELETE FROM holdings WHERE user_id = $1", [req.user.id]);
    await query("DELETE FROM orders WHERE user_id = $1", [req.user.id]);
    await query("DELETE FROM trades WHERE user_id = $1", [req.user.id]);
    await query("DELETE FROM watchlist_items WHERE watchlist_id IN (SELECT id FROM watchlists WHERE user_id = $1)", [req.user.id]);
    res.json({ message: "Portfolio reset successfully", balance: freshBalance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
