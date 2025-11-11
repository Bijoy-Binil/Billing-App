import React, { useContext, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AuthStatus from "./components/AuthStatus";
import { AuthContext } from "./AuthProvider";

const ResponsiveLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { userName, role, handleLogout } = useContext(AuthContext);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-200 text-gray-900 font-sans">
      
      {/* Sidebar */}
      <Sidebar open={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Section */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ✅ Mobile Header */}
        <header className="md:hidden bg-gray-200 border-b border-gray-200 p-4 flex justify-between items-center shadow-sm">
          <h1 className="text-lg font-bold text-emerald-600">SuperBill</h1>

          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSidebarOpen(true)}>
            <Menu size={24} className="text-gray-700" />
          </motion.button>
        </header>

        {/* ✅ Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-200">

          {/* ✅ User status bar */}
          <div className="flex justify-end mb-4">
            <AuthStatus />
          </div>

          {/* ✅ Page transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>

        </main>
      </div>
    </div>
  );
};

export default ResponsiveLayout;
