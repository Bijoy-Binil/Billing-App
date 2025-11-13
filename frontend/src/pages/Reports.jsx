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
import {
  TrendingUp,
  BarChart3,
  PieChart,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import api from "../api";

// 🔥 Bat Loader
import SectionLoader from "../components/SectionLoader";

const Reports = () => {
  const [salesData, setSalesData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [profitData, setProfitData] = useState([]);
  const [loading, setLoading] = useState(true);

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

      const sales = (salesRes.data.results || salesRes.data || []).map(
        (bill) => ({
          dateObj: new Date(bill.created_at),
          date: new Date(bill.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          }),
          total: Number(bill.total) || 0,
          profit: (Number(bill.total) || 0) * 0.2,
        })
      );

      const stock = (productRes.data.results || productRes.data || []).map(
        (p) => ({
          name: p.name,
          quantity: Number(p.quantity) || 0,
        })
      );

      // Summary
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

  // 🔥 FULL SCREEN BAT LOADER
  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <SectionLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl sm:rounded-2xl shadow-lg">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Reports & Analytics
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">
                Comprehensive business insights and performance metrics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl shadow-lg font-semibold text-xs sm:text-sm">
              {salesData.length
                ? `${salesData.length} data points`
                : "No data yet"}
            </div>

            <button
              onClick={fetchReports}
              disabled={loading}
              className="p-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg sm:rounded-xl border border-gray-300 shadow-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <KpiCard
            title="Today's Sales"
            value={`₹${dailySales.toFixed(2)}`}
            gradient="from-amber-400 to-orange-400"
            icon="💰"
          />
          <KpiCard
            title="Monthly Sales"
            value={`₹${monthlySales.toFixed(2)}`}
            gradient="from-blue-500 to-blue-600"
            icon="📅"
          />
          <KpiCard
            title="Total Profit"
            value={`₹${totalProfit.toFixed(2)}`}
            gradient="from-emerald-400 to-green-400"
            icon="📈"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Sales Overview */}
          <ReportCard
            title="Sales Overview"
            icon={<TrendingUp className="text-white w-5 h-5" />}
            gradient="from-blue-500 to-blue-600"
            to="/sales-report"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3B82F6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ReportCard>

          {/* Stock Summary */}
          <ReportCard
            title="Stock Summary"
            icon={<PieChart className="text-white w-5 h-5" />}
            gradient="from-emerald-400 to-green-400"
            to="/stock-report"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData.slice(0, 8)}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </ReportCard>

          {/* Profit Report */}
          <ReportCard
            title="Profit Report"
            icon={<TrendingUp className="text-white w-5 h-5" />}
            gradient="from-purple-500 to-purple-600"
            to="/profit-report"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profitData}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Area dataKey="profit" stroke="#8B5CF6" fill="#E9D5FF" />
              </AreaChart>
            </ResponsiveContainer>
          </ReportCard>
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          <ReportLink
            to="/stock-bills-report"
            title="Stock Bills"
            description="Reconciliation"
          />
          <ReportLink
            to="/stock-statement-report"
            title="Stock Statement"
            description="Inventory movement"
          />
          <ReportLink
            to="/margin-report"
            title="Margin Analysis"
            description="Profitability"
          />
          <ReportLink
            to="/stock-manufacturer-report"
            title="Manufacturer"
            description="Supplier analysis"
          />
        </motion.div>

        <div className="text-center">
          <p className="text-gray-500 text-xs sm:text-sm italic">
            Tip: Click on any chart to explore detailed analytics ✨
          </p>
        </div>
      </div>
    </div>
  );
};

/** KPI Card */
const KpiCard = ({ title, value, gradient, icon }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`bg-gradient-to-r ${gradient} rounded-xl p-4 sm:p-6 shadow-lg text-white`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs sm:text-sm opacity-90">{title}</p>
        <p className="text-xl sm:text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className="text-xl sm:text-2xl">{icon}</div>
    </div>
  </motion.div>
);

/** Report Card Wrapper */
const ReportCard = ({ title, icon, gradient, children, to }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 shadow-lg"
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div
          className={`p-2 bg-gradient-to-r ${gradient} rounded-lg shadow-sm`}
        >
          {icon}
        </div>
        <h3 className="font-bold text-gray-900 text-base sm:text-lg">
          {title}
        </h3>
      </div>

      <Link
        to={to}
        className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg border transition"
      >
        <ArrowRight className="w-4 h-4 text-gray-700" />
      </Link>
    </div>

    <div className="h-[200px] sm:h-[250px]">{children}</div>
  </motion.div>
);

/** Quick Links */
const ReportLink = ({ to, title, description }) => (
  <motion.div whileHover={{ scale: 1.05 }}>
    <Link
      to={to}
      className="block bg-white border border-blue-200 rounded-xl p-3 sm:p-4 shadow hover:shadow-md transition"
    >
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-gray-500 text-sm">{description}</p>
        </div>
        <div className="p-2 bg-blue-500 text-white rounded-lg">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  </motion.div>
);

export default Reports;
