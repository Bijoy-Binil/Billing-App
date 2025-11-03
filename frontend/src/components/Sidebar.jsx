import React, { useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  ShoppingBag,
  Users,
  LogOut,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import { AuthContext } from "../AuthProvider";

const Sidebar = ({ open = false, onClose = () => {} }) => {
  const { handleLogout } = useContext(AuthContext);
  const location = useLocation();

  useEffect(() => {
    onClose();
  }, [location.pathname]); // close mobile menu when navigating

  const mainMenu = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Inventory", icon: Package, path: "/inventory" },
    { name: "Billing", icon: ShoppingCart, path: "/billing" },
    { name: "Customers", icon: Users, path: "/customers" },
    { name: "Suppliers", icon: Truck, path: "/suppliers" },
    { name: "Purchase Orders", icon: ShoppingBag, path: "/purchase-orders" },
  ];

  const reports = [
    { name: "Sales Report", path: "/sales-report" },
    { name: "Profit Report", path: "/profit-report" },
    { name: "Stock Report", path: "/stock-report" },
    { name: "Stock Bills Report", path: "/stock-bills-report" },
    { name: "Stock Statement", path: "/stock-statement-report" },
    { name: "Margin Report", path: "/margin-report" },
    { name: "Stock Manufacturer", path: "/stock-manufacturer-report" },
    { name: "Purchase Report", path: "/purchase-report" },
    { name: "Overall Reports", path: "/reports" },
  ];

  return (
    <>
      {/* 🖥️ Desktop Sidebar */}
      <motion.aside
        className="hidden md:flex md:flex-col w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700 flex-shrink-0 overflow-y-auto shadow-[inset_0_0_12px_rgba(16,185,129,0.15)] backdrop-blur-xl"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
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
          {mainMenu.map((item, index) => {
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

          {/* 🔥 Always Expanded Reports Section */}
          <motion.div
            className="px-6 mt-6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-2">Reports</h3>
            <div className="space-y-1">
              {reports.map((report, i) => {
                const active = location.pathname === report.path;
                return (
                  <motion.div
                    key={report.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                  >
                    <Link
                      to={report.path}
                      className={`flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-all duration-300 ${
                        active
                          ? "bg-emerald-600/25 text-emerald-400 border border-emerald-500/40"
                          : "text-gray-300 hover:text-emerald-400 hover:bg-gray-800/60"
                      }`}
                    >
                      <BarChart3 size={16} />
                      {report.name}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Logout */}
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
    </>
  );
};

export default Sidebar;
