import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import stockRoutes from "./routes/stocks.js";
import tradeRoutes from "./routes/trades.js";
import portfolioRoutes from "./routes/portfolio.js";
import watchlistRoutes from "./routes/watchlist.js";
import adminRoutes from "./routes/admin.js";
import backtestRoutes from "./routes/backtest.js";
import { initDatabase, testDatabaseConnection } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login/signup attempts. Please try again in 15 minutes." },
  standardHeaders: false,
  skip: (req) => req.method !== "POST",
});

const applyAuthLimiter = (req, res, next) => {
  if (req.path === "/login" || req.path === "/signup") {
    authLimiter(req, res, next);
  } else {
    next();
  }
};

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:5174",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());

app.use("/api/auth", applyAuthLimiter, authRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/backtest", backtestRoutes);

app.get("/api/health", (_, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

async function startServer() {
  try {
    await initDatabase();
    await testDatabaseConnection();
    console.log("✅ SQLite database connection successful");
    app.listen(PORT, () => {
      console.log(`🚀 Finoso backend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ SQLite database connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
