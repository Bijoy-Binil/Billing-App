// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import SummaryCard from "../components/SummaryCard";
import BillsTable from "../components/BillsTable";
import StockSummary from "../components/StockSummary";
import { ChartBarIcon, ReceiptTaxIcon, CubeIcon } from "@heroicons/react/solid";
import { motion } from "framer-motion";
import { toast } from "react-toastify"; // ✅ Toastify import
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
  console.log("lowStock==>",lowStock)
    // ✅ Beautiful numbered alert for low stock
    if (lowStock.length > 0) {
      const productNames = lowStock
        .slice(0, 5)
        .map((p, idx) => `${idx + 1}. ${p.name}`) // 👈 add index number
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
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 relative overflow-hidden">
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
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-emerald-600/30 blur-[150px] rounded-full opacity-40 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-emerald-500/20 blur-[120px] rounded-full opacity-30 animate-pulse delay-700" />
      </div>

      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Title */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-emerald-400 drop-shadow-lg">
            🧾 Dashboard Overview
          </h1>
          <p className="text-gray-400">Your business insights at a glance.</p>
        </motion.header>

        {/* ✅ Summary cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, staggerChildren: 0.1 }}
        >
          <motion.div whileHover={{ scale: 1.03 }}>
            <SummaryCard
              title="Today's Sales"
              value={`₹${salesToday.toFixed(2)}`}
              sub={`${billCountToday} bills`}
              icon={<ChartBarIcon className="w-6 h-6 text-emerald-400" />}
            />
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }}>
            <SummaryCard
              title="Low Stock Items"
              value={stockProducts.length}
              sub="Critical stock alerts"
              icon={<CubeIcon className="w-6 h-6 text-emerald-400" />}
            />
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }}>
            <SummaryCard
              title="Top Selling"
              value={mostSold.length ? `${mostSold[0].product}` : "—"}
              sub={mostSold.length ? `${mostSold[0].total_qty} sold` : "No data"}
              icon={<ReceiptTaxIcon className="w-6 h-6 text-emerald-400" />}
            />
          </motion.div>
        </motion.div>

        {/* ✅ Main grid */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Bills Table */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-lg shadow-emerald-600/10 p-4"
          >
            <BillsTable bills={todayBills} />
          </motion.div>

          {/* Stock + Most Sold */}
          <div className="space-y-6">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-lg shadow-emerald-600/10 p-4"
            >
              <StockSummary products={stockProducts} />
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-4 shadow-lg shadow-emerald-600/10"
            >
              <div className="text-white font-semibold mb-3 flex items-center justify-between">
                <span>🔥 Most Sold Items (Top 5)</span>
                <span className="text-xs text-gray-400">Last 7 days</span>
              </div>

              <ul className="space-y-2">
                {mostSold.length === 0 && (
                  <li className="text-gray-400 text-sm">No sales data</li>
                )}
                {mostSold.slice(0, 5).map((m, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between items-center p-2 rounded-lg bg-gray-900/30 border border-gray-700 hover:border-emerald-600/40 hover:bg-gray-800/50 transition"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-100">
                        {m.product}
                      </div>
                      <div className="text-xs text-gray-400">
                        {m.total_qty} pcs sold
                      </div>
                    </div>
                    <div className="text-emerald-400 font-semibold">
                      ₹{Number(m.total_sales || 0).toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </motion.div>

        {/* Loading / Error */}
        {loading && (
          <div className="mt-6 text-gray-400 animate-pulse">Loading...</div>
        )}
        {err && <div className="mt-6 text-red-400">{err}</div>}
      </div>
    </div>
  );
};

export default Dashboard;
