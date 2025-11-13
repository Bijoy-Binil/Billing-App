// src/pages/SalesReport.jsx
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
import SectionLoader from "../../components/SectionLoader";

// ⬅️ Import your custom video loader


const API_SALES = "http://127.0.0.1:8000/api/billings/";

const SalesReport = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const token = localStorage.getItem("accessToken");

  /* ---------------- FETCH SALES ---------------- */
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

  /* ---------------- FILTERED BILLS ---------------- */
  const filteredBills = useMemo(() => {
    if (!fromDate && !toDate) return bills;

    return bills.filter((b) => {
      const billDate = new Date(b.created_at);
      const f = fromDate ? new Date(fromDate) : new Date("2000-01-01");
      const t = toDate ? new Date(toDate) : new Date();

      return billDate >= f && billDate <= t;
    });
  }, [bills, fromDate, toDate]);

  /* ---------------- EXPORT CSV ---------------- */
  const downloadCSV = () => {
    if (!filteredBills.length) return;

    const headers = ["Bill ID", "Customer", "Total", "Date"];
    const rows = filteredBills.map((b) => [
      b.bill_id || b.id,
      b.customer_name || "Walk-in Customer",
      Number(b.total).toFixed(2),
      new Date(b.created_at).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `sales_report_${fromDate || "all"}_${toDate || "all"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /* ---------------- EXPORT PDF ---------------- */
  const downloadPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Sales Report", 14, 15);

    doc.setFontSize(10);
    doc.text(
      `Filters: From ${fromDate || "Start"} — To ${toDate || "Today"}`,
      14,
      22
    );

    const tableData = filteredBills.map((b) => [
      b.bill_id || b.id,
      b.customer_name || "Walk-in Customer",
      Number(b.total).toFixed(2),
      new Date(b.created_at).toLocaleDateString(),
    ]);

    autoTable(doc, {
      startY: 28,
      head: [["Bill ID", "Customer", "Total", "Date"]],
      body: tableData,
      styles: { fontSize: 10 },
      columnStyles: { 2: { halign: "right" } },
    });

    doc.save(`sales_report_${fromDate || "all"}_${toDate || "all"}.pdf`);
  };

  /* ---------------- CHART DATA ---------------- */
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

  /* ---------------- KPIs ---------------- */
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

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {/* HEADER */}
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
                Sales Report Dashboard
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">
                Track sales performance and revenue trends
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl shadow-lg font-semibold text-sm sm:text-base">
            {filteredBills.length} bills
          </div>
        </motion.div>

        {/* FILTERS + EXPORT */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 bg-white/70 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <div>
              <label className="text-gray-700 text-xs sm:text-sm font-medium">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2.5 mt-1 shadow-sm"
              />
            </div>

            <div>
              <label className="text-gray-700 text-xs sm:text-sm font-medium">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2.5 mt-1 shadow-sm"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg border shadow-sm"
              >
                Clear Filters
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={downloadCSV}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg shadow flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                CSV
              </button>

              <button
                onClick={downloadPDF}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg shadow flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
        </motion.div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <KpiCard title="Today's Sales" value={`₹${todayTotal.toFixed(2)}`} gradient="from-indigo-500 to-blue-600" icon="💰" />
          <KpiCard title="This Month" value={`₹${monthTotal.toFixed(2)}`} gradient="from-blue-500 to-indigo-600" icon="📅" />
          <KpiCard title="Total Bills" value={filteredBills.length} gradient="from-purple-500 to-indigo-600" icon="📊" />
        </div>

        {/* SALES CHART */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 border border-blue-200 rounded-xl p-4 sm:p-6 shadow-lg"
        >
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900">
            Sales Trend
          </h2>

          <div className="h-64 sm:h-72">

            {loading ? (
              <div className="h-full flex items-center justify-center">
                <SectionLoader />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="total"
                    fill="#bfdbfe"
                    stroke="#2563EB"
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#2563EB"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

          </div>
        </motion.div>

        {/* RECENT BILLS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-emerald-400 to-green-400 rounded-lg shadow-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Recent Bills ({filteredBills.length})
            </h3>
          </div>

          <div className="overflow-x-auto rounded-lg border border-blue-200 shadow-sm">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="py-3 px-4 font-bold">Bill ID</th>
                  <th className="py-3 px-4 font-bold">Customer</th>
                  <th className="py-3 px-4 text-right font-bold">Total</th>
                  <th className="py-3 px-4 font-bold">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-blue-100">
                {filteredBills.slice(0, 10).map((b) => (
                  <tr key={b.id} className="hover:bg-blue-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {b.bill_id || b.id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded-lg text-xs border border-orange-200">
                        {b.customer_name || "Walk-in Customer"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      ₹{Number(b.total).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBills.length === 0 && !loading && (
            <div className="text-center py-10">
              <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No bills found</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, gradient, icon }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`bg-gradient-to-r ${gradient} rounded-xl p-4 sm:p-6 shadow-lg text-white`}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs opacity-90">{title}</div>
        <div className="text-xl sm:text-2xl font-bold mt-1">{value}</div>
      </div>
      <div className="text-xl sm:text-2xl">{icon}</div>
    </div>
  </motion.div>
);

export default SalesReport;
