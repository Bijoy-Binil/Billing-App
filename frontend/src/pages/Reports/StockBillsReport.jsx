import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { FileText, Calendar, Filter, RefreshCw, TrendingUp } from "lucide-react";

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

  const chartData = useMemo(() => {
    const productMap = {};

    stockBills.forEach((item) => {
      if (!productMap[item.product]) {
        productMap[item.product] = {
          product: item.product,
          totalSold: 0,
        };
      }
      productMap[item.product].totalSold += item.quantity_sold;
    });

    return Object.values(productMap).slice(0, 10);
  }, [stockBills]);

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between flex-wrap gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-emerald-400 to-green-400 rounded-2xl shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Stock Bills Reconciliation
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Track product sales & stock movement
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-4 py-2 rounded-xl shadow-lg font-semibold">
            {stockBills.length} records
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-gray-700 font-medium text-lg">Date Range Filter</span>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="flex-1">
              <label className="text-gray-700 text-sm font-medium mb-2">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-white border border-blue-300 rounded-xl px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex-1">
              <label className="text-gray-700 text-sm font-medium mb-2">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-white border border-blue-300 rounded-xl px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={fetchStockBills}
                className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl shadow-lg transition-all font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Filter className="w-4 h-4" />
                )}
                Apply Filters
              </button>

              <button
                onClick={clearFilters}
                className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl border border-gray-300 shadow-sm transition-all font-medium"
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
          className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Products Sold Quantity
            </h2>
          </div>

          <div className="h-72">
            {loading ? (
              <LoadingShimmer />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid stroke="#E2E8F0" />
                  <XAxis
                    dataKey="product"
                    fontSize={11}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <defs>
                    <linearGradient id="soldBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <Bar
                    dataKey="totalSold"
                    fill="url(#soldBar)"
                    barSize={30}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>No chart data available</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl shadow-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Stock Reconciliation Details
            </h2>
          </div>

          {loading ? (
            <LoadingShimmer />
          ) : stockBills.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-blue-200 shadow-sm">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="py-4 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">Bill ID</th>
                    <th className="py-4 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">Date</th>
                    <th className="py-4 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">Product</th>
                    <th className="py-4 px-4 text-right font-bold text-gray-700 uppercase tracking-wide text-xs">Qty Sold</th>
                    <th className="py-4 px-4 text-right font-bold text-gray-700 uppercase tracking-wide text-xs">Stock Before</th>
                    <th className="py-4 px-4 text-right font-bold text-gray-700 uppercase tracking-wide text-xs">Stock After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {stockBills.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-blue-50 transition-colors duration-200"
                    >
                      <td className="py-4 px-4 font-semibold text-gray-900">#{item.bill_id}</td>
                      <td className="py-4 px-4 text-gray-700">
                        {new Date(item.bill_date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-200">
                          {item.product}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-emerald-600">
                        {item.quantity_sold}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-700">{item.stock_before}</td>
                      <td className="py-4 px-4 text-right font-semibold text-gray-900">{item.stock_after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-lg font-medium">No stock data available</p>
              <p className="text-gray-400 text-sm mt-1">Stock data will appear once sales are made</p>
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
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 text-sm">Loading...</p>
    </div>
  </div>
);

export default StockBillsReport;