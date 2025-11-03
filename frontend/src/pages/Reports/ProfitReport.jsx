import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_SALES = "http://127.0.0.1:8000/api/billings/";
const API_PRODUCTS = "http://127.0.0.1:8000/api/products/";

const ProfitReport = () => {
  const [bills, setBills] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [bRes, pRes] = await Promise.all([
          axios.get(API_SALES, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(API_PRODUCTS, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (mounted) {
          setBills(bRes.data.results || bRes.data || []);
          setProducts(pRes.data.results || pRes.data || []);
        }
      } catch (err) {
        console.error("Error fetching profit data:", err);
        if (mounted) {
          setBills([]);
          setProducts([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAll();
    return () => (mounted = false);
  }, [token]);

  // Product ID → cost lookup
  const productMap = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      map[p.id] = {
        cost_price: Number(p.cost_price || p.cost || 0),
        name: p.name,
      };
    });
    return map;
  }, [products]);

  // Apply date range filter
  const filteredBills = useMemo(() => {
    if (!startDate && !endDate) return bills;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    return bills.filter((b) => {
      const d = new Date(b.created_at);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }, [bills, startDate, endDate]);

  // Profit computation
  const { dailyProfit, monthlyProfit, totalProfit, chartData } = useMemo(() => {
    const daily = {};
    const monthly = {};
    let total = 0;
    const cd = [];

    filteredBills.forEach((b) => {
      const date = new Date(b.created_at);
      const dateKey = date.toLocaleDateString("en-GB");
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      let billProfit = 0;

      (b.items || []).forEach((it) => {
        const qty = Number(it.quantity ?? 0);
        const price = Number(it.price || 0);
        let cost = 0;

        if (typeof it.product === "object" && it.product !== null) {
          cost = Number(it.product.cost_price || it.product.cost || 0);
        } else {
          cost = Number(productMap[it.product]?.cost_price || 0);
        }
        if (!cost) cost = price * 0.8;

        billProfit += qty * (price - cost);
      });

      total += billProfit;
      daily[dateKey] = (daily[dateKey] || 0) + billProfit;
      monthly[monthKey] = (monthly[monthKey] || 0) + billProfit;
    });

    const keys = Object.keys(daily).sort((a, b) => new Date(a) - new Date(b));
    keys.forEach((k) => cd.push({ date: k, profit: Number(daily[k].toFixed(2)) }));

    return { dailyProfit: daily, monthlyProfit: monthly, totalProfit: total, chartData: cd };
  }, [filteredBills, productMap]);

  return (
    <motion.div
      className="p-6 min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.h1
        className="text-3xl font-bold mb-8 text-center text-emerald-400 drop-shadow-[0_0_10px_#10b981]"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        💹 Profit Report Dashboard
      </motion.h1>

      {/* Date Range Filter */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
        <div>
          <label className="text-gray-300 text-sm mr-2">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-gray-200"
          />
        </div>
        <div>
          <label className="text-gray-300 text-sm mr-2">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-gray-200"
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Profit" value={`₹${Number(totalProfit || 0).toFixed(2)}`} />
        <StatCard
          title="Today's Profit"
          value={`₹${Number(
            Object.values(dailyProfit || {}).reduce((s, v) => s + (v || 0), 0)
          ).toFixed(2)}`}
        />
        <StatCard title="Months Tracked" value={Object.keys(monthlyProfit || {}).length} />
      </div>

      {/* Chart Section */}
      <motion.section
        className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 mb-8 shadow-lg hover:shadow-emerald-600/20 transition-all"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-semibold text-emerald-400 mb-4">
          📈 Daily Profit Overview
        </h2>
        <div style={{ height: 340 }}>
          {loading ? (
            <LoadingShimmer />
          ) : chartData.length === 0 ? (
            <div className="text-gray-400 text-center">No profit data</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2d3748" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <YAxis tick={{ fill: "#9CA3AF" }} />
                <Tooltip formatter={(v) => `₹${Number(v).toFixed(2)}`} />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#profitGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.section>

      {/* Monthly Table */}
      <motion.section
        className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-emerald-600/20 transition-all"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-xl font-semibold text-emerald-400 mb-4">
          🧾 Monthly Profit Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-left">
            <thead className="text-gray-400 text-sm border-b border-gray-700">
              <tr>
                <th className="py-2 px-2">Month</th>
                <th className="py-2 px-2">Profit</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(monthlyProfit).length === 0 && (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-gray-400">
                    No data available
                  </td>
                </tr>
              )}
              {Object.entries(monthlyProfit)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([m, val]) => (
                  <tr
                    key={m}
                    className="border-t border-gray-700 hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="py-2 px-2 text-sm">{m}</td>
                    <td className="py-2 px-2 text-sm text-emerald-400 font-semibold">
                      ₹{Number(val || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </motion.section>
    </motion.div>
  );
};

// Stat card
const StatCard = ({ title, value }) => (
  <motion.div
    whileHover={{ scale: 1.03, boxShadow: "0 0 15px rgba(16,185,129,0.3)" }}
    className="p-6 rounded-2xl bg-gray-800/60 border border-gray-700 backdrop-blur-xl shadow-inner"
  >
    <div className="text-sm text-gray-400 tracking-wide">{title}</div>
    <div className="mt-2 text-3xl font-semibold text-emerald-400 drop-shadow-[0_0_6px_#10b981]">
      {value}
    </div>
  </motion.div>
);

// Loading shimmer
const LoadingShimmer = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-2/3 h-4 bg-gray-700 rounded-full animate-pulse" />
  </div>
);

export default ProfitReport;
