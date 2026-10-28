import React, { useState, useEffect } from "react";
import AppLayout from "../../components/AppLayout.jsx";
import { adminAPI } from "../../api/index.js";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    adminAPI
      .users()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (user) => {
    const isCurrentlyActive = (user.status || "").toLowerCase() === "active";
    const newStatus = isCurrentlyActive ? "INACTIVE" : "ACTIVE";
    const userId = user.id || user._id;
    try {
      const updated = await adminAPI.updateStatus(userId, newStatus);
      setUsers((prev) =>
        prev.map((u) => ((u.id || u._id) === (updated.id || updated._id) ? { ...u, ...updated } : u))
      );
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedAndFiltered = [...users]
    .filter(
      (u) =>
        (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";
      if (sortField === "name") {
        valA = a.name || a.email || "";
        valB = b.name || b.email || "";
      }
      const cmp = String(valA).localeCompare(String(valB), undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return sortDirection === "asc" ? cmp : -cmp;
    });

  const totalUsersCount = users.filter((u) => (u.role || "").toLowerCase() !== "admin").length;
  const activeUsersCount = users.filter(
    (u) => (u.status || "").toLowerCase() === "active" && (u.role || "").toLowerCase() !== "admin"
  ).length;
  const inactiveUsersCount = users.filter((u) => (u.status || "").toLowerCase() === "inactive").length;
  const totalBalance = users
    .filter((u) => (u.role || "").toLowerCase() !== "admin")
    .reduce((s, u) => s + (Number(u.balance) || 0), 0);

  return (
    <AppLayout title="User Management">
      <div className="page-body" style={{ paddingTop: 24 }}>
        <div className="grid-4" style={{ marginBottom: 20 }}>
          {[
            { label: "Total Users", value: totalUsersCount, color: "cyan" },
            { label: "Active", value: activeUsersCount, color: "green" },
            { label: "Inactive", value: inactiveUsersCount, color: "red" },
            { label: "Total Balance", value: `₹${(totalBalance / 100000).toFixed(1)}L`, color: "gold" },
          ].map((s) => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: "1.2rem" }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <input
            type="text"
            placeholder="Search users by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 360 }}
          />
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">All Users</div>
            <span className="badge badge-cyan">{sortedAndFiltered.length} users</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th
                    style={{ cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSort("name")}
                    title="Click to sort by Name"
                  >
                    Name {sortField === "name" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Balance</th>
                  <th>Trades</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <p>Loading users…</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedAndFiltered.map((u) => {
                    const userId = u.id || u._id;
                    const isActive = (u.status || "").toLowerCase() === "active";
                    const isAdmin = (u.role || "").toLowerCase() === "admin";
                    const joined = u.created_at || u.createdAt;

                    return (
                      <tr key={userId}>
                        <td
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          {u.name || "—"}
                        </td>
                        <td
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {u.email}
                        </td>
                        <td>
                          <span className={`badge ${isAdmin ? "badge-gold" : "badge-cyan"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                          ₹{(Number(u.balance) || 0).toLocaleString("en-IN", {
                            maximumFractionDigits: 0,
                          })}
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>{u.trades || 0}</td>
                        <td
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.68rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {joined && !isNaN(new Date(joined).getTime())
                            ? new Date(joined).toLocaleDateString("en-IN")
                            : "—"}
                        </td>
                        <td>
                          <span className={`badge ${isActive ? "badge-green" : "badge-red"}`}>
                            {u.status}
                          </span>
                        </td>
                        <td>
                          {!isAdmin && (
                            <button
                              className={`btn btn-sm ${isActive ? "btn-red" : "btn-green"}`}
                              onClick={() => toggleStatus(u)}
                            >
                              {isActive ? "Deactivate" : "Activate"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
