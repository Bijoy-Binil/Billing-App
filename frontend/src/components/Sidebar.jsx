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
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../AuthProvider";

const Sidebar = ({ open = false, onClose = () => {} }) => {
  const { handleLogout } = useContext(AuthContext);
  const location = useLocation();

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "unset";
    return () => (document.body.style.overflow = "unset");
  }, [open]);

  // Auto-close on route change (mobile)
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  const mainMenu = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Billing", icon: ShoppingCart, path: "/billing" },
    { name: "Inventory", icon: Package, path: "/inventory" },
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

  /* ---------------------------------------------------------- */
  /* ✅ Sidebar Content Block */
  /* ---------------------------------------------------------- */
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* ✅ LOGO */}
      <div className="px-6 py-6 border-b border-gray-200 text-center bg-[#d3d8d8]">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-extrabold text-emerald-600 tracking-wide"
        >
          🧾 SuperBill
        </motion.h1>
        <p className="text-xs text-gray-500 mt-1">Smart Billing System</p>
      </div>

      {/* ✅ MAIN MENU */}
      <div className="flex-1 py-5 px-3 overflow-auto custom-scrollbar">
        <div className="space-y-1">
          {mainMenu.map((item, index) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all 
                    ${
                      active
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm"
                        : "text-gray-700 hover:bg-emerald-100"
                    }`}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* ✅ REPORTS SECTION */}
        <div className="mt-8 px-2">
          <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-2">
            Reports
          </h3>

          <div className="space-y-1">
            {reports.map((report, i) => {
              const active = location.pathname === report.path;

              return (
                <motion.div
                  key={report.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i }}
                >
                  <Link
                    to={report.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-all
                      ${
                        active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    <BarChart3 size={16} />
                    {report.name}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ✅ LOGOUT */}
      <div className="px-6 py-4 border-t border-gray-200 bg-[#d3d8d8]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={handleLogout}
          className="flex items-center gap-3 w-full text-gray-600 hover:text-red-500 transition-all"
        >
          <LogOut size={18} />
          Logout
        </motion.button>
      </div>
    </div>
  );

  /* ---------------------------------------------------------- */
  /* ✅ Desktop + Mobile Sidebar Wrapper */
  /* ---------------------------------------------------------- */
  return (
    <>
      {/* ✅ DESKTOP SIDEBAR */}
      <motion.aside
        className="hidden md:flex md:flex-col w-64 bg-[#d3d8d8] border-r border-gray-200 shadow-sm"
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        {sidebarContent}
      </motion.aside>

      {/* ✅ MOBILE SIDEBAR */}
      <AnimatePresence>
        {open && (
          <div className="md:hidden">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={onClose}
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 shadow-lg z-50"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
