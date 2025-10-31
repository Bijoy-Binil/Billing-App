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
import {
  Package,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

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
    return () => {
      mounted = false;
    };
  }, [token]);

  // Prepare top N by quantity for chart
  const chartData = useMemo(() => {
    return (products || [])
      .map((p) => ({ name: p.name, quantity: Number(p.quantity || 0) }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [products]);

  const lowStock = useMemo(
    () => products.filter((p) => Number(p.quantity || 0) <= 20),
    [products]
  );

  return (
    <div className="p-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-semibold mb-6 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent"
      >
        Stock Summary
      </motion.h1>

      {/* Stat Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <StatCard
          title="Total Products"
          value={`${products.length}`}
          icon={<Package className="w-6 h-6 text-emerald-400" />}
        />
        <StatCard
          title="Low Stock (≤20)"
          value={`${lowStock.length}`}
          icon={<AlertTriangle className="w-6 h-6 text-yellow-400" />}
        />
        <StatCard
          title="Top Product Qty"
          value={`${chartData.length ? chartData[0].quantity : 0}`}
          icon={<TrendingUp className="w-6 h-6 text-emerald-500" />}
        />
      </motion.div>

      {/* Chart Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800/60 p-5 rounded-2xl border border-gray-700 shadow-lg backdrop-blur-xl mb-6 hover:shadow-emerald-700/10 transition-all"
      >
        <h2 className="text-lg font-medium text-emerald-400 mb-4">
          Top 10 Products by Quantity
        </h2>
        <div style={{ height: 340 }}>
          {loading ? (
            <div className="text-gray-400 animate-pulse">Loading...</div>
          ) : chartData.length === 0 ? (
            <div className="text-gray-400">No product data</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="#2d3748" strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={220}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "10px",
                    color: "#fff",
                  }}
                />
                <Bar
                  dataKey="quantity"
                  fill="url(#barGradient)"
                  radius={[6, 6, 6, 6]}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#34D399" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.section>

      {/* Table Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800/60 p-5 rounded-2xl border border-gray-700 shadow-lg backdrop-blur-xl hover:shadow-emerald-700/10 transition-all"
      >
        <h3 className="text-md font-medium text-emerald-400 mb-3">
          Product List
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-[700px] text-left">
            <thead className="text-gray-400 text-sm border-b border-gray-700">
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Manufacturer</th>
                <th className="py-2">Cost Price</th>
                <th className="py-2">Sell Price</th>
                <th className="py-2">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-all"
                >
                  <td className="py-2 text-sm text-white">{p.name}</td>
                  <td className="py-2 text-sm text-gray-300">
                    {p.manufacturer || "—"}
                  </td>
                  <td className="py-2 text-sm text-gray-300">
                    ₹{Number(p.cost_price || 0).toFixed(2)}
                  </td>
                  <td className="py-2 text-sm text-emerald-400">
                    ₹{Number(p.price || p.sell_price || 0).toFixed(2)}
                  </td>
                  <td
                    className={`py-2 text-sm ${
                      p.quantity <= 20
                        ? "text-red-400"
                        : "text-gray-300"
                    }`}
                  >
                    {Number(p.quantity || 0)}
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center text-gray-400"
                  >
                    No products
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  );
};

/* 💎 Enhanced Stat Card with subtle glow & icon */
const StatCard = ({ title, value, icon }) => (
  <motion.div
    whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(16,185,129,0.2)" }}
    className="p-5 bg-gray-800/60 rounded-2xl border border-gray-700 backdrop-blur-xl flex items-center gap-4"
  >
    <div className="p-3 bg-emerald-500/10 rounded-full">{icon}</div>
    <div>
      <div className="text-sm text-gray-400">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  </motion.div>
);

export default StockReport;
