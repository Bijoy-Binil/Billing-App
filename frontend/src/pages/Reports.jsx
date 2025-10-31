// src/pages/Reports.jsx
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

const Reports = () => {
  const [salesData, setSalesData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [profitData, setProfitData] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_SALES = "http://127.0.0.1:8000/api/billings/"; // ✅ use your DRF bills endpoint
  const API_PRODUCTS = "http://127.0.0.1:8000/api/products/";

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const token = localStorage.getItem("accessToken");

    try {
      const [salesRes, productRes] = await Promise.all([
        axios.get(API_SALES, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(API_PRODUCTS, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // --- Sales Data ---
      const sales = (salesRes.data.results || salesRes.data || []).map((bill) => ({
        date: new Date(bill.created_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
        total: Number(bill.total) || 0,
        profit: (Number(bill.total) || 0) * 0.2, // assuming 20% margin
      }));

      // --- Stock Data ---
      const stock = (productRes.data.results || productRes.data || []).map((p) => ({
        name: p.name,
        quantity: Number(p.quantity) || 0,
      }));

      setSalesData(sales);
      setStockData(stock);
      setProfitData(sales);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 text-gray-100">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-emerald-400">Reports & Analytics</h2>
          <div className="text-sm text-gray-400">
            {salesData.length ? `${salesData.length} data points` : "No data yet"}
          </div>
        </div>

        {/* 3-column responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 📈 Sales Overview */}
          <ReportCard title="🧾 Sales Overview">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    borderColor: "#10B981",
                    color: "#F3F4F6",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#10B981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ReportCard>

          {/* 📦 Stock Summary */}
          <ReportCard title="📦 Stock Summary">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    borderColor: "#10B981",
                    color: "#F3F4F6",
                  }}
                />
                <Bar dataKey="quantity" fill="#10B981" barSize={35} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    borderColor: "#10B981",
                    color: "#F3F4F6",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ReportCard>
        </div>

        <div className="text-sm text-gray-400">
          Tip: Zoom or resize the window to view more data points — charts resize automatically.
        </div>
      </div>
    </div>
  );
};

/** ✅ Reusable Card Layout */
const ReportCard = ({ title, children }) => (
  <section className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 flex flex-col h-[400px]">
    <h3 className="text-lg font-semibold mb-4 text-emerald-400">{title}</h3>
    <div className="flex-1">{children}</div>
  </section>
);

export default Reports;
