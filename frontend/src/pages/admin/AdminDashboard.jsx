import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import AppLayout from "../../components/AppLayout.jsx";
import { adminAPI } from "../../api/index.js";

const buildMarketChart = (tradeRows = []) => {
  const base = [
    { label: "Mon", value: 18400 },
    { label: "Tue", value: 18850 },
    { label: "Wed", value: 18320 },
    { label: "Thu", value: 19180 },
    { label: "Fri", value: 19740 },
    { label: "Sat", value: 19530 },
    { label: "Sun", value: 20140 },
  ];

  const tradeVolume = tradeRows.reduce((acc, row) => {
    const date = new Date(row.executed_at || Date.now());
    const dayIndex = date.getDay();
    if (dayIndex >= 0 && dayIndex < base.length) {
      acc[dayIndex] = (acc[dayIndex] || 0) + Number(row.total_amount || 0);
    }
    return acc;
  }, [0, 0, 0, 0, 0, 0, 0]);

  return base.map((point, index) => ({
    ...point,
    value: Math.round((point.value + (tradeVolume[index] || 0) / 8500) * 10) / 10,
    volume: Math.round((tradeVolume[index] || 0) / 1000),
  }));
};

const buildDailyTrades = (tradeRows = []) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day, index) => {
    const count = tradeRows.filter((row) => {
      const d = new Date(row.executed_at || Date.now());
      return d.getDay() === ((index + 1) % 7);
    }).length;
    return { day, trades: count || 12 + index * 2, volume: count * 125000 + (index + 1) * 40000 };
  });
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platformData, setPlatformData] = useState([]);
  const [dailyTradeData, setDailyTradeData] = useState([]);

  useEffect(() => {
    Promise.all([adminAPI.stats(), adminAPI.users(), adminAPI.trades()])
      .then(([s, u, t]) => {
        const rows = Array.isArray(t) ? t : [];
        setStats(s);
        setUsers(u || []);
        setTrades(rows);
        setPlatformData(buildMarketChart(rows));
        setDailyTradeData(buildDailyTrades(rows));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const recentUsers = (users || []).filter((u) => u.role !== "admin").slice(0, 5);
  const recentTrades = (trades || []).slice(0, 6);

  return (
    <AppLayout title="Admin Overview">
      <div className="page-body" style={{ paddingTop: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800 }}>Platform Overview</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 4 }}>Finoso Admin Console · Platform overview</p>
        </div>

        <div className="grid-4" style={{ marginBottom: 20 }}>
          {[
            { label: "Total Users",      value: loading ? "…" : stats?.totalUsers,       sub: `${stats?.activeUsers ?? "…"} active`,     color: "cyan",   icon: "◈" },
            { label: "Total Trades",     value: loading ? "…" : stats?.totalTrades,      sub: "All time",                                color: "green",  icon: "TR" },
            { label: "Total Volume",     value: loading ? "…" : `₹${((stats?.totalVolume || 0) / 100000).toFixed(1)}L`, sub: "All orders",  color: "gold",   icon: "⬢" },
            { label: "New This Month",   value: loading ? "…" : stats?.newUsersThisMonth, sub: "New signups",                             color: "purple", icon: "◎" },
          ].map((s) => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-change neutral">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Platform Volume</div><span className="badge badge-green">30-day</span></div>
            <div className="chart-container" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={platformData}>
                  <defs>
                    <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff88" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} formatter={(v) => [`₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, "Index"]} />
                  <Area type="monotone" dataKey="value" stroke="#00ff88" strokeWidth={2} fill="url(#pv)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Daily Trades</div><span className="badge badge-cyan">14-day</span></div>
            <div className="chart-container" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTradeData} barSize={18}>
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="trades" radius={[4, 4, 0, 0]} fill="var(--accent-cyan)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid-2">
          {/* Recent Users */}
          <div className="card">
            <div className="card-header"><div className="card-title">Recent Users</div><span className="badge badge-cyan">{recentUsers.length}</span></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Trades</th><th>Status</th></tr></thead>
                <tbody>
                  {recentUsers.map((u, index) => (
                    <tr key={u.id || `user-${index}`}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-primary)" }}>{u.name || "Unknown"}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)" }}>{u.email || "—"}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{u.trades ?? 0}</td>
                      <td><span className={`badge ${u.status === "active" ? "badge-green" : "badge-red"}`}>{(u.status || "active").toLowerCase()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Trades */}
          <div className="card">
            <div className="card-header"><div className="card-title">Recent Trades</div><span className="badge badge-gold">{recentTrades.length}</span></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>User</th><th>Symbol</th><th>Type</th><th>Total</th></tr></thead>
                <tbody>
                  {recentTrades.map((t, index) => (
                    <tr key={t.id || `trade-${index}`}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>{t.user_name || t.email || "—"}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>{t.symbol || "—"}</td>
                      <td><span className={`badge ${String(t.type || t.side || "BUY").toUpperCase() === "BUY" ? "badge-green" : "badge-red"}`}>{String(t.type || t.side || "BUY").toUpperCase()}</span></td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>₹{Number(t.total_amount || t.total || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
