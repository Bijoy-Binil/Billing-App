import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AuthStatus from "./components/AuthStatus";

const ResponsiveLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans">
      <Sidebar open={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 flex justify-between items-center z-30">
          <h1 className="text-lg font-bold text-emerald-400">SuperBill</h1>
          <motion.button whileTap={{ scale: 0.9 }} onClick={toggleSidebar}>
            <Menu size={24} />
          </motion.button>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 bg-gradient-to-br from-gray-900 to-gray-800">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname} // Re-trigger animation on route change
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
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
