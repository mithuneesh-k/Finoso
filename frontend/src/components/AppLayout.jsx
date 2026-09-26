import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

/**
 * AppLayout wraps every authenticated page.
 *
 * Usage:
 *   <AppLayout title="Dashboard">
 *     <div className="page-body">...</div>
 *   </AppLayout>
 */
export default function AppLayout({ title, children }) {
  return (
    <div className="app-layout">
      <div className="main-content">
        <Topbar title={title} />
        {children}
      </div>
      <Sidebar />
    </div>
  );
}
