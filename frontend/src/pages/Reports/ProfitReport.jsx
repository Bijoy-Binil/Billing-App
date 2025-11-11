import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { TrendingUp, Calendar, Filter, DollarSign, FileText } from "lucide-react";

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
        setLoading(true);
        const [bRes, pRes] = await Promise.all([
          axios.get(API_SALES, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(API_PRODUCTS, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (mounted) {
          setBills(bRes.data.results || bRes.data || []);
          setProducts(pRes.data.results || pRes.data || []);
        }
      } catch {
        if (mounted) {
          setBills([]);
          setProducts([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAll();
    return () => {
      mounted = false;
    };
  }, [token]);

  // Product ID -> cost lookup
  const productLookup = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      map[p.id] = Number(p.cost_price || p.cost || 0);
    });
    return map;
  }, [products]);

  // Apply date filters
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const d = new Date(b.created_at);
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(endDate)) return false;
      return true;
    });
  }, [bills, startDate, endDate]);

  // Compute daily profit data
  const dailyData = useMemo(() => {
    const daily = {};
    filteredBills.forEach((b) => {
      const dateStr = new Date(b.created_at).toLocaleDateString("en-GB"); // dd/mm/yyyy
      let profit = 0;

      (b.items || []).forEach((item) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.price || 0);

        // Cost resolution (object or id)
        let cost = 0;
        if (item.product && typeof item.product === "object") {
          cost = Number(item.product.cost_price || item.product.cost || 0);
        } else {
          cost = Number(productLookup[item.product] || 0);
        }
        if (!cost) cost = price * 0.8; // conservative fallback

        profit += qty * (price - cost);
      });

      daily[dateStr] = (daily[dateStr] || 0) + profit;
    });

    return Object.keys(daily)
      .sort((a, b) => {
        // parse dd/mm/yyyy safely
        const [da, ma, ya] = a.split("/").map(Number);
        const [db, mb, yb] = b.split("/").map(Number);
        return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
      })
      .map((d) => ({
        date: d,
        profit: Number(daily[d].toFixed(2)),
      }));
  }, [filteredBills, productLookup]);

  // Compute monthly profit summary from dailyData
  const monthlyData = useMemo(() => {
    const m = {};
    dailyData.forEach((row) => {
      // row.date is dd/mm/yyyy → monthKey = yyyy-mm
      const [dd, mm, yyyy] = row.date.split("/").map(Number);
      const key = `${yyyy}-${String(mm).padStart(2, "0")}`;
      m[key] = (m[key] || 0) + (row.profit || 0);
    });
    return Object.keys(m)
      .sort() // yyyy-mm lexicographic sort works
      .map((k) => ({
        month: k, // yyyy-mm
        profit: Number(m[k].toFixed(2)),
      }));
  }, [dailyData]);

  const totalProfit = useMemo(
    () => dailyData.reduce((s, d) => s + d.profit, 0),
    [dailyData]
  );

  /* ----------------------- EXPORTS ----------------------- */
  // Helpers
  const safeNumber = (n) => Number(n || 0);
  const fmtINR = (n) => `₹${safeNumber(n).toFixed(2)}`;

  // DAILY CSV
  const downloadDailyCSV = useCallback(() => {
    if (!dailyData.length) return;
    const headers = ["Date", "Profit (INR)"];
    const rows = dailyData.map((r) => [r.date, safeNumber(r.profit).toFixed(2)]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily_profit_${startDate || "start"}_${endDate || "today"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [dailyData, startDate, endDate]);

  // MONTHLY CSV
  const downloadMonthlyCSV = useCallback(() => {
    if (!monthlyData.length) return;
    const headers = ["Month (YYYY-MM)", "Profit (INR)"];
    const rows = monthlyData.map((r) => [r.month, safeNumber(r.profit).toFixed(2)]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monthly_profit_${startDate || "start"}_${endDate || "today"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [monthlyData, startDate, endDate]);

  // DAILY PDF
  const downloadDailyPDF = useCallback(async () => {
    if (!dailyData.length) return;
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
    // Use core font to avoid glyph/spacing issues (use "INR " text instead of "₹")
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text("Daily Profit Report", 14, 15);

    doc.setFontSize(10);
    doc.text(
      `Filters: From ${startDate || "Start"} — To ${endDate || "Today"}`,
      14,
      22
    );

    const body = dailyData.map((r) => [r.date, `INR ${safeNumber(r.profit).toFixed(2)}`]);

    autoTable(doc, {
      startY: 28,
      head: [["Date", "Profit"]],
      body,
      styles: { font: "helvetica", fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] }, // blue
    });

    // Total
    const finalY = doc.lastAutoTable?.finalY || 28;
    doc.setFontSize(12);
    doc.text(`Total: INR ${safeNumber(totalProfit).toFixed(2)}`, 14, finalY + 10);

    doc.save(`daily_profit_${startDate || "start"}_${endDate || "today"}.pdf`);
  }, [dailyData, startDate, endDate, totalProfit]);

  // MONTHLY PDF
  const downloadMonthlyPDF = useCallback(async () => {
    if (!monthlyData.length) return;
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text("Monthly Profit Summary", 14, 15);

    doc.setFontSize(10);
    doc.text(
      `Filters: From ${startDate || "Start"} — To ${endDate || "Today"}`,
      14,
      22
    );

    const body = monthlyData.map((r) => [r.month, `INR ${safeNumber(r.profit).toFixed(2)}`]);

    autoTable(doc, {
      startY: 28,
      head: [["Month (YYYY-MM)", "Profit"]],
      body,
      styles: { font: "helvetica", fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    const grand = monthlyData.reduce((s, r) => s + safeNumber(r.profit), 0);
    const finalY = doc.lastAutoTable?.finalY || 28;
    doc.setFontSize(12);
    doc.text(`Total: INR ${grand.toFixed(2)}`, 14, finalY + 10);

    doc.save(`monthly_profit_${startDate || "start"}_${endDate || "today"}.pdf`);
  }, [monthlyData, startDate, endDate]);

  /* ----------------------- UI ----------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl shadow-lg">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Profit Report Dashboard
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">
                Track daily and monthly profit performance
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl shadow-lg font-semibold text-sm sm:text-base">
            {filteredBills.length} bills analyzed
          </div>
        </motion.div>

        {/* Filters + Export Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-gray-700 text-xs sm:text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-blue-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 mt-1 shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="text-gray-700 text-xs sm:text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white border border-blue-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 mt-1 shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all text-sm sm:text-base"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg sm:rounded-xl border border-gray-300 shadow-sm transition-all font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                Clear Filters
              </button>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Daily */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-2">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" /> Daily Exports
              </span>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={downloadDailyCSV}
                  disabled={!dailyData.length}
                  className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg shadow flex items-center justify-center gap-2 transition-all text-xs sm:text-sm"
                >
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  CSV
                </button>
                <button
                  onClick={downloadDailyPDF}
                  disabled={!dailyData.length}
                  className="flex-1 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg shadow flex items-center justify-center gap-2 transition-all text-xs sm:text-sm"
                >
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  PDF
                </button>
              </div>
            </div>

            {/* Monthly */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-2">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" /> Monthly Exports
              </span>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={downloadMonthlyCSV}
                  disabled={!monthlyData.length}
                  className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg shadow flex items-center justify-center gap-2 transition-all text-xs sm:text-sm"
                >
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  CSV
                </button>
                <button
                  onClick={downloadMonthlyPDF}
                  disabled={!monthlyData.length}
                  className="flex-1 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg shadow flex items-center justify-center gap-2 transition-all text-xs sm:text-sm"
                >
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  PDF
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <KpiCard
            title="Total Profit"
            value={` ${fmtINR(totalProfit)}`}
            gradient="from-blue-500 to-indigo-600"
            icon="💰"
          />
          <KpiCard
            title="Daily Average"
            value={` ${fmtINR(totalProfit / (dailyData.length || 1))}`}
            gradient="from-indigo-500 to-purple-600"
            icon="📊"
          />
          <KpiCard
            title="Days Counted"
            value={dailyData.length}
            gradient="from-amber-400 to-orange-400"
            icon="📅"
          />
        </div>

        {/* Profit Chart (Daily) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg sm:rounded-xl shadow-sm">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Profit Trend (Daily)
            </h2>
          </div>

          <div className="h-64 sm:h-72">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2"></div>
                  <p className="text-gray-500 text-xs sm:text-sm">Loading profit data...</p>
                </div>
              </div>
            ) : dailyData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <DollarSign className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm sm:text-base">No daily profit data</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="profitArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="profitLine" x1="0" y1="0" x2="0" y2="1">
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
                    formatter={(v) => [fmtINR(v), "Profit"]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
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
          className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6"
        >
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl shadow-sm">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Monthly Profit Summary</h3>
          </div>

          <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-blue-200 shadow-sm">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="py-3 px-3 sm:py-4 sm:px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">
                    Month (YYYY-MM)
                  </th>
                  <th className="py-3 px-3 sm:py-4 sm:px-4 text-right font-bold text-gray-700 uppercase tracking-wide text-xs">
                    Profit
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-blue-100">
                {monthlyData.length === 0 ? (
                  <tr>
                    <td className="py-6 sm:py-8 text-center" colSpan={2}>
                      <div className="flex flex-col items-center justify-center">
                        <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mb-2" />
                        <p className="text-gray-500 text-sm">No monthly data available</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  monthlyData.map((row) => (
                    <tr key={row.month} className="hover:bg-blue-50 transition-colors duration-200">
                      <td className="py-3 px-3 sm:py-4 sm:px-4 font-medium text-gray-900">{row.month}</td>
                      <td className="py-3 px-3 sm:py-4 sm:px-4 text-right font-bold text-blue-700 text-sm sm:text-lg">
                        {fmtINR(row.profit)}
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
    className={`bg-gradient-to-r ${gradient} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg text-white`}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs sm:text-sm font-medium opacity-90">{title}</div>
        <div className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">{value}</div>
      </div>
      <div className="text-xl sm:text-2xl">{icon}</div>
    </div>
  </motion.div>
);

export default ProfitReport;