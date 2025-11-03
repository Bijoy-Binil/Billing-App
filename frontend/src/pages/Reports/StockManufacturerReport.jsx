import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const StockManufacturerReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManufacturerReport();
  }, []);

  const fetchManufacturerReport = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await axios.get("http://127.0.0.1:8000/api/reports/manufacturer/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (error) {
      console.error("Error fetching manufacturer report:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-indigo-400 mb-6"
      >
        🏭 Manufacturer Stock Report
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
                <th className="py-2 px-3">Manufacturer</th>
                <th className="py-2 px-3">Total Products</th>
                <th className="py-2 px-3">Total Stock Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <motion.tr
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(45,45,60,0.8)" }}
                  className="border-b border-gray-700 hover:bg-gray-700/40 transition"
                >
                  <td className="py-2 px-3 text-gray-300">{idx + 1}</td>
                  <td className="py-2 px-3 text-gray-100 font-medium">
                    {row.manufacturer || "—"}
                  </td>
                  <td className="py-2 px-3 text-gray-300">{row.total_products}</td>
                  <td className="py-2 px-3 text-emerald-400 font-semibold">
                    ₹{Number(row.total_stock_value).toFixed(2)}
                  </td>
                </motion.tr>
              ))}

              {data.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-gray-500 italic">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
};

export default StockManufacturerReport;
