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
import { TrendingUp, Calendar, Filter, DollarSign } from "lucide-react";

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
      try {
        const [bRes, pRes] = await Promise.all([
          axios.get(API_SALES, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(API_PRODUCTS, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (mounted) {
          setBills(bRes.data.results || bRes.data || []);
          setProducts(pRes.data.results || pRes.data || []);
        }
      } catch (err) {
        setBills([]);
        setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAll();
    return () => (mounted = false);
  }, [token]);

  const productLookup = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      map[p.id] = Number(p.cost_price || p.cost || 0);
    });
    return map;
  }, [products]);

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const d = new Date(b.created_at);
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(endDate)) return false;
      return true;
    });
  }, [bills, startDate, endDate]);

  const chartData = useMemo(() => {
    const daily = {};

    filteredBills.forEach((b) => {
      const dateStr = new Date(b.created_at).toLocaleDateString("en-GB");
      let profit = 0;

      (b.items || []).forEach((item) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.price || 0);

        let cost = 0;
        if (item.product && typeof item.product === "object") {
          cost = Number(item.product.cost_price || 0);
        } else {
          cost = Number(productLookup[item.product] || price * 0.8);
        }

        profit += qty * (price - cost);
      });

      daily[dateStr] = (daily[dateStr] || 0) + profit;
    });

    return Object.keys(daily)
      .sort((a, b) => new Date(a) - new Date(b))
      .map((d) => ({
        date: d,
        profit: Number(daily[d].toFixed(2)),
      }));
  }, [filteredBills, productLookup]);

  const totalProfit = useMemo(() => {
    return chartData.reduce((s, d) => s + d.profit, 0);
  }, [chartData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-emerald-400 to-green-400 rounded-2xl shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Profit Report Dashboard
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Track daily and monthly profit performance
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-4 py-2 rounded-xl shadow-lg font-semibold">
            {filteredBills.length} bills analyzed
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row gap-4 bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex-1">
            <label className="text-gray-700 text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-blue-300 rounded-xl px-4 py-3 mt-1 shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex-1">
            <label className="text-gray-700 text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-blue-300 rounded-xl px-4 py-3 mt-1 shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl border border-gray-300 shadow-sm transition-all font-medium flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KpiCard 
            title="Total Profit" 
            value={` ₹${totalProfit.toFixed(2)}`} 
            gradient="from-emerald-400 to-green-400"
            icon="💰"
          />
          <KpiCard 
            title="Daily Average" 
            value={` ₹${(totalProfit / (chartData.length || 1)).toFixed(2)}`} 
            gradient="from-blue-500 to-blue-600"
            icon="📊"
          />
          <KpiCard 
            title="Days Counted" 
            value={chartData.length} 
            gradient="from-amber-400 to-orange-400"
            icon="📅"
          />
        </div>

        {/* Profit Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Profit Trend (Start → Now)
            </h2>
          </div>

          <div className="h-72">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2"></div>
                  <p className="text-gray-500 text-sm">Loading profit data...</p>
                </div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>No profit data available</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="profitArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="profitLine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" />
                      <stop offset="95%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>

                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    axisLine={{ stroke: "#E5E7EB" }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    axisLine={{ stroke: "#E5E7EB" }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="profit"
                    fill="url(#profitArea)"
                    stroke="url(#profitLine)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Monthly Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl shadow-sm">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Monthly Profit Summary
            </h3>
          </div>

          <div className="overflow-x-auto rounded-xl border border-blue-200 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="py-4 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">Month</th>
                  <th className="py-4 px-4 text-right font-bold text-gray-700 uppercase tracking-wide text-xs">Profit</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-blue-100">
                {Object.keys(chartData).length === 0 ? (
                  <tr>
                    <td className="py-8 text-center" colSpan={2}>
                      <div className="flex flex-col items-center justify-center">
                        <DollarSign className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-gray-500">No monthly data available</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  Object.entries(
                    chartData.reduce((acc, d) => {
                      const m = d.date.slice(3); // "11/2025"
                      acc[m] = (acc[m] || 0) + d.profit;
                      return acc;
                    }, {})
                  ).map(([m, val]) => (
                    <tr key={m} className="hover:bg-blue-50 transition-colors duration-200">
                      <td className="py-4 px-4 font-medium text-gray-900">
                        {m}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-emerald-600 text-lg">
                         ₹{Number(val).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

const KpiCard = ({ title, value, gradient, icon }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    className={`bg-gradient-to-r ${gradient} rounded-2xl p-6 shadow-lg text-white`}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium opacity-90">{title}</div>
        <div className="text-2xl font-bold mt-2">{value}</div>
      </div>
      <div className="text-2xl">{icon}</div>
    </div>
  </motion.div>
);

export default ProfitReport;