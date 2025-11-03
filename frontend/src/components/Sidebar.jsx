import React, { useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  LogOut,
  Truck,
  ShoppingBag,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { AuthContext } from "../AuthProvider";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Inventory", icon: Package, path: "/inventory" },
  { name: "Billing", icon: ShoppingCart, path: "/billing" },
  { name: "Customers", icon: Users, path: "/customers" },
  { name: "Suppliers", icon: Truck, path: "/suppliers" },
  { name: "Purchase Orders", icon: ShoppingBag, path: "/purchase-orders" },
  { name: "SalesReports", icon: BarChart3, path: "/sales-report" },
  { name: "ProfitReports", icon: BarChart3, path: "/profit-report" },
  { name: "StockReports", icon: BarChart3, path: "/stock-report" },
  { name: "StockBillsReports", icon: BarChart3, path: "/stock-bills-report" },
  { name: "StockstatementReport", icon: BarChart3, path: "/stock-statement-report" },
  { name: "MarginReport", icon: BarChart3, path: "/margin-report" },
  { name: "StockManufacturerReport", icon: BarChart3, path: "stock-manufacturer-report" },
  { name: "PurchaseReports", icon: BarChart3, path: "/purchase-report" },
  { name: "OverallReports", icon: BarChart3, path: "/reports" },
];

const Sidebar = ({ open = false, onClose = () => {} }) => {
  const { handleLogout } = useContext(AuthContext);
  const location = useLocation();

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <>
      {/* 🖥️ Desktop Sidebar */}
     <motion.aside className="hidden md:flex md:flex-col w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700 flex-shrink-0 h-auto h-50 overflow-y-auto shadow-[inset_0_0_12px_rgba(16,185,129,0.15)] backdrop-blur-xl">

        {/* Logo */}
        <div className="px-6 py-5 text-center border-b border-gray-700">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-extrabold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent tracking-wide"
          >
            🧾 SuperBill
          </motion.h1>
          <p className="text-xs text-gray-400 mt-1">Smart Billing System</p>
        </div>

        {/* Menu */}
        <div className="flex-1 py-6 space-y-2 overflow-auto custom-scrollbar">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300 relative group ${
                    active
                      ? "bg-emerald-600/25 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_#10B98155]"
                      : "text-gray-300 hover:text-emerald-400 hover:bg-gray-800/60"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={18} className="group-hover:scale-110 transition-transform" />
                  {item.name}
                  {active && (
                    <motion.div
                      layoutId="activeGlow"
                      className="absolute inset-0 rounded-lg border border-emerald-500/40"
                      transition={{ duration: 0.25 }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className="px-6 py-4 border-t border-gray-700">
          <motion.button
            whileHover={{ scale: 1.05, color: "#f87171" }}
            transition={{ duration: 0.2 }}
            onClick={handleLogout}
            className="flex items-center gap-3 w-full text-gray-400 hover:text-red-400 transition-all"
          >
            <LogOut size={18} />
            Logout
          </motion.button>
        </div>
      </motion.aside>

      {/* 📱 Mobile Sidebar */}
      <motion.div
        className={`fixed inset-0 z-40 md:hidden ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Overlay */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: open ? 1 : 0.5 }}
          transition={{ duration: 0.3 }}
        />

        {/* Sliding Panel */}
        <motion.nav
          initial={{ x: "-100%" }}
          animate={{ x: open ? 0 : "-100%" }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
          className="relative w-64 h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700 p-4 flex flex-col shadow-xl"
        >
          <div className="px-2 py-4 text-center border-b border-gray-700 mb-4">
            <h2 className="text-xl font-bold text-emerald-400">🧾 SuperBill</h2>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-md transition-all duration-300 ${
                    active
                      ? "bg-emerald-600/30 text-emerald-400"
                      : "text-gray-300 hover:bg-gray-800/60 hover:text-emerald-400"
                  }`}
                >
                  <Icon size={16} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-gray-700 pt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-gray-400 hover:text-red-400"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </motion.nav>
      </motion.div>
    </>
  );
};

export default Sidebar;
