import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const hashPassword = async (password) => bcrypt.hash(password, 10);

export const comparePassword = async (password, hash) => bcrypt.compare(password, hash);

export const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET || "finoso-dev-secret", { expiresIn: "7d" });

export const sanitizeUser = (user) => {
  const rawWatchlist = user.watchlist;
  const watchlist = Array.isArray(rawWatchlist)
    ? rawWatchlist
    : typeof rawWatchlist === "string"
      ? rawWatchlist.split(",").map((item) => item.trim()).filter(Boolean)
      : [];

  return {
    id: user.id,
    email: user.email,
    name: user.name || user.full_name || user.email.split("@")[0],
    role: (user.role || "INVESTOR").toLowerCase(),
    status: (user.status || "ACTIVE").toLowerCase(),
    balance: Number(user.available_balance ?? 0),
    watchlist,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    avatarColor: user.avatar_color || "#00d4ff",
    pnl: Number(user.pnl ?? 0),
    trades: Number(user.trades ?? 0),
  };
};
