import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Factory, Download, RefreshCw, TrendingUp } from "lucide-react";

const StockManufacturerReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchManufacturerReport();
  }, []);

  const fetchManufacturerReport = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await axios.get("http://127.0.0.1:8000/api/reports/manufacturer/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (error) {
      console.error("Error fetching manufacturer report:", error);
      setError("Failed to load manufacturer data");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Manufacturer", "Total Products", "Total Stock Value (₹)"];
    const csvData = data.map(row => [
      row.manufacturer || "Unknown",
      row.total_products,
      Number(row.total_stock_value).toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "manufacturer-stock-report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  // Calculate summary statistics
  const summaryStats = {
    totalManufacturers: data.length,
    totalProducts: data.reduce((sum, row) => sum + (row.total_products || 0), 0),
    totalStockValue: data.reduce((sum, row) => sum + (Number(row.total_stock_value) || 0), 0),
    avgProductsPerManufacturer: data.length > 0 ? 
      Math.round(data.reduce((sum, row) => sum + (row.total_products || 0), 0) / data.length) : 0
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
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Factory className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-indigo-400">
                Manufacturer Stock Report
              </h1>
              <p className="text-gray-400 text-sm sm:text-base mt-1">
                Stock analysis by manufacturer and product distribution
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              disabled={data.length === 0}
              className="px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base font-medium"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={fetchManufacturerReport}
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
              <div className="text-xs sm:text-sm text-gray-400 mb-1">Manufacturers</div>
              <div className="text-lg sm:text-xl font-semibold text-indigo-400">
                {summaryStats.totalManufacturers}
              </div>
            </div>
            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-gray-400 mb-1">Total Products</div>
              <div className="text-lg sm:text-xl font-semibold text-emerald-400">
                {summaryStats.totalProducts}
              </div>
            </div>
            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-gray-400 mb-1">Avg Products</div>
              <div className="text-lg sm:text-xl font-semibold text-amber-400">
                {summaryStats.avgProductsPerManufacturer}
              </div>
            </div>
            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-gray-400 mb-1">Total Value</div>
              <div className="text-lg sm:text-xl font-semibold text-emerald-400">
                ₹{summaryStats.totalStockValue.toFixed(2)}
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
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-gray-400 text-sm">Loading manufacturer data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 text-lg mb-2">⚠️ {error}</div>
              <button
                onClick={fetchManufacturerReport}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <Factory className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No Manufacturer Data</h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Manufacturer stock data will appear here once you have products with manufacturer information.
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
                      <th className="py-3 px-4 font-medium text-left">Manufacturer</th>
                      <th className="py-3 px-4 font-medium text-center">Total Products</th>
                      <th className="py-3 px-4 font-medium text-center">Stock Value (₹)</th>
                      <th className="py-3 px-4 font-medium text-center">Avg Value per Product</th>
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
                          {row.manufacturer || (
                            <span className="text-gray-500 italic">Unknown Manufacturer</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-200 text-center">
                          {row.total_products}
                        </td>
                        <td className="py-3 px-4 text-sm text-emerald-400 font-semibold text-center">
                          ₹{Number(row.total_stock_value || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm text-amber-400 text-center">
                          ₹{row.total_products > 0 ? 
                            (Number(row.total_stock_value || 0) / row.total_products).toFixed(2) : 
                            "0.00"
                          }
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
                    whileHover={{ scale: 1.02 }}
                    className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-base mb-1">
                          {idx + 1}. {row.manufacturer || "Unknown Manufacturer"}
                        </h3>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-300">{row.total_products} products</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-semibold text-lg mb-1">
                          ₹{Number(row.total_stock_value || 0).toFixed(2)}
                        </div>
                        <div className="text-amber-400 text-xs">
                          ₹{row.total_products > 0 ? 
                            (Number(row.total_stock_value || 0) / row.total_products).toFixed(2) : 
                            "0.00"
                          } avg
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar for visual representation */}
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min((row.total_products / Math.max(...data.map(d => d.total_products))) * 100, 100)}%` 
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

export default StockManufacturerReport;