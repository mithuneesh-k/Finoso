import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import LogoMark from "./LogoMark.jsx";

export default function Topbar({ title }) {
  const { user, balance, notification } = useAuth();
  const [time,        setTime]        = useState(new Date());
  const [marketOpen,  setMarketOpen]  = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      setTime(now);
      // IST: UTC+5:30 → market 9:15–15:30 Mon–Fri
      const utcH = now.getUTCHours(), utcM = now.getUTCMinutes();
      const istMins = utcH * 60 + utcM + 330;
      const dayMins = istMins % (24*60);
      const day = now.getUTCDay();
      const isWeekday = day >= 1 && day <= 5;
      setMarketOpen(isWeekday && dayMins >= 555 && dayMins <= 930);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (n) => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-mobile-mark"><LogoMark size={27} /></span>
          <h2 className="topbar-title">{title}</h2>
        </div>
        <div className="topbar-right">
          <div className="market-status-pill">
            <span className="live-dot" style={{ background: marketOpen ? "var(--accent-green)" : "var(--accent-red)" }}/>
            <span style={{ fontFamily:"var(--font-mono)",fontSize:"0.68rem",color:"var(--text-secondary)" }}>
              NSE · {marketOpen ? "OPEN" : "CLOSED"}
            </span>
          </div>
          <div className="topbar-time">
            {time.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
          </div>
          {user?.role !== "admin" && (
            <div className="balance-display">
              <div className="balance-label">Balance</div>
              <div className="balance-value">₹{fmt(balance)}</div>
            </div>
          )}
          <div className="sidebar-avatar" style={{ width:32,height:32,fontSize:"0.78rem",background:user?.avatarColor||"var(--accent-cyan)" }}>
            {user?.name?.charAt(0)||"U"}
          </div>
        </div>
      </div>

      {notification && (
        <div className={`notification ${notification.type}`} key={notification.id}>
          <span>{notification.type==="success"?"✓":notification.type==="error"?"✕":"ℹ"}</span>
          {notification.message}
        </div>
      )}
    </>
  );
}
