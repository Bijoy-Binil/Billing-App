import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";

/**
 * ResponsiveLayout
 * - keeps your sidebar / main content alignment
 * - makes sidebar collapsible on small screens (hamburger)
 *
 * Usage:
 * <ResponsiveLayout>
 *   <YourPage />
 * </ResponsiveLayout>
 */
const ResponsiveLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      {/* Sidebar (desktop & mobile overlay) */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        <TopNav onMenu={() => setSidebarOpen((s) => !s)} />
        <main className="p-6 w-full overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default ResponsiveLayout;
