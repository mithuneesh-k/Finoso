import express from "express";
import { protect } from "../middleware/auth.js";
import { getMarketStocks, getMarketIndices, getSingleStock, getStockHistory } from "../services/market.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const rows = await getMarketStocks();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to load stocks", error: error.message });
  }
});

router.get("/indices", protect, async (req, res) => {
  try {
    const rows = await getMarketIndices();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to load indices", error: error.message });
  }
});

router.get("/:symbol", protect, async (req, res) => {
  try {
    const stock = await getSingleStock(req.params.symbol);
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stock", error: error.message });
  }
});

router.get("/:symbol/history", protect, async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const period = String(req.query.period || "3M");
    const history = await getStockHistory(symbol, period);
    if (history.length === 0) {
      const base = await getSingleStock(symbol);
      const seed = [];
      const now = Date.now();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        const price = (base?.price || 100) * (1 + ((i % 5) - 2) * 0.01 + Math.sin(i / 4) * 0.015);
        seed.push({
          date: date.toISOString().slice(0, 10),
          open: Number((price * 0.995).toFixed(2)),
          high: Number((price * 1.01).toFixed(2)),
          low: Number((price * 0.985).toFixed(2)),
          close: Number(price.toFixed(2)),
          volume: 5000 + i * 100,
        });
      }
      return res.json(seed);
    }
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stock history", error: error.message });
  }
});

router.get("/:symbol/news", protect, async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const headline = `${symbol} market update`;
    res.json([
      { title: `${headline}: momentum remains active`, publisher: "Finoso Desk", link: `#${symbol}`, time: new Date().toISOString(), thumbnail: null },
      { title: `${symbol} enters a key watchlist range`, publisher: "Market Pulse", link: `#${symbol}-watch`, time: new Date(Date.now() - 3600000).toISOString(), thumbnail: null },
      { title: `${symbol} volume and sentiment trend higher`, publisher: "TradeLab", link: `#${symbol}-volume`, time: new Date(Date.now() - 7200000).toISOString(), thumbnail: null },
    ]);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch news", error: error.message });
  }
});

export default router;
