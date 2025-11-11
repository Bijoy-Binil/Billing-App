import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, BarChart3, PieChart, ArrowRight, RefreshCw } from "lucide-react";
import api from "../api";

const Reports = () => {
  const [salesData, setSalesData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [profitData, setProfitData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Summary Stats
  const [dailySales, setDailySales] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);

    try {
      const [salesRes, productRes] = await Promise.all([
        api.get("/billings/"),
        api.get("/products/"),
      ]);

      const sales = (salesRes.data.results || salesRes.data || []).map((bill) => ({
        dateObj: new Date(bill.created_at),
        date: new Date(bill.created_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
        total: Number(bill.total) || 0,
        profit: (Number(bill.total) || 0) * 0.2, // assumed 20% margin
      }));

      const stock = (productRes.data.results || productRes.data || []).map((p) => ({
        name: p.name,
        quantity: Number(p.quantity) || 0,
      }));

      // Summaries
      const todayStr = new Date().toLocaleDateString("en-GB");
      const thisMonth = new Date().getMonth();

      const daily = sales
        .filter((s) => s.dateObj.toLocaleDateString("en-GB") === todayStr)
        .reduce((sum, s) => sum + s.total, 0);

      const monthly = sales
        .filter((s) => s.dateObj.getMonth() === thisMonth)
        .reduce((sum, s) => sum + s.total, 0);

      const totalProf = sales.reduce((sum, s) => sum + s.profit, 0);

      setDailySales(daily);
      setMonthlySales(monthly);
      setTotalProfit(totalProf);

      const chartData = sales.map((s) => ({
        date: s.date,
        total: s.total,
        profit: s.profit,
      }));

      setSalesData(chartData);
      setStockData(stock);
      setProfitData(chartData);
    } catch (error) {
      console.error("Error loading reports:", error);
      setSalesData([]);
      setStockData([]);
      setProfitData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-emerald-400 to-green-400 rounded-2xl shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Reports & Analytics
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Comprehensive business insights and performance metrics
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-4 py-2 rounded-xl shadow-lg font-semibold">
              {salesData.length ? `${salesData.length} data points` : "No data yet"}
            </div>
            <button
              onClick={fetchReports}
              disabled={loading}
              className="p-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl border border-gray-300 shadow-sm transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <KpiCard 
            title="Today's Sales" 
            value={` ₹${dailySales.toFixed(2)}`} 
            gradient="from-amber-400 to-orange-400"
            icon="💰"
          />
          <KpiCard 
            title="Monthly Sales" 
            value={` ₹${monthlySales.toFixed(2)}`} 
            gradient="from-blue-500 to-blue-600"
            icon="📅"
          />
          <KpiCard 
            title="Total Profit" 
            value={` ₹${totalProfit.toFixed(2)}`} 
            gradient="from-emerald-400 to-green-400"
            icon="📈"
          />
        </div>

        {/* 3-column responsive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Sales Overview */}
          <ReportCard 
            title="Sales Overview" 
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            gradient="from-blue-500 to-blue-600"
            to="/sales-report"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <defs>
                  <linearGradient id="salesLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" />
                    <stop offset="95%" stopColor="#60A5FA" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6B7280" 
                  fontSize={12}
                  axisLine={{ stroke: "#E5E7EB" }}
                />
                <YAxis 
                  stroke="#6B7280" 
                  fontSize={12}
                  axisLine={{ stroke: "#E5E7EB" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    color: "#111827",
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="url(#salesLine)" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, fill: "#3B82F6", stroke: "#FFFFFF", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#3B82F6", stroke: "#FFFFFF", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ReportCard>

          {/* Stock Summary */}
          <ReportCard 
            title="Stock Summary" 
            icon={<PieChart className="w-5 h-5 text-white" />}
            gradient="from-emerald-400 to-green-400"
            to="/stock-report"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData.slice(0, 8)}>
                <defs>
                  <linearGradient id="stockBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6B7280" 
                  fontSize={12}
                  axisLine={{ stroke: "#E5E7EB" }}
                  hide
                />
                <YAxis 
                  stroke="#6B7280" 
                  fontSize={12}
                  axisLine={{ stroke: "#E5E7EB" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    color: "#111827",
                  }}
                />
                <Bar 
                  dataKey="quantity" 
                  fill="url(#stockBar)" 
                  barSize={28} 
                  radius={[6, 6, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </ReportCard>

          {/* Profit Report */}
          <ReportCard 
            title="Profit Report" 
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            gradient="from-purple-500 to-purple-600"
            to="/profit-report"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profitData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="profitLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" />
                    <stop offset="95%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6B7280" 
                  fontSize={12}
                  axisLine={{ stroke: "#E5E7EB" }}
                />
                <YAxis 
                  stroke="#6B7280" 
                  fontSize={12}
                  axisLine={{ stroke: "#E5E7EB" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    color: "#111827",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="url(#profitLine)"
                  strokeWidth={2.5}
                  fill="url(#colorProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ReportCard>
        </div>

        {/* Additional Report Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <ReportLink to="/stock-bills-report" title="Stock Bills" description="Reconciliation" />
          <ReportLink to="/stock-statement-report" title="Stock Statement" description="Inventory movement" />
          <ReportLink to="/margin-report" title="Margin Analysis" description="Profitability" />
          <ReportLink to="/stock-manufacturer-report" title="Manufacturer" description="Supplier analysis" />
        </motion.div>

        <div className="text-center">
          <p className="text-gray-500 text-sm italic">
            Tip: Click on any chart to explore detailed reports with advanced analytics ✨
          </p>
        </div>
      </div>
    </div>
  );
};

/** Reusable Report Card */
const ReportCard = ({ title, icon, gradient, children, to }) => (
  <motion.section
    whileHover={{ scale: 1.02, y: -2 }}
    className="group bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-2xl p-6 flex flex-col h-[320px] sm:h-[380px] lg:h-[400px] shadow-lg hover:shadow-xl transition-all duration-300"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 bg-gradient-to-r ${gradient} rounded-xl shadow-sm`}>
          {icon}
        </div>
        <h3 className="text-lg font-bold text-gray-900">
          {title}
        </h3>
      </div>
      <Link
        to={to}
        className="p-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl border border-gray-300 shadow-sm transition-all group-hover:scale-110"
      >
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
    <div className="flex-1">{children}</div>
  </motion.section>
);

/** KPI Cards */
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

/** Report Link Cards */
const ReportLink = ({ to, title, description }) => (
  <motion.div
    whileHover={{ scale: 1.05, y: -2 }}
    className="group"
  >
    <Link
      to={to}
      className="block bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-blue-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-900 text-lg">{title}</h4>
          <p className="text-gray-600 text-sm mt-1">{description}</p>
        </div>
        <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 group-hover:from-blue-600 group-hover:to-blue-700 text-white rounded-xl shadow-sm transition-all">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  </motion.div>
);

export default Reports;