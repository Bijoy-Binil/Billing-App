// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import SummaryCard from "../components/SummaryCard";
import BillsTable from "../components/BillsTable";
import StockSummary from "../components/StockSummary";
import { ChartBarIcon, ReceiptTaxIcon, CubeIcon } from "@heroicons/react/solid";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Dashboard = () => {
  const [bills, setBills] = useState([]);
  const [todayBills, setTodayBills] = useState([]);
  const [salesToday, setSalesToday] = useState(0);
  const [billCountToday, setBillCountToday] = useState(0);
  const [stockProducts, setStockProducts] = useState([]);
  const [mostSold, setMostSold] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetchAll();
    fetchLowstock();
  }, []);

  const fetchAll = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await axios.get("http://127.0.0.1:8000/api/billings/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allBills = res.data.results || res.data;
      setBills(allBills);

      const today = new Date().toISOString().slice(0, 10);
      const todayBills = allBills.filter((b) => b.created_at.startsWith(today));

      const totalSales = todayBills.reduce((sum, bill) => sum + Number(bill.total || 0), 0);

      setTodayBills(todayBills);
      setSalesToday(totalSales);
      setBillCountToday(todayBills.length);

      const productMap = {};
      allBills.forEach((bill) => {
        bill.items.forEach((item) => {
          const name = item.product_name;
          const qty = Number(item.quantity || 0);
          const totalSale = qty * Number(item.price || 0);
          if (!productMap[name]) {
            productMap[name] = { product: name, total_qty: 0, total_sales: 0 };
          }
          productMap[name].total_qty += qty;
          productMap[name].total_sales += totalSale;
        });
      });

      const sortedProducts = Object.values(productMap).sort((a, b) => b.total_qty - a.total_qty);
      setMostSold(sortedProducts);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching bills:", error);
      setErr("Failed to load bills.");
      setLoading(false);
    }
  };

  const fetchLowstock = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await axios.get("http://127.0.0.1:8000/api/products/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const products = res.data.results || res.data;
      const lowStock = products.filter((p) => p.quantity < 10);
      setStockProducts(lowStock);

      if (lowStock.length > 0) {
        const productNames = lowStock
          .slice(0, 5)
          .map((p, idx) => `${idx + 1}. ${p.name}`)
          .join(", ");

        toast.warning(
          `⚠️ ${lowStock.length} items are running low: ${productNames}${
            lowStock.length > 5 ? "..." : ""
          }`,
          { icon: "🚨", theme: "dark" }
        );
      }
    } catch (error) {
      console.error("Error fetching low stock:", error);
      setStockProducts([]);
    }
  };

  return (
    <div className="min-h-screen p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 relative overflow-hidden">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="dark"
      />
      
      {/* Background Emerald Glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-emerald-600/30 blur-[100px] sm:blur-[120px] lg:blur-[150px] rounded-full opacity-40 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-56 h-56 sm:w-64 sm:h-64 lg:w-80 lg:h-80 bg-emerald-500/20 blur-[80px] sm:blur-[100px] lg:blur-[120px] rounded-full opacity-30 animate-pulse delay-700" />
      </div>

      <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6">
        {/* Title */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-400 drop-shadow-lg">
            🧾 Dashboard Overview
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-1">
            Your business insights at a glance
          </p>
        </motion.header>

        {/* ✅ Summary cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, staggerChildren: 0.1 }}
        >
          <motion.div whileHover={{ scale: 1.03 }} className="min-w-0">
            <SummaryCard
              title="Today's Sales"
              value={`₹${salesToday.toFixed(2)}`}
              sub={`${billCountToday} bills`}
              icon={<ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />}
            />
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} className="min-w-0">
            <SummaryCard
              title="Low Stock Items"
              value={stockProducts.length}
              sub="Critical stock alerts"
              icon={<CubeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />}
            />
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} className="min-w-0 sm:col-span-2 lg:col-span-1">
            <SummaryCard
              title="Top Selling"
              value={mostSold.length ? `${mostSold[0].product}` : "—"}
              sub={mostSold.length ? `${mostSold[0].total_qty} sold` : "No data"}
              icon={<ReceiptTaxIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />}
            />
          </motion.div>
        </motion.div>

        {/* ✅ Main grid */}
        <motion.div
          className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Bills Table */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-xl sm:rounded-2xl shadow-lg shadow-emerald-600/10 p-3 sm:p-4 lg:p-6 min-w-0"
          >
            <div className="mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                📋 Today's Bills
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                  {todayBills.length} bills
                </span>
              </h2>
              <p className="text-gray-400 text-sm">Recent transactions for today</p>
            </div>
            <div className="overflow-hidden">
              <BillsTable bills={todayBills} />
            </div>
          </motion.div>

          {/* Stock + Most Sold */}
          <div className="space-y-4 sm:space-y-6">
            {/* Stock Summary */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-xl sm:rounded-2xl shadow-lg shadow-emerald-600/10 p-3 sm:p-4 lg:p-6"
            >
              <div className="mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                  ⚠️ Low Stock Alert
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                    {stockProducts.length} items
                  </span>
                </h2>
                <p className="text-gray-400 text-sm">Items needing restock</p>
              </div>
              <div className="max-h-60 sm:max-h-72 overflow-y-auto">
                <StockSummary products={stockProducts} />
              </div>
            </motion.div>

            {/* Most Sold Items */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg shadow-emerald-600/10"
            >
              <div className="text-white font-semibold mb-3 sm:mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔥 Most Sold Items</span>
                  <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                    Top 5
                  </span>
                </div>
                <span className="text-xs text-gray-400 hidden sm:inline">Last 7 days</span>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {mostSold.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-400 text-sm">No sales data available</p>
                    <p className="text-gray-500 text-xs mt-1">Sales will appear here</p>
                  </div>
                )}
                {mostSold.slice(0, 5).map((m, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-gray-900/30 border border-gray-700 hover:border-emerald-600/40 hover:bg-gray-800/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0 w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <span className="text-emerald-400 text-xs font-bold">{idx + 1}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-100 truncate">
                          {m.product}
                        </div>
                        <div className="text-xs text-gray-400">
                          {m.total_qty} pcs sold
                        </div>
                      </div>
                    </div>
                    <div className="text-emerald-400 font-semibold text-sm sm:text-base whitespace-nowrap ml-2">
                      ₹{Number(m.total_sales || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-pulse text-center">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <ChartBarIcon className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-gray-400">Loading dashboard data...</p>
            </div>
          </div>
        )}
        {err && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <p className="text-red-400 font-medium">{err}</p>
            <button
              onClick={fetchAll}
              className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;