import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./components/Sidebar";
import AuthStatus from "./components/AuthStatus";

const ResponsiveLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* ✅ Top Navbar */}
        <header className="sticky top-0 z-30 bg-gray-900/70 backdrop-blur-xl border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-300 hover:text-emerald-400 hover:bg-gray-800 transition md:hidden"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-bold text-emerald-400">SuperBill</h1>

          {/* 🔐 Auth Component */}
          <AuthStatus />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>

        {/* ✅ Footer */}
        <footer className="w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700 text-gray-400 text-sm">
          <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-emerald-400 tracking-wide">
                SuperBill
              </h2>
              <p className="text-xs text-gray-500">
                Smart billing system for modern businesses.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              <a href="/billing" className="hover:text-emerald-400 transition">Billing</a>
              <a href="/inventory" className="hover:text-emerald-400 transition">Inventory</a>
              <a href="/reports" className="hover:text-emerald-400 transition">Reports</a>
              <a href="/dashboard" className="hover:text-emerald-400 transition">Dashboard</a>
              <a href="/contact" className="hover:text-emerald-400 transition">Contact</a>
            </div>
          </div>

          <div className="border-t border-gray-800 py-2 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} SuperBill — All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ResponsiveLayout;
