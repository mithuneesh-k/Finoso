import jwt from "jsonwebtoken";
import { query } from "../db.js";

export const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET || "finoso-dev-secret");
    const { rows } = await query(
      `SELECT u.id, u.email, u.role, u.status,
              ip.full_name AS name,
              w.available_balance AS balance
       FROM users u
       LEFT JOIN investor_profiles ip ON ip.user_id = u.id
       LEFT JOIN wallets w ON w.user_id = u.id
       WHERE u.id = ?`,
      [decoded.id]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      ...user,
      role: String(user.role || "INVESTOR").toLowerCase(),
    };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.user || String(req.user.role).toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};
