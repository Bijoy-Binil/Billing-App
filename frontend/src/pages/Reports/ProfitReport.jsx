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
              <span className="text-emerald-400 text-lg">💹</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400">
                Profit Report Dashboard
              </h1>
              <p className="text-gray-400 text-sm sm:text-base mt-1">
                Track profit margins and revenue performance
              </p>
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-400 bg-gray-800/50 px-3 py-1.5 rounded-full">
            {filteredBills.length} bills analyzed
          </div>
        </motion.div>

        {/* Date Range Filter */}
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
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm sm:text-base"
            />
          </div>
          <div className="flex-1 w-full sm:w-auto">
            <label className="block text-sm text-gray-400 mb-2 font-medium">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm sm:text-base"
            />
          </div>
          <button
            onClick={() => { setStartDate(""); setEndDate(""); }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium transition-all duration-200 w-full sm:w-auto mt-2 sm:mt-0"
          >
            Clear Filters
          </button>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <StatCard 
            title="Total Profit" 
            value={`₹${Number(totalProfit || 0).toFixed(2)}`} 
            subtitle="All time profit"
          />
          <StatCard
            title="Today's Profit"
            value={`₹${Number(
              Object.values(dailyProfit || {}).reduce((s, v) => s + (v || 0), 0)
            ).toFixed(2)}`}
            subtitle="Current day"
          />
          <StatCard 
            title="Months Tracked" 
            value={Object.keys(monthlyProfit || {}).length} 
            subtitle="Active months"
          />
        </div>

        {/* Chart Section */}
        <motion.section
          className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <span className="text-lg">📈</span>
            <h2 className="text-lg sm:text-xl font-semibold text-emerald-400">
              Daily Profit Overview
            </h2>
          </div>
          
          <div className="h-64 sm:h-72 lg:h-80">
            {loading ? (
              <LoadingShimmer />
            ) : chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-sm sm:text-base">No profit data available</p>
                <p className="text-xs text-gray-500 mt-1">Profits will appear here once sales are generated</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
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
                    formatter={(v) => [`₹${Number(v).toFixed(2)}`, "Profit"]}
                    contentStyle={{ 
                      backgroundColor: "#1F2937", 
                      borderColor: "#10B981",
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
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
          className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <span className="text-lg">🧾</span>
            <h3 className="text-lg sm:text-xl font-semibold text-emerald-400">
              Monthly Profit Breakdown
            </h3>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-gray-400 text-sm border-b border-gray-700/50">
                <tr>
                  <th className="py-3 px-4 font-medium">Month</th>
                  <th className="py-3 px-4 font-medium text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(monthlyProfit).length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-gray-400">
                      <div className="flex flex-col items-center">
                        <div className="text-3xl mb-2">📄</div>
                        <p>No monthly profit data available</p>
                        <p className="text-sm text-gray-500 mt-1">Profits will appear after sales analysis</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  Object.entries(monthlyProfit)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([m, val]) => (
                      <tr
                        key={m}
                        className="border-t border-gray-700/50 hover:bg-gray-700/30 transition-colors duration-200"
                      >
                        <td className="py-3 px-4 text-sm text-gray-200">
                          {new Date(m + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-sm text-emerald-400 font-semibold text-right">
                          ₹{Number(val || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {Object.entries(monthlyProfit).length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-3xl mb-2">📄</div>
                <p>No monthly profit data available</p>
                <p className="text-sm text-gray-500 mt-1">Profits will appear after sales analysis</p>
              </div>
            ) : (
              Object.entries(monthlyProfit)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .slice(0, 6)
                .map(([m, val]) => (
                  <div
                    key={m}
                    className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-white text-sm">
                          {new Date(m + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h4>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-semibold text-sm">
                          ₹{Number(val || 0).toFixed(2)}
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
const StatCard = ({ title, value, subtitle }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gray-800/60 border border-gray-700/50 backdrop-blur-xl shadow-inner hover:shadow-emerald-500/10 transition-all duration-300"
  >
    <div className="text-xs sm:text-sm text-gray-400 font-medium mb-1">{title}</div>
    <div className="text-xl sm:text-2xl lg:text-3xl font-semibold text-emerald-400 truncate">
      {value}
    </div>
    {subtitle && (
      <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
    )}
  </motion.div>
);

const LoadingShimmer = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-400 text-sm">Analyzing profit data...</p>
    </div>
  </div>
);

export default ProfitReport;