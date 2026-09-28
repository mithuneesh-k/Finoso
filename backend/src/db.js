import pg from 'pg';
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const { Pool } = pg;

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(sql, params = []) {
  const result = await db.query(sql, params);
  return result;
}

export async function queryAll(sql, params = []) {
  const result = await db.query(sql, params);
  return result.rows;
}

export async function queryOne(sql, params = []) {
  const result = await db.query(sql, params);
  return result.rows[0];
}

export async function initDatabase() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'INVESTOR',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS investor_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      phone TEXT,
      city TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      available_balance REAL NOT NULL DEFAULT 0,
      reserved_balance REAL NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL UNIQUE,
      sector TEXT NOT NULL,
      description TEXT,
      logo_url TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stocks (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL UNIQUE,
      current_price REAL NOT NULL,
      previous_close REAL NOT NULL,
      day_open REAL NOT NULL,
      day_high REAL NOT NULL,
      day_low REAL NOT NULL,
      base_price REAL NOT NULL,
      volatility REAL NOT NULL DEFAULT 0.005,
      trend_bias REAL NOT NULL DEFAULT 0,
      total_simulated_shares INTEGER NOT NULL DEFAULT 0,
      available_simulated_shares INTEGER NOT NULL DEFAULT 0,
      is_trading_enabled INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS price_candles (
      id SERIAL PRIMARY KEY,
      stock_id TEXT NOT NULL,
      interval_type TEXT NOT NULL DEFAULT '1M',
      candle_time TIMESTAMP NOT NULL,
      open_price REAL NOT NULL,
      high_price REAL NOT NULL,
      low_price REAL NOT NULL,
      close_price REAL NOT NULL,
      volume INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(stock_id, interval_type, candle_time),
      FOREIGN KEY(stock_id) REFERENCES stocks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS watchlists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT 'My Watchlist',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS watchlist_items (
      id TEXT PRIMARY KEY,
      watchlist_id TEXT NOT NULL,
      stock_id TEXT NOT NULL,
      added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(watchlist_id, stock_id),
      FOREIGN KEY(watchlist_id) REFERENCES watchlists(id) ON DELETE CASCADE,
      FOREIGN KEY(stock_id) REFERENCES stocks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS holdings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      stock_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      average_buy_price REAL NOT NULL DEFAULT 0,
      total_invested REAL NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, stock_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(stock_id) REFERENCES stocks(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      stock_id TEXT NOT NULL,
      side TEXT NOT NULL CHECK(side IN ('BUY','SELL')),
      order_type TEXT NOT NULL CHECK(order_type IN ('MARKET','LIMIT')),
      quantity INTEGER NOT NULL,
      requested_price REAL,
      execution_price REAL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      estimated_amount REAL NOT NULL DEFAULT 0,
      executed_amount REAL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      executed_at TIMESTAMP,
      cancelled_at TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(stock_id) REFERENCES stocks(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      user_id TEXT NOT NULL,
      stock_id TEXT NOT NULL,
      side TEXT NOT NULL CHECK(side IN ('BUY','SELL')),
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      total_amount REAL NOT NULL,
      executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE RESTRICT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(stock_id) REFERENCES stocks(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS price_alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      name TEXT,
      target_price REAL NOT NULL,
      condition TEXT NOT NULL CHECK(condition IN ('above','below')),
      active INTEGER NOT NULL DEFAULT 1,
      triggered INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      triggered_at TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS market_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      event_type TEXT NOT NULL,
      impact_percent REAL NOT NULL DEFAULT 0,
      sector TEXT,
      stock_id TEXT,
      starts_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ends_at TIMESTAMP,
      created_by TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(stock_id) REFERENCES stocks(id) ON DELETE SET NULL,
      FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      metadata TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  const companyCount = await queryOne(`SELECT COUNT(*) AS count FROM companies`);
  if (parseInt(companyCount?.count || 0) === 0) {
    const seedCompanies = [
      ["TCS", "Tata Consultancy Services", "IT"],
      ["INFY", "Infosys", "IT"],
      ["RELIANCE", "Reliance Industries", "Energy"],
      ["HDFCBANK", "HDFC Bank", "Banking"],
      ["ICICIBANK", "ICICI Bank", "Banking"],
      ["SBIN", "State Bank of India", "Banking"],
      ["ITC", "ITC", "FMCG"],
      ["BHARTIARTL", "Bharti Airtel", "Telecommunications"],
      ["SUNPHARMA", "Sun Pharma", "Pharmaceuticals"],
      ["MARUTI", "Maruti Suzuki", "Automobile"],
    ];

    const priceMap = {
      TCS: 3450,
      INFY: 1620,
      RELIANCE: 2865,
      HDFCBANK: 1720,
      ICICIBANK: 1195,
      SBIN: 850,
      ITC: 460,
      BHARTIARTL: 1205,
      SUNPHARMA: 1430,
      MARUTI: 9750,
    };

    for (const [symbol, name, sector] of seedCompanies) {
      const companyId = crypto.randomUUID();
      const current = priceMap[symbol] || 100;
      const stockId = crypto.randomUUID();

      await db.query(
        `INSERT INTO companies (id, name, symbol, sector, description, is_active)
         VALUES ($1, $2, $3, $4, $5, 1)`,
        [companyId, name, symbol, sector, `${name} demo company`]
      );

      await db.query(
        `INSERT INTO stocks (id, company_id, current_price, previous_close, day_open, day_high, day_low, base_price, volatility, trend_bias, total_simulated_shares, available_simulated_shares, is_trading_enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0.008, 0.0005, 1000000, 1000000, 1)`,
        [stockId, companyId, current, current * 0.99, current * 0.995, current * 1.02, current * 0.98, current]
      );
    }
  }

  const userCount = await queryOne(`SELECT COUNT(*) AS count FROM users`);
  if (parseInt(userCount?.count || 0) === 0) {
    const adminId = crypto.randomUUID();
    const demoId = crypto.randomUUID();
    const adminHash = await import("bcryptjs").then((m) => m.default.hash("admin123", 10));
    const demoHash = await import("bcryptjs").then((m) => m.default.hash("password123", 10));

    await db.query(
      `INSERT INTO users (id, email, password_hash, role, status) VALUES ($1, $2, $3, 'ADMIN', 'ACTIVE')`,
      [adminId, "admin@finoso.mit", adminHash]
    );
    await db.query(
      `INSERT INTO investor_profiles (id, user_id, full_name) VALUES ($1, $2, $3)`,
      [crypto.randomUUID(), adminId, "Admin User"]
    );
    await db.query(
      `INSERT INTO wallets (id, user_id, available_balance, reserved_balance) VALUES ($1, $2, 0, 0)`,
      [crypto.randomUUID(), adminId]
    );

    await db.query(
      `INSERT INTO users (id, email, password_hash, role, status) VALUES ($1, $2, $3, 'INVESTOR', 'ACTIVE')`,
      [demoId, "demo@finoso.mit", demoHash]
    );
    await db.query(
      `INSERT INTO investor_profiles (id, user_id, full_name) VALUES ($1, $2, $3)`,
      [crypto.randomUUID(), demoId, "Demo Investor"]
    );
    await db.query(
      `INSERT INTO wallets (id, user_id, available_balance, reserved_balance) VALUES ($1, $2, 1000000, 0)`,
      [crypto.randomUUID(), demoId]
    );

    const tcs = await queryOne(`SELECT s.id FROM stocks s JOIN companies c ON c.id = s.company_id WHERE c.symbol = 'TCS'`);
    const infy = await queryOne(`SELECT s.id FROM stocks s JOIN companies c ON c.id = s.company_id WHERE c.symbol = 'INFY'`);
    if (tcs && infy) {
      const watchlistId = crypto.randomUUID();
      await db.query(`INSERT INTO watchlists (id, user_id, name) VALUES ($1, $2, $3)`, [watchlistId, demoId, "My Watchlist"]);
      await db.query(`INSERT INTO watchlist_items (id, watchlist_id, stock_id) VALUES ($1, $2, $3)`, [crypto.randomUUID(), watchlistId, tcs.id]);
      await db.query(`INSERT INTO watchlist_items (id, watchlist_id, stock_id) VALUES ($1, $2, $3)`, [crypto.randomUUID(), watchlistId, infy.id]);
    }
  }
}

export async function testDatabaseConnection() {
  await db.query("SELECT 1 AS ok");
  return true;
}
