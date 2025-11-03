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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
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

  // ✅ Filter bills based on date range
  const filteredBills = useMemo(() => {
    if (!fromDate && !toDate) return bills;
    return bills.filter((b) => {
      const billDate = new Date(b.created_at);
      const from = fromDate ? new Date(fromDate) : new Date("2000-01-01");
      const to = toDate ? new Date(toDate) : new Date();
      return billDate >= from && billDate <= to;
    });
  }, [bills, fromDate, toDate]);

  // ✅ Chart Data
  const chartData = useMemo(() => {
    if (!filteredBills.length) return [];
    const map = {};

    filteredBills.forEach((b) => {
      const dateStr = new Date(b.created_at).toLocaleDateString("en-GB");
      const total = Number(b.total) || 0;
      map[dateStr] = (map[dateStr] || 0) + total;
    });

    return Object.keys(map)
      .sort(
        (a, b) =>
          new Date(a.split("/").reverse().join("-")) -
          new Date(b.split("/").reverse().join("-"))
      )
      .map((k) => ({
        date: k,
        total: Number(map[k].toFixed(2)),
      }));
  }, [filteredBills]);

  // ✅ Stats
  const todayTotal = useMemo(() => {
    const today = new Date().toLocaleDateString("en-GB");
    return filteredBills.reduce(
      (s, b) =>
        new Date(b.created_at).toLocaleDateString("en-GB") === today
          ? s + (Number(b.total) || 0)
          : s,
      0
    );
  }, [filteredBills]);

  const monthTotal = useMemo(() => {
    const curMonth = new Date().getMonth();
    const curYear = new Date().getFullYear();
    return filteredBills.reduce((s, b) => {
      const d = new Date(b.created_at);
      return d.getMonth() === curMonth && d.getFullYear() === curYear
        ? s + (Number(b.total) || 0)
        : s;
    }, 0);
  }, [filteredBills]);

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-3 sm:p-4 lg:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <span className="text-emerald-400 text-lg">📊</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400">
                Sales Report Dashboard
              </h1>
              <p className="text-gray-400 text-sm sm:text-base mt-1">
                Track sales performance and revenue trends
              </p>
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-400 bg-gray-800/50 px-3 py-1.5 rounded-full">
            {filteredBills.length} bills
          </div>
        </motion.div>

        {/* ✅ Date Range Filter */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-start sm:items-end"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex-1 w-full sm:w-auto">
            <label className="block text-sm text-gray-400 mb-2 font-medium">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm sm:text-base"
            />
          </div>
          <div className="flex-1 w-full sm:w-auto">
            <label className="block text-sm text-gray-400 mb-2 font-medium">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm sm:text-base"
            />
          </div>
          <button
            onClick={() => { setFromDate(""); setToDate(""); }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium transition-all duration-200 w-full sm:w-auto mt-2 sm:mt-0"
          >
            Clear Filters
          </button>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <StatCard title="Today's Sales" value={`₹${todayTotal.toFixed(2)}`} />
          <StatCard title="This Month" value={`₹${monthTotal.toFixed(2)}`} />
          <StatCard title="Total Bills" value={filteredBills.length.toString()} />
        </div>

        {/* Line Chart */}
        <motion.section
          className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <span className="text-lg">📈</span>
            <h2 className="text-lg sm:text-xl font-semibold text-emerald-400">
              Sales Trend ({fromDate || "Start"} → {toDate || "Now"})
            </h2>
          </div>
          
          <div className="h-64 sm:h-72 lg:h-80">
            {loading ? (
              <LoadingShimmer />
            ) : chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-sm sm:text-base">No sales data available</p>
                <p className="text-xs text-gray-500 mt-1">Sales will appear here once generated</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="salesLine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: "#9CA3AF" }} 
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis 
                    tick={{ fill: "#9CA3AF", fontSize: 11 }} 
                    width={60}
                  />
                  <Tooltip 
                    formatter={(v) => [`₹${v}`, "Sales"]}
                    contentStyle={{ 
                      backgroundColor: "#1F2937", 
                      borderColor: "#10B981",
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 6, fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.section>

        {/* Recent Bills Table */}
        <motion.section
          className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <span className="text-lg">🧾</span>
            <h3 className="text-lg sm:text-xl font-semibold text-emerald-400">
              Recent Bills ({filteredBills.length})
            </h3>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-gray-400 text-sm border-b border-gray-700/50">
                <tr>
                  <th className="py-3 px-4 font-medium">Bill ID</th>
                  <th className="py-3 px-4 font-medium">Customer</th>
                  <th className="py-3 px-4 font-medium text-right">Total</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      <div className="flex flex-col items-center">
                        <div className="text-3xl mb-2">📄</div>
                        <p>No bills in selected range</p>
                        <p className="text-sm text-gray-500 mt-1">Adjust date filters or generate new bills</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBills.slice(0, 10).map((b) => (
                    <tr
                      key={b.id}
                      className="border-t border-gray-700/50 hover:bg-gray-700/30 transition-colors duration-200"
                    >
                      <td className="py-3 px-4 text-sm text-white font-medium">
                        #{b.bill_id || b.id}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-200">
                        {b.customer_name || "Walk-in Customer"}
                      </td>
                      <td className="py-3 px-4 text-sm text-emerald-400 font-semibold text-right">
                        ₹{Number(b.total || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {new Date(b.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {filteredBills.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-3xl mb-2">📄</div>
                <p>No bills in selected range</p>
                <p className="text-sm text-gray-500 mt-1">Adjust date filters or generate new bills</p>
              </div>
            ) : (
              filteredBills.slice(0, 8).map((b) => (
                <div
                  key={b.id}
                  className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-white text-sm">
                        Bill #{b.bill_id || b.id}
                      </h4>
                      <p className="text-gray-300 text-xs mt-1">
                        {b.customer_name || "Walk-in Customer"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-semibold text-sm">
                        ₹{Number(b.total || 0).toFixed(2)}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(b.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
};

// Stat Card component
const StatCard = ({ title, value }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gray-800/60 border border-gray-700/50 backdrop-blur-xl shadow-inner hover:shadow-emerald-500/10 transition-all duration-300"
  >
    <div className="text-xs sm:text-sm text-gray-400 font-medium mb-2">{title}</div>
    <div className="text-xl sm:text-2xl lg:text-3xl font-semibold text-emerald-400 truncate">
      {value}
    </div>
  </motion.div>
);

const LoadingShimmer = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-400 text-sm">Loading sales data...</p>
    </div>
  </div>
);

export default SalesReport;