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
  LineChart,
  Line,
} from "recharts";
import { FileText, Calendar, Filter } from "lucide-react";

const API_STOCK_BILLS = "http://127.0.0.1:8000/api/reports/stock-bills/";

const StockBillsReport = () => {
  const [stockBills, setStockBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    fetchStockBills();
  }, [fromDate, toDate]);

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
    
    return Object.values(productMap);
  }, [stockBills]);

  return (
    <div className="p-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-semibold mb-6 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent"
      >
        Stock Bills Reconciliation
      </motion.h1>

      {/* Date Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex flex-wrap gap-4 items-center"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <span className="text-gray-300">Filter by date:</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={fetchStockBills}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Apply Filter
          </button>
        </div>
      </motion.div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8 bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 shadow-lg"
      >
        <h2 className="text-xl font-semibold mb-4 text-emerald-400">Products Sold Quantity</h2>
        <div className="h-80">
          {loading ? (
            <LoadingShimmer />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="product" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: "#1F2937", borderColor: "#10B981" }} />
                <Bar dataKey="totalSold" name="Quantity Sold" fill="#10B981" barSize={35} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              No data available for the selected period
            </div>
          )}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 shadow-lg"
      >
        <h2 className="text-xl font-semibold mb-4 text-emerald-400">Stock Bills Reconciliation Table</h2>
        
        {loading ? (
          <LoadingShimmer />
        ) : stockBills.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-gray-300">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-3 px-4 text-left">Bill ID</th>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Product</th>
                  <th className="py-3 px-4 text-right">Quantity Sold</th>
                  <th className="py-3 px-4 text-right">Stock Before</th>
                  <th className="py-3 px-4 text-right">Stock After</th>
                </tr>
              </thead>
              <tbody>
                {stockBills.map((item, index) => (
                  <tr 
                    key={`${item.bill_id}-${item.product}-${index}`}
                    className="border-b border-gray-700 hover:bg-gray-700/30"
                  >
                    <td className="py-3 px-4">{item.bill_id}</td>
                    <td className="py-3 px-4">
                      {new Date(item.bill_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">{item.product}</td>
                    <td className="py-3 px-4 text-right">{item.quantity_sold}</td>
                    <td className="py-3 px-4 text-right">{item.stock_before}</td>
                    <td className="py-3 px-4 text-right">{item.stock_after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No stock bills data available for the selected period
          </div>
        )}
      </motion.div>
    </div>
  );
};

const LoadingShimmer = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-2/3 h-4 bg-gray-700 rounded-full animate-pulse" />
  </div>
);

export default StockBillsReport;