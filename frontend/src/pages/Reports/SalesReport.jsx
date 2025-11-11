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
  Area,
} from "recharts";
import { Calendar, Filter, TrendingUp, FileText } from "lucide-react";

const API_SALES = "http://127.0.0.1:8000/api/billings/";

const SalesReport = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      try {
        const res = await axios.get(API_SALES, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data.results || res.data || [];
        setBills(data);
      } catch (err) {
        console.error("Error fetching bills:", err);
        setBills([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, [token]);

  const filteredBills = useMemo(() => {
    if (!fromDate && !toDate) return bills;

    return bills.filter((b) => {
      const billDate = new Date(b.created_at);
      const from = fromDate ? new Date(fromDate) : new Date("2000-01-01");
      const to = toDate ? new Date(toDate) : new Date();
      return billDate >= from && billDate <= to;
    });
  }, [bills, fromDate, toDate]);

  // Chart data
  const chartData = useMemo(() => {
    const map = {};
    filteredBills.forEach((b) => {
      const date = new Date(b.created_at).toLocaleDateString("en-GB");
      const total = Number(b.total) || 0;
      map[date] = (map[date] || 0) + total;
    });

    return Object.keys(map)
      .sort(
        (a, b) =>
          new Date(a.split("/").reverse().join("-")) -
          new Date(b.split("/").reverse().join("-"))
      )
      .map((date) => ({
        date,
        total: map[date],
      }));
  }, [filteredBills]);

  const todayTotal = useMemo(() => {
    const today = new Date().toLocaleDateString("en-GB");
    return filteredBills
      .filter(
        (b) => new Date(b.created_at).toLocaleDateString("en-GB") === today
      )
      .reduce((sum, b) => sum + Number(b.total || 0), 0);
  }, [filteredBills]);

  const monthTotal = useMemo(() => {
    const m = new Date().getMonth();
    const y = new Date().getFullYear();

    return filteredBills
      .filter((b) => {
        const d = new Date(b.created_at);
        return d.getMonth() === m && d.getFullYear() === y;
      })
      .reduce((sum, b) => sum + Number(b.total || 0), 0);
  }, [filteredBills]);

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
                Sales Report Dashboard
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Track sales performance and revenue trends
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-4 py-2 rounded-xl shadow-lg font-semibold">
            {filteredBills.length} bills
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
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
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
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-white border border-blue-300 rounded-xl px-4 py-3 mt-1 shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFromDate("");
                setToDate("");
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
            title="Today's Sales" 
            value={` ₹${todayTotal.toFixed(2)}`} 
            gradient="from-amber-400 to-orange-400"
            icon="💰"
          />
          <KpiCard 
            title="This Month" 
            value={` ₹${monthTotal.toFixed(2)}`} 
            gradient="from-blue-500 to-blue-600"
            icon="📅"
          />
          <KpiCard 
            title="Total Bills" 
            value={filteredBills.length} 
            gradient="from-emerald-400 to-green-400"
            icon="📊"
          />
        </div>

        {/* Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Sales Trend (Start ~ Now)
            </h2>
          </div>

          <div className="h-72">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2"></div>
                  <p className="text-gray-500 text-sm">Loading chart data...</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="lineBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" />
                      <stop offset="95%" stopColor="#3B82F6" />
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
                    dataKey="total"
                    stroke="url(#lineBlue)"
                    fill="url(#areaBlue)"
                    strokeWidth={3}
                  />

                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="url(#lineBlue)"
                    strokeWidth={3}
                    dot={{ r: 6, fill: "#2563EB", stroke: "#FFFFFF", strokeWidth: 2 }}
                    activeDot={{ r: 8, fill: "#2563EB", stroke: "#FFFFFF", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Recent Bills */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl shadow-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Recent Bills ({filteredBills.length})
            </h3>
          </div>

          <div className="overflow-x-auto rounded-xl border border-blue-200 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="py-4 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">Bill ID</th>
                  <th className="py-4 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">Customer</th>
                  <th className="py-4 px-4 text-right font-bold text-gray-700 uppercase tracking-wide text-xs">Total</th>
                  <th className="py-4 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {filteredBills.slice(0, 10).map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-blue-50 transition-colors duration-200"
                  >
                    <td className="py-4 px-4 font-medium text-gray-900">
                      {b.bill_id || b.id}
                    </td>
                    <td className="py-4 px-4">
                      <span className="bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-200">
                        {b.customer_name || "Walk-in Customer"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-emerald-600 text-lg">
                       ₹{Number(b.total).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-gray-600 font-medium">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBills.length === 0 && !loading && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-lg font-medium">No bills found</p>
              <p className="text-gray-400 text-sm mt-1">No sales data available for the selected period</p>
            </div>
          )}
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

export default SalesReport;