# Finoso

Finoso is a local-first paper-trading application for practising portfolio management with virtual funds. It provides a focused React interface, an Express API, JWT authentication, and a SQLite database.

The market screens use internally generated prices. The application does not present those prices as an exchange feed and does not execute financial transactions.

## What is implemented

### Investor experience

- Account registration and JWT-based sign-in
- Dashboard with cash, positions, portfolio value, P&L, and sector allocation
- Market workspace with generated NSE-style instruments and candlestick charts
- Buy and sell execution using virtual funds
- Portfolio holdings with weighted average purchase prices
- Watchlist management
- Order history and CSV export
- Strategy backtesting for SMA, EMA, RSI, MACD, Bollinger Bands, and support/resistance
- Profile, virtual balance, and portfolio-reset controls

### Admin experience

- Platform summary
- User listing and account activation/deactivation
- Platform-wide trade history

The interface intentionally excludes decorative platform statistics, leaderboard claims, price-alert workflows, and settings that do not persist.

## Technology

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, React Router 6 |
| Charts | Recharts |
| Backend | Node.js, Express |
| Database | SQLite through `sqlite` and `sqlite3` |
| Authentication | JWT and bcryptjs |
| Styling | Plain CSS with Manrope typography |

## Repository structure

```text
.
├── backend/
│   ├── data/finoso.db       # Local SQLite database
│   └── src/
│       ├── index.js         # Express application and route registration
│       ├── db.js            # Active schema and initial records
│       ├── middleware/      # Authentication and role checks
│       ├── routes/          # HTTP endpoints
│       └── services/        # Market and portfolio queries
├── frontend/
│   └── src/
│       ├── api/             # API client
│       ├── components/      # Layout, navigation, charts, and trade modal
│       ├── context/         # Authentication and account state
│       ├── data/            # Internal market-data generators
│       └── pages/           # Investor and admin screens
├── database/                # Older PostgreSQL schema reference; not used at runtime
├── package.json             # Root development commands
└── vercel.json              # Frontend build configuration
```

The files under `backend/src/models/`, `backend/src/seed.js`, and `database/` are remnants of earlier database approaches. The running application uses `backend/src/db.js` and `backend/data/finoso.db`.

## Requirements

- Node.js 18 or newer
- npm

No external database is required.

## Installation

From the repository root:

```bash
npm run install:all
```

## Environment

Create `backend/.env` if you need to override the defaults:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
```

For a separately hosted frontend, set:

```env
VITE_API_URL=https://your-api.example.com
```

Do not use the fallback JWT secret in a deployed environment.

## Run locally

Start both applications:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

The database schema and baseline records are created automatically when the backend starts with an empty database.

Default accounts created for an empty database:

| Role | Email | Password |
|---|---|---|
| Investor | `demo@finoso.mit` | `password123` |
| Admin | `admin@finoso.mit` | `admin123` |

Change or remove these accounts before exposing the application outside a development environment.

## Useful commands

```bash
# Run frontend and backend
npm run dev

# Run only the backend
npm run backend

# Run only the frontend
npm run frontend

# Create a production frontend build
npm run build --prefix frontend
```

## Main API surface

All endpoints except sign-in, registration, and health checks require a Bearer token.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/signup` | Create an investor account |
| `POST` | `/api/auth/login` | Authenticate and receive a JWT |
| `GET` | `/api/auth/me` | Restore the current session |
| `PATCH` | `/api/auth/profile` | Update account details or virtual balance |
| `POST` | `/api/auth/reset-portfolio` | Clear positions and trades |
| `GET` | `/api/stocks` | Read stored market instruments |
| `GET` | `/api/portfolio` | Read current holdings |
| `GET` | `/api/portfolio/equity` | Read the account equity series |
| `GET` | `/api/trades` | Read order history |
| `POST` | `/api/trades` | Execute a virtual buy or sell |
| `GET` | `/api/trades/export` | Export trades as CSV |
| `GET` | `/api/watchlist` | Read the watchlist |
| `POST` | `/api/watchlist/:symbol` | Add an instrument |
| `DELETE` | `/api/watchlist/:symbol` | Remove an instrument |
| `GET` | `/api/admin/stats` | Read platform totals as an admin |
| `GET` | `/api/admin/users` | List users as an admin |
| `PATCH` | `/api/admin/users/:id/status` | Change account status as an admin |
| `GET` | `/api/admin/trades` | List all trades as an admin |

## Data and trading behavior

- Prices shown in the investor interface are generated locally and refresh periodically.
- Trades are stored in SQLite and update the wallet and holdings tables.
- Orders currently execute immediately at the displayed price. There is no exchange matching engine, slippage model, delayed fill, or pending limit-order processor.
- Backtests run against generated historical series in the frontend. Results are educational illustrations, not investment evidence.
- Tokens are stored in browser `localStorage` under `finoso_token`.

## Current limitations

- There is no automated test suite yet.
- SQLite writes to a local file, so deployments require a persistent disk if account history must survive restarts.
- The frontend production bundle currently produces a Vite chunk-size warning and would benefit from route-level code splitting.
- Several older MongoDB/PostgreSQL files remain in the repository but are not part of the active runtime.
- This application is for education and demonstration only, not financial advice or brokerage use.
 
 
 
 
