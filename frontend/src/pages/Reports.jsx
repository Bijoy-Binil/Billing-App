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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-3 sm:p-4 lg:p-6 text-gray-100">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <span className="text-emerald-400 text-lg">📊</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400 tracking-tight">
                Reports & Analytics
              </h2>
              <p className="text-gray-400 text-sm sm:text-base mt-1">
                Comprehensive business insights and performance metrics
              </p>
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-400 bg-gray-800/50 px-3 py-1.5 rounded-full">
            {salesData.length ? `${salesData.length} records` : "No data"}
          </div>
        </div>

        {/* 💹 Summary Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <SummaryCard title="Today's Sales" value={`₹${dailySales.toFixed(2)}`} color="emerald" />
          <SummaryCard title="Monthly Sales" value={`₹${monthlySales.toFixed(2)}`} color="indigo" />
          <SummaryCard title="Total Profit" value={`₹${totalProfit.toFixed(2)}`} color="amber" />
        </div>

        {/* Charts Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12 sm:py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
              <p className="text-gray-400 text-sm sm:text-base">Loading reports...</p>
            </div>
          </div>
        ) : salesData.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-gray-800/30 rounded-2xl border border-gray-700/50">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">No Data Available</h3>
            <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">
              Start generating bills and adding products to see your analytics dashboard in action.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {/* 📈 Sales Overview */}
            <ReportCard title="Sales Overview" icon="🧾">
              <div className="h-64 sm:h-72 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <Tooltip 
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
                      stroke="#10B981" 
                      strokeWidth={2} 
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 6, fill: '#10B981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <ExpandLink to="/sales-report" />
            </ReportCard>

            {/* 📦 Stock Summary */}
            <ReportCard title="Stock Summary" icon="📦">
              <div className="h-64 sm:h-72 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockData.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#9CA3AF" 
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1F2937", 
                        borderColor: "#10B981",
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Bar 
                      dataKey="quantity" 
                      fill="#10B981" 
                      barSize={25} 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ExpandLink to="/stock-report" />
            </ReportCard>

            {/* 💰 Profit Report */}
            <ReportCard title="Profit Report" icon="💰">
              <div className="h-64 sm:h-72 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={profitData}>
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <Tooltip 
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
                      stroke="#10B981" 
                      fillOpacity={1} 
                      fill="url(#colorProfit)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <ExpandLink to="/profit-report" />
            </ReportCard>
          </div>
        )}

        {/* Mobile Optimization Note */}
        <div className="text-xs sm:text-sm text-gray-400 italic text-center pt-4 border-t border-gray-800/50">
          💡 Charts are fully responsive - perfect for viewing on any device
        </div>
      </div>
    </div>
  );
};

/** ✅ Reusable Report Card */
const ReportCard = ({ title, icon, children }) => (
  <section className="group bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 flex flex-col shadow-lg shadow-emerald-900/10 hover:shadow-emerald-500/20 transition-all duration-300 hover:border-emerald-500/30">
    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
      <div className="text-lg sm:text-xl">{icon}</div>
      <h3 className="text-base sm:text-lg font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300">
        {title}
      </h3>
    </div>
    <div className="flex-1 min-h-0">{children}</div>
  </section>
);

/** ✅ Summary Cards for quick glance */
const SummaryCard = ({ title, value, color }) => {
  const colorMap = {
    emerald: { text: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/10" },
    indigo: { text: "text-indigo-400", border: "border-indigo-500/20", bg: "bg-indigo-500/10" },
    amber: { text: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/10" },
  };

  const colors = colorMap[color];

  return (
    <div
      className={`p-3 sm:p-4 lg:p-5 border rounded-xl sm:rounded-2xl ${colors.border} ${colors.bg} backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg`}
    >
      <h4 className="text-xs sm:text-sm text-gray-400 font-medium mb-1 sm:mb-2">{title}</h4>
      <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${colors.text} truncate`}>
        {value}
      </p>
    </div>
  );
};

/** ✅ Expand Link Button */
const ExpandLink = ({ to }) => (
  <Link
    to={to}
    className="mt-3 sm:mt-4 inline-flex items-center justify-center text-xs sm:text-sm font-medium text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-emerald-400 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 hover:bg-emerald-500/10 w-full sm:w-auto"
  >
    View Detailed Report
    <span className="ml-1 sm:ml-2">→</span>
  </Link>
);

export default Reports;