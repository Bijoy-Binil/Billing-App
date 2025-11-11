import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { TrendingUp, Download, RefreshCw, BarChart3 } from "lucide-react";

const MarginReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMarginReport();
  }, []);

  const fetchMarginReport = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await axios.get(
        "http://127.0.0.1:8000/api/reports/margin/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res.data);
    } catch (err) {
      console.error("Error loading margin report:", err);
      setError("Failed to load margin data");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Product", "Margin %"];
    const csvRows = data.map(r => [r.product, r.margin_percent]);

    const csvContent =
      headers.join(",") +
      "\n" +
      csvRows.map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "margin-report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
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
    max:
      data.length > 0
        ? Math.max(...data.map(r => parseFloat(r.margin_percent)))
        : 0,
    min:
      data.length > 0
        ? Math.min(...data.map(r => parseFloat(r.margin_percent)))
        : 0
  };

  const categories = {
    high: data.filter(r => parseFloat(r.margin_percent) >= 30).length,
    medium: data.filter(
      r =>
        parseFloat(r.margin_percent) >= 15 &&
        parseFloat(r.margin_percent) < 30
    ).length,
    low: data.filter(r => parseFloat(r.margin_percent) < 15).length
  };

  const color = v =>
    parseFloat(v) >= 30
      ? "text-emerald-600"
      : parseFloat(v) >= 15
      ? "text-amber-600"
      : "text-rose-600";

  const badge = v =>
    parseFloat(v) >= 30
      ? "bg-gradient-to-r from-emerald-400 to-green-400 text-white border border-emerald-500"
      : parseFloat(v) >= 15
      ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white border border-amber-500"
      : "bg-gradient-to-r from-rose-500 to-pink-500 text-white border border-rose-500";

  const label = v =>
    parseFloat(v) >= 30
      ? "High"
      : parseFloat(v) >= 15
      ? "Medium"
      : "Low";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ✅ Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-emerald-400 to-green-400 rounded-2xl shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Margin Report
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Product profitability and margin summary
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              disabled={data.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl shadow-lg flex items-center gap-2 font-semibold transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>

            <button
              onClick={fetchMarginReport}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl border border-gray-300 shadow-sm transition-all font-medium flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* ✅ Summary Cards */}
        {data.length > 0 && (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard 
              label="Total Products" 
              value={summary.total} 
              gradient="from-blue-500 to-blue-600"
              icon="📦"
            />
            <KpiCard 
              label="Avg Margin" 
              value={`${summary.avg}%`} 
              gradient="from-amber-400 to-orange-400"
              icon="📊"
            />
            <KpiCard 
              label="Highest Margin" 
              value={`${summary.max}%`} 
              gradient="from-emerald-400 to-green-400"
              icon="🚀"
            />
            <KpiCard 
              label="Lowest Margin" 
              value={`${summary.min}%`} 
              gradient="from-rose-500 to-pink-500"
              icon="📉"
            />
          </div>
        )}

        {/* ✅ Margin Distribution */}
        {data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DistCard 
              title="High Margin (≥30%)" 
              value={categories.high} 
              gradient="from-emerald-400 to-green-400"
            />
            <DistCard 
              title="Medium Margin (15–29%)" 
              value={categories.medium} 
              gradient="from-amber-400 to-orange-400"
            />
            <DistCard 
              title="Low Margin (<15%)" 
              value={categories.low} 
              gradient="from-rose-500 to-pink-500"
            />
          </div>
        )}

        {/* ✅ Main Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-2xl shadow-lg p-6"
        >
          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorView retry={fetchMarginReport} message={error} />
          ) : data.length === 0 ? (
            <EmptyView />
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden lg:block overflow-x-auto rounded-xl border border-blue-200 shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr className="text-left">
                      <th className="py-4 px-4 font-bold text-gray-700 uppercase tracking-wide text-xs">#</th>
                      <th className="py-4 px-4 font-bold text-gray-700 uppercase tracking-wide text-xs">Product</th>
                      <th className="py-4 px-4 font-bold text-gray-700 uppercase tracking-wide text-xs text-center">Margin %</th>
                      <th className="py-4 px-4 font-bold text-gray-700 uppercase tracking-wide text-xs text-center">Category</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-blue-100">
                    {data.map((r, i) => (
                      <tr
                        key={i}
                        className="hover:bg-blue-50 transition-colors duration-200"
                      >
                        <td className="py-4 px-4 font-medium text-gray-900">{i + 1}</td>
                        <td className="py-4 px-4 font-semibold text-gray-900">{r.product}</td>
                        <td className={`py-4 px-4 text-center font-bold text-xl ${color(r.margin_percent)}`}>
                          {r.margin_percent}%
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`px-4 py-2 rounded-full text-sm font-semibold ${badge(
                              r.margin_percent
                            )}`}
                          >
                            {label(r.margin_percent)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="lg:hidden space-y-4">
                {data.map((r, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900">
                        {i + 1}. {r.product}
                      </h3>

                      <span className={`text-xl font-bold ${color(r.margin_percent)}`}>
                        {r.margin_percent}%
                      </span>
                    </div>

                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${badge(
                        r.margin_percent
                      )}`}
                    >
                      {label(r.margin_percent)}
                    </span>

                    <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                      <div
                        className={`h-3 rounded-full ${
                          parseFloat(r.margin_percent) >= 30
                            ? "bg-gradient-to-r from-emerald-400 to-green-400"
                            : parseFloat(r.margin_percent) >= 15
                            ? "bg-gradient-to-r from-amber-400 to-orange-400"
                            : "bg-gradient-to-r from-rose-500 to-pink-500"
                        }`}
                        style={{
                          width: `${Math.min(parseFloat(r.margin_percent), 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

/* ✅ Components */

const KpiCard = ({ label, value, gradient, icon }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    className={`bg-gradient-to-r ${gradient} rounded-2xl p-6 shadow-lg text-white`}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium opacity-90">{label}</div>
        <div className="text-2xl font-bold mt-2">{value}</div>
      </div>
      <div className="text-2xl">{icon}</div>
    </div>
  </motion.div>
);

const DistCard = ({ title, value, gradient }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className={`bg-gradient-to-r ${gradient} rounded-2xl p-6 shadow-lg text-white text-center`}
  >
    <div className="text-sm font-medium opacity-90">{title}</div>
    <div className="text-3xl font-bold mt-3">{value}</div>
  </motion.div>
);

const Loading = () => (
  <div className="flex flex-col items-center py-16">
    <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-sm text-gray-600 mt-4">Loading margin data…</p>
  </div>
);

const ErrorView = ({ message, retry }) => (
  <div className="text-center py-16">
    <div className="w-16 h-16 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
      <TrendingUp className="w-8 h-8 text-white" />
    </div>
    <p className="text-rose-600 font-semibold mb-4">{message}</p>
    <button
      onClick={retry}
      className="px-6 py-3 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl shadow-lg transition-all font-semibold"
    >
      Try Again
    </button>
  </div>
);

const EmptyView = () => (
  <div className="text-center py-16">
    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-600">No Margin Data</h3>
    <p className="text-gray-500 text-sm">
      Margin report will appear once products have cost & selling price.
    </p>
  </div>
);

export default MarginReport;