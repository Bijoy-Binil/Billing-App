import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const StockStatementReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStockStatement();
  }, []);

  const fetchStockStatement = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await axios.get("http://127.0.0.1:8000/api/reports/stock-statement/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (error) {
      console.error("Error fetching stock statement:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-emerald-400 mb-6"
      >
        📦 Stock Statement Report
      </motion.h1>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="overflow-x-auto bg-gray-800/60 rounded-2xl p-4 shadow-lg border border-gray-700"
        >
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-700 text-gray-400 uppercase">
              <tr>
                <th className="py-2 px-3">#</th>
                <th className="py-2 px-3">Product</th>
                <th className="py-2 px-3">Opening Stock</th>
                <th className="py-2 px-3">Sold</th>
                <th className="py-2 px-3">Closing Stock</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-700 hover:bg-gray-700/40 transition"
                >
                  <td className="py-2 px-3">{idx + 1}</td>
                  <td className="py-2 px-3">{row.product}</td>
                  <td className="py-2 px-3">{row.opening_stock}</td>
                  <td className="py-2 px-3 text-yellow-400">{row.total_sold}</td>
                  <td className="py-2 px-3 text-emerald-400">{row.closing_stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
};

export default StockStatementReport;
