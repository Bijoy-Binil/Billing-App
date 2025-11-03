import React, { useEffect, useState } from "react";
import axios from "axios";
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

const Reports = () => {
  const [salesData, setSalesData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [profitData, setProfitData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🧭 Summary Stats
  const [dailySales, setDailySales] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  const API_SALES = "http://127.0.0.1:8000/api/billings/";
  const API_PRODUCTS = "http://127.0.0.1:8000/api/products/";

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const token = localStorage.getItem("accessToken");

    try {
      const [salesRes, productRes] = await Promise.all([
        axios.get(API_SALES, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_PRODUCTS, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const sales = (salesRes.data.results || salesRes.data || []).map((bill) => ({
        date: new Date(bill.created_at),
        formattedDate: new Date(bill.created_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
        total: Number(bill.total) || 0,
        profit: (Number(bill.total) || 0) * 0.2, // 20% assumed margin
      }));

      const stock = (productRes.data.results || productRes.data || []).map((p) => ({
        name: p.name,
        quantity: Number(p.quantity) || 0,
      }));

      // ✅ Summaries
      const today = new Date().toLocaleDateString("en-GB");
      const thisMonth = new Date().getMonth();

      const daily = sales.filter((s) => s.date.toLocaleDateString("en-GB") === today).reduce((sum, s) => sum + s.total, 0);
      const monthly = sales.filter((s) => s.date.getMonth() === thisMonth).reduce((sum, s) => sum + s.total, 0);
      const totalProf = sales.reduce((sum, s) => sum + s.profit, 0);

      setDailySales(daily);
      setMonthlySales(monthly);
      setTotalProfit(totalProf);

      // ✅ Charts
      const chartData = sales.map((s) => ({
        date: s.formattedDate,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6 text-gray-100">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]">
            Reports & Analytics
          </h2>
          <div className="text-sm text-gray-400">
            {salesData.length ? `${salesData.length} data points` : "No data yet"}
          </div>
        </div>

        {/* 💹 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <SummaryCard title="Today's Sales" value={`₹${dailySales.toFixed(2)}`} color="emerald" />
          <SummaryCard title="Monthly Sales" value={`₹${monthlySales.toFixed(2)}`} color="indigo" />
          <SummaryCard title="Total Profit" value={`₹${totalProfit.toFixed(2)}`} color="amber" />
        </div>

        {/* 3-column responsive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* 📈 Sales Overview */}
          <ReportCard title="🧾 Sales Overview">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: "#1F2937", borderColor: "#10B981" }} />
                <Line type="monotone" dataKey="total" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <ExpandLink to="/sales-report" />
          </ReportCard>

          {/* 📦 Stock Summary */}
          <ReportCard title="📦 Stock Summary">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: "#1F2937", borderColor: "#10B981" }} />
                <Bar dataKey="quantity" fill="#10B981" barSize={35} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <ExpandLink to="/stock-report" />
          </ReportCard>

          {/* 💰 Profit Report */}
          <ReportCard title="💰 Profit Report">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profitData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: "#1F2937", borderColor: "#10B981" }} />
                <Area type="monotone" dataKey="profit" stroke="#10B981" fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
            <ExpandLink to="/profit-report" />
          </ReportCard>
        </div>

        <div className="text-sm text-gray-400 italic text-center">
          Tip: Resize the window to explore more data — charts are responsive ✨
        </div>
      </div>
    </div>
  );
};

/** ✅ Reusable Report Card */
const ReportCard = ({ title, children }) => (
  <section className="group bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-4 sm:p-6 flex flex-col h-[320px] sm:h-[380px] lg:h-[420px] shadow-lg shadow-emerald-900/10 hover:shadow-emerald-500/20 transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02]">
    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-emerald-400 group-hover:drop-shadow-[0_0_6px_rgba(16,185,129,0.5)] transition-all duration-300">
      {title}
    </h3>
    <div className="flex-1">{children}</div>
  </section>
);

/** ✅ Summary Cards for quick glance */
const SummaryCard = ({ title, value, color }) => {
  const colorMap = {
    emerald: "text-emerald-400 border-emerald-500/20",
    indigo: "text-indigo-400 border-indigo-500/20",
    amber: "text-amber-400 border-amber-500/20",
  };

  return (
    <div
      className={`p-4 sm:p-5 border rounded-2xl bg-gray-800/60 backdrop-blur-xl shadow-inner ${colorMap[color]} transition-all duration-500 hover:shadow-lg hover:shadow-emerald-400/10 hover:-translate-y-1`}
    >
      <h4 className="text-xs sm:text-sm text-gray-400">{title}</h4>
      <p className={`text-2xl sm:text-3xl font-semibold ${colorMap[color]} drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]`}>
        {value}
      </p>
    </div>
  );
};

/** ✅ Expand Link Button */
const ExpandLink = ({ to }) => (
  <Link
    to={to}
    className="mt-3 sm:mt-4 inline-block text-xs sm:text-sm font-medium text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-emerald-400 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 hover:bg-emerald-500/10"
  >
    Expand →
  </Link>
);

export default Reports;
