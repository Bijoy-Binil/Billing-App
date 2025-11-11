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
import { Package, AlertTriangle, TrendingUp, Box } from "lucide-react";

const API_PRODUCTS = "http://127.0.0.1:8000/api/products/";

const StockReport = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    let mounted = true;

    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get(API_PRODUCTS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data.results || res.data || [];
        if (mounted) setProducts(data);
      } catch (err) {
        console.error("Error loading products:", err);
        if (mounted) setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => (mounted = false);
  }, [token]);

  // ✅ Top 10 Products Chart Data
  const chartData = useMemo(() => {
    return [...products]
      .map((p) => ({
        name: p.name,
        quantity: Number(p.quantity || 0),
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [products]);

  // ✅ Low stock Highlighting
  const lowStock = useMemo(
    () => products.filter((p) => Number(p.quantity || 0) <= 20),
    [products]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ✅ PAGE TITLE */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between flex-wrap gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Stock Summary Report</h1>
              <p className="text-gray-600 text-sm mt-1">
                Inventory levels, shortages & product insights
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl shadow-lg font-semibold">
            {products.length} products
          </div>
        </motion.div>

        {/* ✅ STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KpiCard
            title="Total Products"
            value={products.length}
            gradient="from-blue-500 to-blue-600"
            icon={<Box className="w-6 h-6 text-white" />}
          />
          <KpiCard
            title="Low Stock (≤20)"
            value={lowStock.length}
            gradient="from-amber-400 to-orange-400"
            icon={<AlertTriangle className="w-6 h-6 text-white" />}
          />
          <KpiCard
            title="Highest Quantity"
            value={chartData.length ? chartData[0].quantity : 0}
            gradient="from-emerald-400 to-green-400"
            icon={<TrendingUp className="w-6 h-6 text-white" />}
          />
        </div>

        {/* ✅ CHART */}
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
              Top 10 Products by Quantity
            </h2>
          </div>

          <div className="h-72">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2"></div>
                  <p>Loading chart...</p>
                </div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>No product data</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 30 }}
                >
                  <CartesianGrid stroke="#E2E8F0" />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    width={180}
                  />
                  <Tooltip />
                  <defs>
                    <linearGradient id="qtyBar" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#60A5FA" />
                    </linearGradient>
                  </defs>
                  <Bar
                    dataKey="quantity"
                    fill="url(#qtyBar)"
                    radius={[8, 8, 8, 8]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* ✅ TABLE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl shadow-sm">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Product Inventory List
            </h3>
          </div>

          <div className="overflow-x-auto rounded-xl border border-blue-200 shadow-sm">
            <table className="min-w-[700px] w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="py-4 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">Name</th>
                  <th className="py-4 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">Manufacturer</th>
                  <th className="py-4 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">Cost Price</th>
                  <th className="py-4 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">Sell Price</th>
                  <th className="py-4 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">Quantity</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-blue-100">
                {products.length > 0 ? (
                  products.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-blue-50 transition-colors duration-200"
                    >
                      <td className="py-4 px-4 font-semibold text-gray-900">{p.name}</td>
                      <td className="py-4 px-4">
                        <span className="bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-200">
                          {p.manufacturer || "—"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                         ₹{Number(p.cost_price || 0).toFixed(2)}
                      </td>
                      <td className="py-4 px-4 font-bold text-emerald-600">
                         ₹{Number(p.price || p.sell_price || 0).toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                          p.quantity <= 20 
                            ? "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border-rose-200"
                            : "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200"
                        }`}>
                          {p.quantity}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <Package className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="text-gray-500 text-lg font-medium">No products available</p>
                        <p className="text-gray-400 text-sm mt-1">Add products to see inventory data</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, gradient, icon }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    className={`bg-gradient-to-r ${gradient} rounded-2xl p-6 shadow-lg text-white`}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium opacity-90">{title}</div>
        <div className="text-2xl font-bold mt-2">{value}</div>
      </div>
      <div className="text-white">
        {icon}
      </div>
    </div>
  </motion.div>
);

export default StockReport;