import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { TrendingUp, Download, RefreshCw, BarChart3, FileText } from "lucide-react";

/* ---------------------- ✅ PDF Export Helpers ---------------------- */
const exportPDF = async (data) => {
  if (!data.length) return;

  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Margin Report", 14, 16);

  const tableData = data.map((r) => [
    r.product,
    `${r.margin_percent}%`,
    r.margin_percent >= 30 ? "High" : r.margin_percent >= 15 ? "Medium" : "Low",
  ]);

  autoTable(doc, {
    startY: 24,
    head: [["Product", "Margin %", "Category"]],
    body: tableData,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.save(`margin_report.pdf`);
};

/* ---------------------- ✅ CSV Export Helper ---------------------- */
const exportCSV = (data) => {
  if (!data.length) return;

  const headers = ["Product", "Margin %", "Category"];
  const rows = data.map((r) => [
    r.product,
    r.margin_percent + "%",
    r.margin_percent >= 30 ? "High" : r.margin_percent >= 15 ? "Medium" : "Low",
  ]);

  const csv =
    headers.join(",") +
    "\n" +
    rows.map((r) => r.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "margin_report.csv";
  link.click();
};

const MarginReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMarginReport();
  }, []);

  const fetchMarginReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      const res = await axios.get(
        "http://127.0.0.1:8000/api/reports/margin/",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setData(res.data);
    } catch (err) {
      setError("Failed to load margin data");
    } finally {
      setLoading(false);
    }
  };

  // Summary
  const summary = {
    total: data.length,
    avg:
      data.length > 0
        ? (
            data.reduce((s, r) => s + parseFloat(r.margin_percent), 0) /
            data.length
          ).toFixed(1)
        : 0,
    max: data.length ? Math.max(...data.map((r) => parseFloat(r.margin_percent))) : 0,
    min: data.length ? Math.min(...data.map((r) => parseFloat(r.margin_percent))) : 0,
  };

  const categories = {
    high: data.filter((r) => parseFloat(r.margin_percent) >= 30).length,
    medium: data.filter(
      (r) => parseFloat(r.margin_percent) >= 15 && parseFloat(r.margin_percent) < 30
    ).length,
    low: data.filter((r) => parseFloat(r.margin_percent) < 15).length,
  };

  const color = (v) =>
    parseFloat(v) >= 30
      ? "text-emerald-600"
      : parseFloat(v) >= 15
      ? "text-amber-600"
      : "text-rose-600";

  const badge = (v) =>
    parseFloat(v) >= 30
      ? "bg-gradient-to-r from-emerald-400 to-green-400 text-white"
      : parseFloat(v) >= 15
      ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white"
      : "bg-gradient-to-r from-rose-500 to-pink-500 text-white";

  const label = (v) =>
    parseFloat(v) >= 30 ? "High" : parseFloat(v) >= 15 ? "Medium" : "Low";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {/* ✅ Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl sm:rounded-2xl shadow-lg">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Margin Report
              </h1>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => exportCSV(data)}
              disabled={data.length === 0}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl shadow flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" /> CSV
            </button>

            <button
              onClick={() => exportPDF(data)}
              disabled={data.length === 0}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg sm:rounded-xl shadow flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" /> PDF
            </button>

            <button
              onClick={fetchMarginReport}
              disabled={loading}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg sm:rounded-xl border shadow flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <RefreshCw className={loading ? "animate-spin w-3 h-3 sm:w-4 sm:h-4" : "w-3 h-3 sm:w-4 sm:h-4"} /> Refresh
            </button>
          </div>
        </motion.div>

        {/* ✅ Summary Cards */}
        {data.length > 0 && (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <KpiCard label="Total Products" value={summary.total} gradient="from-blue-500 to-blue-600" icon="📦" />
            <KpiCard label="Avg Margin" value={`${summary.avg}%`} gradient="from-amber-400 to-orange-400" icon="📊" />
            <KpiCard label="Highest Margin" value={`${summary.max}%`} gradient="from-emerald-400 to-green-400" icon="🚀" />
            <KpiCard label="Lowest Margin" value={`${summary.min}%`} gradient="from-rose-500 to-pink-500" icon="📉" />
          </div>
        )}

        {/* ✅ Main Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-blue-200 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6"
        >
          {!data.length ? (
            <div className="text-center py-12 sm:py-16 text-gray-500">
              <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4" />
              No Margin Data
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-blue-200 shadow-sm">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left font-bold text-xs">#</th>
                    <th className="px-3 sm:px-4 py-3 text-left font-bold text-xs">Product</th>
                    <th className="px-3 sm:px-4 py-3 text-center font-bold text-xs">Margin %</th>
                    <th className="px-3 sm:px-4 py-3 text-center font-bold text-xs">Category</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-blue-100">
                  {data.map((r, i) => (
                    <tr key={i} className="hover:bg-blue-50 transition">
                      <td className="px-3 sm:px-4 py-3 font-medium">{i + 1}</td>
                      <td className="px-3 sm:px-4 py-3 font-semibold">{r.product}</td>
                      <td className={`px-3 sm:px-4 py-3 text-center font-bold ${color(r.margin_percent)} text-sm sm:text-base`}>
                        {r.margin_percent}%
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-center">
                        <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-white font-semibold text-xs ${badge(r.margin_percent)}`}>
                          {label(r.margin_percent)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

/* ✅ KPI Card */
const KpiCard = ({ label, value, gradient, icon }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`bg-gradient-to-r ${gradient} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg text-white`}
  >
    <div className="flex justify-between">
      <div>
        <div className="text-xs sm:text-sm opacity-90">{label}</div>
        <div className="text-xl sm:text-2xl font-bold">{value}</div>
      </div>
      <div className="text-xl sm:text-2xl">{icon}</div>
    </div>
  </motion.div>
);

export default MarginReport;