import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LogoMark from "./LogoMark.jsx";

const paths = {
  overview: <><rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/></>,
  watchlist: <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>,
  portfolio: <><path d="M4 19V9l8-5 8 5v10"/><path d="M8 19v-6h8v6"/></>,
  orders: <><path d="M7 3h10v18H7z"/><path d="M9.5 8h5M9.5 12h5M9.5 16h3"/></>,
  backtest: <><path d="M4 17l5-5 4 3 7-8"/><path d="M15 7h5v5"/></>,
  market: <><path d="M4 18V9M10 18V5M16 18v-7M22 18H2"/></>,
  leaders: <><path d="M8 4h8v4a4 4 0 01-8 0z"/><path d="M8 6H4v2a4 4 0 004 4M16 6h4v2a4 4 0 01-4 4M12 12v5M8 21h8M9 17h6"/></>,
  alerts: <><path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 2-7 6-7s6 3 6 7M16 5a3 3 0 010 6M17 13c3 .5 4 3 4 7"/></>,
  analytics: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 00-1.7-1L14.5 3h-5L9 6.1a7 7 0 00-1.7 1l-2.4-1-2 3.4L5 11a7 7 0 000 2l-2.1 1.5 2 3.4 2.4-1a7 7 0 001.7 1l.5 3.1h5l.5-3.1a7 7 0 001.7-1l2.4 1 2-3.4L19 13a7 7 0 000-1z"/></>,
};

const Icon = ({ name }) => <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;

const userItems = [
  ["overview", "Overview", "/dashboard"], ["watchlist", "Watchlist", "/watchlist"], ["portfolio", "Portfolio", "/portfolio"],
  ["orders", "Orders", "/orders"], ["backtest", "Backtest", "/backtest"], ["market", "Markets", "/market"],
  ["settings", "Settings", "/settings"],
];
const adminItems = [["overview", "Overview", "/admin"], ["users", "Users", "/admin/users"], ["orders", "Trades", "/admin/trades"]];

export default function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = user?.role === "admin" ? adminItems : userItems;
  return <nav className="bottom-nav" aria-label="Primary navigation">
    <div className="bottom-nav-brand"><LogoMark size={27} /></div>
    <div className="bottom-nav-items">{items.map(([icon, label, path]) => {
      const active = location.pathname === path;
      return <button key={path} className={`bottom-nav-item${active ? " active" : ""}`} onClick={() => navigate(path)} aria-label={label} aria-current={active ? "page" : undefined}><Icon name={icon}/><span>{label}</span></button>;
    })}</div>
    {user?.role !== "admin" && <button className="bottom-nav-profile" onClick={() => navigate("/settings")} aria-label="Account settings">{user?.name?.charAt(0)?.toUpperCase() || "U"}</button>}
  </nav>;
}
