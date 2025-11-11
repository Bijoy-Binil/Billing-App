import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import {
  BarChart3,
  LineChart,
  Package,
  ClipboardList,
  ShoppingCart,
  FileText,
  Users,
  Settings,
  TrendingUp,
  ReceiptIndianRupee,
  Building2,
  Truck,
  Layers,
  Factory,
  Zap,
  ArrowRight,
  Star,
  Target,
} from "lucide-react";

/* -------------------------------------------------------------
 ✅ MASTER Quick Access Dashboard (NEW – Sidebar-matching)
-------------------------------------------------------------- */
const QuickAccess = () => {
  return (
    <div className="min-h-screen bg-[#EEF3FF] text-gray-800 px-4 sm:px-8 py-10">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* ✅ HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg flex items-center justify-center">
            <Zap className="w-7 h-7 text-white" />
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Quick Access
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Navigate faster. Work smarter. Everything in one place.
            </p>
          </div>
        </motion.div>

        {/* ✅ QUICK STATS VIBRANT CARDS */}

        {/* ✅ TOP HIGHLIGHT ACTIONS */}
        <h2 className="text-xl font-semibold text-gray-800 mt-8">Top Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <HighlightCard
            title="Create New Bill"
            desc="Generate bills instantly"
            to="/billing"
            icon={<ReceiptIndianRupee className="w-7 h-7 text-white" />}
            color="from-blue-500 to-blue-600"
            badge="Popular"
          />
          <HighlightCard
            title="Add Product"
            desc="Add new items to inventory"
            to="/inventory"
            icon={<Package className="w-7 h-7 text-white" />}
            color="from-indigo-500 to-purple-600"
            badge="Frequent"
          />
          <HighlightCard
            title="Purchase Entry"
            desc="Record purchase orders"
            to="/purchase-orders"
            icon={<Truck className="w-7 h-7 text-white" />}
            color="from-purple-500 to-pink-600"
            badge="New"
          />
        </div>

        {/* ✅ MAIN GRID (Synced with Sidebar categories) */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              All Pages & Tools
            </h2>

            <div className="text-xs bg-white px-4 py-2 rounded-full shadow border border-gray-200">
              12 Shortcuts
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            <ShortcutCard title="Billing" to="/billing" icon={<ShoppingCart className="text-indigo-600 w-6 h-6" />} />
            <ShortcutCard title="Products" to="/inventory" icon={<Package className="text-blue-600 w-6 h-6" />} />
            <ShortcutCard title="Suppliers" to="/suppliers" icon={<Building2 className="text-purple-600 w-6 h-6" />} />
            <ShortcutCard title="Stock Report" to="/stock-report" icon={<Layers className="text-emerald-600 w-6 h-6" />} />
            <ShortcutCard title="Sales Report" to="/sales-report" icon={<LineChart className="text-rose-600 w-6 h-6" />} />
            <ShortcutCard title="Purchase Report" to="/purchase-report" icon={<ClipboardList className="text-orange-600 w-6 h-6" />} />
            <ShortcutCard title="Profit Report" to="/profit-report" icon={<TrendingUp className="text-green-600 w-6 h-6" />} />
            <ShortcutCard title="Margin Report" to="/margin-report" icon={<BarChart3 className="text-cyan-600 w-6 h-6" />} />
            <ShortcutCard title="Manufacturer Stock" to="/stock-manufacturer-report" icon={<Factory className="text-indigo-600 w-6 h-6" />} />
            <ShortcutCard title="Users" to="/users" icon={<Users className="text-pink-600 w-6 h-6" />} />
            <ShortcutCard title="Settings" to="/settings" icon={<Settings className="text-gray-600 w-6 h-6" />} />
            <ShortcutCard title="All Reports" to="/reports" icon={<FileText className="text-blue-600 w-6 h-6" />} />
          </div>
        </div>

        {/* ✅ CTA */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-14"
        >

        </motion.div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 ✅ REUSABLE COMPONENTS
-------------------------------------------------------------- */

const StatCard = ({ title, value, icon, color }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white shadow-md`}
  >
    <div className="flex justify-between items-center">
      <div>
        <p className="text-xs text-white/80">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
      {icon}
    </div>
  </motion.div>
);

const HighlightCard = ({ title, desc, to, icon, color, badge }) => (
  <Link to={to}>
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`bg-gradient-to-br ${color} p-6 rounded-2xl shadow-lg text-white relative cursor-pointer`}
    >
      {badge && (
        <span className="absolute top-3 right-3 bg-white/30 px-2 py-1 rounded-full text-xs">
          {badge}
        </span>
      )}

      <div className="flex items-center gap-4">
        <div className="bg-white/20 p-3 rounded-xl">{icon}</div>
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-white/80 text-sm">{desc}</p>
        </div>
      </div>
    </motion.div>
  </Link>
);

const ShortcutCard = ({ title, icon, to }) => (
  <Link to={to}>
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col items-center gap-3"
    >
      <div className="p-3 bg-gray-50 rounded-xl shadow">{icon}</div>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      <ArrowRight className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-all" />
    </motion.div>
  </Link>
);

export default QuickAccess;
