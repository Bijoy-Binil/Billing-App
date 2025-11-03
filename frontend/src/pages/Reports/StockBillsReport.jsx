import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FileText, Calendar, Filter, RefreshCw } from "lucide-react";

const API_STOCK_BILLS = "http://127.0.0.1:8000/api/reports/stock-bills/";

const StockBillsReport = () => {
  const [stockBills, setStockBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    fetchStockBills();
  }, []);

  const fetchStockBills = async () => {
    setLoading(true);
    try {
      let url = API_STOCK_BILLS;
      if (fromDate && toDate) {
        url += `?start_date=${fromDate}&end_date=${toDate}`;
      }
      
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStockBills(res.data);
    } catch (err) {
      console.error("Error loading stock bills report:", err);
      setStockBills([]);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for chart
  const chartData = useMemo(() => {
    const productMap = {};
    
    stockBills.forEach(item => {
      if (!productMap[item.product]) {
        productMap[item.product] = {
          product: item.product,
          totalSold: 0
        };
      }
      productMap[item.product].totalSold += item.quantity_sold;
    });
    
    return Object.values(productMap).slice(0, 10); // Limit to top 10 for mobile
  }, [stockBills]);

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400">
                Stock Bills Reconciliation
              </h1>
              <p className="text-gray-400 text-sm sm:text-base mt-1">
                Track product sales and stock movements
              </p>
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-400 bg-gray-800/50 px-3 py-1.5 rounded-full">
            {stockBills.length} records
          </div>
        </motion.div>

        {/* Date Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <span className="text-sm sm:text-base text-gray-300 font-medium">Date Range</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-end">
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-xs sm:text-sm text-gray-400 mb-2">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 bg-gray-700/60 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm sm:text-base"
              />
            </div>
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-xs sm:text-sm text-gray-400 mb-2">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 bg-gray-700/60 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm sm:text-base"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={fetchStockBills}
                disabled={loading}
                className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base font-medium"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Filter className="w-4 h-4" />
                )}
                {loading ? "Loading..." : "Apply"}
              </button>
              <button
                onClick={clearFilters}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-all duration-200 text-sm sm:text-base font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        </motion.div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <span className="text-lg">📊</span>
            <h2 className="text-lg sm:text-xl font-semibold text-emerald-400">
              Products Sold Quantity
            </h2>
          </div>
          
          <div className="h-64 sm:h-72 lg:h-80">
            {loading ? (
              <LoadingShimmer />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="product" 
                    stroke="#9CA3AF" 
                    fontSize={11}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    fontSize={11}
                    width={40}
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
                    dataKey="totalSold" 
                    name="Quantity Sold" 
                    fill="#10B981" 
                    barSize={25} 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <div className="text-4xl mb-2">📈</div>
                <p className="text-sm sm:text-base">No chart data available</p>
                <p className="text-xs text-gray-500 mt-1">Data will appear after applying filters</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <span className="text-lg">📋</span>
            <h2 className="text-lg sm:text-xl font-semibold text-emerald-400">
              Stock Reconciliation Details
            </h2>
          </div>

          {loading ? (
            <LoadingShimmer />
          ) : stockBills.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-gray-400 text-sm border-b border-gray-700/50">
                    <tr>
                      <th className="py-3 px-4 font-medium text-left">Bill ID</th>
                      <th className="py-3 px-4 font-medium text-left">Date</th>
                      <th className="py-3 px-4 font-medium text-left">Product</th>
                      <th className="py-3 px-4 font-medium text-right">Qty Sold</th>
                      <th className="py-3 px-4 font-medium text-right">Stock Before</th>
                      <th className="py-3 px-4 font-medium text-right">Stock After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockBills.map((item, index) => (
                      <tr 
                        key={`${item.bill_id}-${item.product}-${index}`}
                        className="border-t border-gray-700/50 hover:bg-gray-700/30 transition-colors duration-200"
                      >
                        <td className="py-3 px-4 text-sm text-white font-medium">
                          #{item.bill_id}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-200">
                          {new Date(item.bill_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-200">
                          {item.product}
                        </td>
                        <td className="py-3 px-4 text-sm text-emerald-400 font-semibold text-right">
                          {item.quantity_sold}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300 text-right">
                          {item.stock_before}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300 text-right">
                          {item.stock_after}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {stockBills.slice(0, 10).map((item, index) => (
                  <div
                    key={`${item.bill_id}-${item.product}-${index}`}
                    className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-white text-sm">
                          Bill #{item.bill_id}
                        </h4>
                        <p className="text-gray-300 text-xs mt-1">
                          {new Date(item.bill_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-semibold text-sm">
                          {item.quantity_sold} sold
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Product:</span>
                        <span className="text-gray-200">{item.product}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Stock Before:</span>
                        <span className="text-gray-200">{item.stock_before}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Stock After:</span>
                        <span className="text-gray-200">{item.stock_after}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {stockBills.length > 10 && (
                  <div className="text-center text-gray-400 text-sm py-4">
                    +{stockBills.length - 10} more records
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📄</div>
              <p className="text-sm sm:text-base">No stock bills data available</p>
              <p className="text-xs text-gray-500 mt-1">
                {fromDate || toDate ? "Try adjusting your date filters" : "Data will appear once bills are generated"}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const LoadingShimmer = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-400 text-sm">Loading stock data...</p>
    </div>
  </div>
);

export default StockBillsReport;