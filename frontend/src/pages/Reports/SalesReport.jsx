import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_SALES = "http://127.0.0.1:8000/api/billings/";

const SalesReport = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get(API_SALES, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data.results || res.data || [];
        if (mounted) setBills(data);
      } catch (err) {
        console.error("Error fetching bills:", err);
        if (mounted) setBills([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    return () => {
      mounted = false;
    };
  }, [token]);

  // Aggregate daily totals for 30 days
  const chartData = useMemo(() => {
    if (!bills.length) return [];
    const map = {};
    const now = new Date();
    const days = 30;

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString("en-GB");
      map[key] = 0;
    }

    bills.forEach((b) => {
      const dateStr = new Date(b.created_at).toLocaleDateString("en-GB");
      const total = Number(b.total) || 0;
      if (map.hasOwnProperty(dateStr)) map[dateStr] += total;
    });

    return Object.keys(map).map((k) => ({
      date: k,
      total: Number(map[k].toFixed(2)),
    }));
  }, [bills]);

  const todayTotal = useMemo(() => {
    const today = new Date().toLocaleDateString("en-GB");
    return bills.reduce(
      (s, b) =>
        new Date(b.created_at).toLocaleDateString("en-GB") === today
          ? s + (Number(b.total) || 0)
          : s,
      0
    );
  }, [bills]);

  const monthTotal = useMemo(() => {
    const curMonth = new Date().getMonth();
    const curYear = new Date().getFullYear();
    return bills.reduce((s, b) => {
      const d = new Date(b.created_at);
      return d.getMonth() === curMonth && d.getFullYear() === curYear
        ? s + (Number(b.total) || 0)
        : s;
    }, 0);
  }, [bills]);

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
        📊 Sales Report Dashboard
      </motion.h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Today's Sales" value={`₹${todayTotal.toFixed(2)}`} />
        <StatCard title="This Month" value={`₹${monthTotal.toFixed(2)}`} />
        <StatCard title="Total Bills" value={`${bills.length}`} />
      </div>

      {/* Line Chart */}
      <motion.section
        className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 mb-8 shadow-lg hover:shadow-emerald-600/20 transition-all"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-semibold text-emerald-400 mb-4">
          📈 Last 30 Days — Daily Totals
        </h2>
        <div style={{ height: 320 }}>
          {loading ? (
            <LoadingShimmer />
          ) : chartData.length === 0 ? (
            <div className="text-gray-400 text-center">No sales data</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <defs>
                  <linearGradient id="salesLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2d3748" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <YAxis tick={{ fill: "#9CA3AF" }} />
                <Tooltip formatter={(v) => `₹${v}`} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  fill="url(#salesLine)"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.section>

      {/* Recent Bills Table */}
      <motion.section
        className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-emerald-600/20 transition-all"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-xl font-semibold text-emerald-400 mb-4">
          🧾 Recent Bills
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-left">
            <thead className="text-gray-400 text-sm border-b border-gray-700">
              <tr>
                <th className="py-2 px-2">Bill ID</th>
                <th className="py-2 px-2">Customer</th>
                <th className="py-2 px-2">Total</th>
                <th className="py-2 px-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 text-center text-gray-400"
                  >
                    No bills yet
                  </td>
                </tr>
              ) : (
                bills
                  .slice(0, 12)
                  .map((b) => (
                    <tr
                      key={b.id}
                      className="border-t border-gray-700 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="py-2 px-2 text-sm text-white">
                        {b.bill_id}
                      </td>
                      <td className="py-2 px-2 text-sm text-gray-200">
                        {b.customer_name || "Walk-in"}
                      </td>
                      <td className="py-2 px-2 text-sm text-emerald-400 font-semibold">
                        ₹{Number(b.total).toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-sm text-gray-400">
                        {new Date(b.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </motion.section>
    </motion.div>
  );
};

// Stat Card component
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

export default SalesReport;
