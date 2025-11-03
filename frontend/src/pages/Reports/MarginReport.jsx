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
      const res = await axios.get("http://127.0.0.1:8000/api/reports/margin/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (error) {
      console.error("Error fetching margin report:", error);
      setError("Failed to load margin data");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Product", "Margin %"];
    const csvData = data.map(row => [
      row.product,
      row.margin_percent
    ]);
    
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "margin-report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  // Calculate summary statistics
  const summaryStats = {
    totalProducts: data.length,
    avgMargin: data.length > 0 ? 
      (data.reduce((sum, row) => sum + parseFloat(row.margin_percent), 0) / data.length).toFixed(1) : 0,
    maxMargin: data.length > 0 ? 
      Math.max(...data.map(row => parseFloat(row.margin_percent))) : 0,
    minMargin: data.length > 0 ? 
      Math.min(...data.map(row => parseFloat(row.margin_percent))) : 0
  };

  // Categorize margins
  const marginCategories = {
    high: data.filter(row => parseFloat(row.margin_percent) >= 30).length,
    medium: data.filter(row => parseFloat(row.margin_percent) >= 15 && parseFloat(row.margin_percent) < 30).length,
    low: data.filter(row => parseFloat(row.margin_percent) < 15).length
  };

  const getMarginColor = (margin) => {
    const value = parseFloat(margin);
    if (value >= 30) return "text-emerald-400";
    if (value >= 15) return "text-amber-400";
    return "text-red-400";
  };

  const getMarginBadge = (margin) => {
    const value = parseFloat(margin);
    if (value >= 30) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (value >= 15) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const getMarginLabel = (margin) => {
    const value = parseFloat(margin);
    if (value >= 30) return "High";
    if (value >= 15) return "Medium";
    return "Low";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400">
                Margin Report
              </h1>
              <p className="text-gray-400 text-sm sm:text-base mt-1">
                Product profitability and margin analysis
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              disabled={data.length === 0}
              className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-2 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base font-medium"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={fetchMarginReport}
              disabled={loading}
              className="px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm sm:text-base font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </motion.div>

        {/* Summary Statistics */}
        {data.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-gray-400 mb-1">Total Products</div>
              <div className="text-lg sm:text-xl font-semibold text-emerald-400">
                {summaryStats.totalProducts}
              </div>
            </div>
            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-gray-400 mb-1">Avg Margin</div>
              <div className="text-lg sm:text-xl font-semibold text-amber-400">
                {summaryStats.avgMargin}%
              </div>
            </div>
            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-gray-400 mb-1">Highest Margin</div>
              <div className="text-lg sm:text-xl font-semibold text-emerald-400">
                {summaryStats.maxMargin}%
              </div>
            </div>
            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-gray-400 mb-1">Lowest Margin</div>
              <div className="text-lg sm:text-xl font-semibold text-red-400">
                {summaryStats.minMargin}%
              </div>
            </div>
          </motion.div>
        )}

        {/* Margin Distribution */}
        {data.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4"
          >
            <div className="bg-gray-800/60 backdrop-blur-xl border border-emerald-500/20 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-emerald-400 mb-1">High Margin (≥30%)</div>
              <div className="text-lg sm:text-xl font-semibold text-emerald-400">
                {marginCategories.high}
              </div>
            </div>
            <div className="bg-gray-800/60 backdrop-blur-xl border border-amber-500/20 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-amber-400 mb-1">Medium Margin (15-29%)</div>
              <div className="text-lg sm:text-xl font-semibold text-amber-400">
                {marginCategories.medium}
              </div>
            </div>
            <div className="bg-gray-800/60 backdrop-blur-xl border border-red-500/20 rounded-xl p-3 sm:p-4 text-center">
             <div className="text-xs sm:text-sm text-red-400 mb-1">
  Low Margin ({'<'}15%)
</div>

              <div className="text-lg sm:text-xl font-semibold text-red-400">
                {marginCategories.low}
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg border border-gray-700/50"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-gray-400 text-sm">Loading margin data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 text-lg mb-2">⚠️ {error}</div>
              <button
                onClick={fetchMarginReport}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No Margin Data Available</h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Margin data will appear here once you have products with cost and price information.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-gray-400 text-sm border-b border-gray-700/50">
                    <tr>
                      <th className="py-3 px-4 font-medium text-left">#</th>
                      <th className="py-3 px-4 font-medium text-left">Product</th>
                      <th className="py-3 px-4 font-medium text-center">Margin %</th>
                      <th className="py-3 px-4 font-medium text-center">Margin Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, idx) => (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-t border-gray-700/50 hover:bg-gray-700/30 transition-colors duration-200"
                      >
                        <td className="py-3 px-4 text-sm text-gray-300">{idx + 1}</td>
                        <td className="py-3 px-4 text-sm text-white font-medium">
                          {row.product}
                        </td>
                        <td className={`py-3 px-4 text-sm font-semibold text-center ${getMarginColor(row.margin_percent)}`}>
                          {row.margin_percent}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getMarginBadge(row.margin_percent)}`}>
                            {getMarginLabel(row.margin_percent)}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {data.map((row, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-base mb-1">
                          {idx + 1}. {row.product}
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-semibold mb-1 ${getMarginColor(row.margin_percent)}`}>
                          {row.margin_percent}%
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getMarginBadge(row.margin_percent)}`}>
                          {getMarginLabel(row.margin_percent)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Visual margin indicator */}
                    <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          parseFloat(row.margin_percent) >= 30 ? 'bg-emerald-500' :
                          parseFloat(row.margin_percent) >= 15 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ 
                          width: `${Math.min(parseFloat(row.margin_percent), 100)}%` 
                        }}
                      ></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MarginReport;