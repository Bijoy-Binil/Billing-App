import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Package, Download, RefreshCw } from "lucide-react";

const StockStatementReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStockStatement();
  }, []);

  const fetchStockStatement = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await axios.get("http://127.0.0.1:8000/api/reports/stock-statement/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (error) {
      console.error("Error fetching stock statement:", error);
      setError("Failed to load stock statement data");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Product", "Opening Stock", "Sold", "Closing Stock"];
    const csvData = data.map(row => [
      row.product,
      row.opening_stock,
      row.total_sold,
      row.closing_stock
    ]);
    
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "stock-statement.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
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
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400">
                Stock Statement Report
              </h1>
              <p className="text-gray-400 text-sm sm:text-base mt-1">
                Complete inventory movement and stock analysis
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
              onClick={fetchStockStatement}
              disabled={loading}
              className="px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm sm:text-base font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </motion.div>

        {/* Stats Summary */}
        {data.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-gray-400 mb-1">Total Products</div>
              <div className="text-lg sm:text-xl font-semibold text-emerald-400">{data.length}</div>
            </div>
            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-gray-400 mb-1">Total Sold</div>
              <div className="text-lg sm:text-xl font-semibold text-amber-400">
                {data.reduce((sum, row) => sum + (row.total_sold || 0), 0)}
              </div>
            </div>
            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-gray-400 mb-1">Avg Opening</div>
              <div className="text-lg sm:text-xl font-semibold text-blue-400">
                {Math.round(data.reduce((sum, row) => sum + (row.opening_stock || 0), 0) / data.length)}
              </div>
            </div>
            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-gray-400 mb-1">Avg Closing</div>
              <div className="text-lg sm:text-xl font-semibold text-emerald-400">
                {Math.round(data.reduce((sum, row) => sum + (row.closing_stock || 0), 0) / data.length)}
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
              <p className="text-gray-400 text-sm">Loading stock statement...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 text-lg mb-2">⚠️ {error}</div>
              <button
                onClick={fetchStockStatement}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No Stock Data Available</h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Stock statement data will appear here once you have product movements and sales records.
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
                      <th className="py-3 px-4 font-medium text-center">Opening Stock</th>
                      <th className="py-3 px-4 font-medium text-center">Sold</th>
                      <th className="py-3 px-4 font-medium text-center">Closing Stock</th>
                      <th className="py-3 px-4 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-t border-gray-700/50 hover:bg-gray-700/30 transition-colors duration-200"
                      >
                        <td className="py-3 px-4 text-sm text-gray-300">{idx + 1}</td>
                        <td className="py-3 px-4 text-sm text-white font-medium">{row.product}</td>
                        <td className="py-3 px-4 text-sm text-gray-200 text-center">{row.opening_stock}</td>
                        <td className="py-3 px-4 text-sm text-amber-400 font-semibold text-center">{row.total_sold}</td>
                        <td className="py-3 px-4 text-sm text-emerald-400 font-semibold text-center">{row.closing_stock}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              row.closing_stock > 10
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : row.closing_stock > 0
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {row.closing_stock > 10 ? "Good" : row.closing_stock > 0 ? "Low" : "Out"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {data.map((row, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-base mb-1">
                          {idx + 1}. {row.product}
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-400 text-xs">Opening:</span>
                            <p className="text-gray-200">{row.opening_stock}</p>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs">Sold:</span>
                            <p className="text-amber-400 font-semibold">{row.total_sold}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-semibold text-lg mb-1">
                          {row.closing_stock}
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            row.closing_stock > 10
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : row.closing_stock > 0
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {row.closing_stock > 10 ? "Good" : row.closing_stock > 0 ? "Low" : "Out"}
                        </span>
                      </div>
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

export default StockStatementReport;