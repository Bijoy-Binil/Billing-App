import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
        const res = await axios.get(API_PRODUCTS, { headers: { Authorization: `Bearer ${token}` } });
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
    return () => { mounted = false; };
  }, [token]);

  // Prepare top N by quantity for chart
  const chartData = useMemo(() => {
    return (products || [])
      .map((p) => ({ name: p.name, quantity: Number(p.quantity || 0) }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [products]);

  const lowStock = useMemo(() => products.filter((p) => Number(p.quantity || 0) <= 20), [products]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Stock Summary</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Products" value={`${products.length}`} />
        <StatCard title="Low stock (<=20)" value={`${lowStock.length}`} />
        <StatCard title="Top product qty" value={`${chartData.length ? chartData[0].quantity : 0}`} />
      </div>

      <section className="bg-gray-800/60 p-4 rounded-xl border border-gray-700 mb-6">
        <h2 className="text-lg font-medium text-emerald-400 mb-3">Top 10 Products by Quantity</h2>
        <div style={{ height: 340 }}>
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : chartData.length === 0 ? (
            <div className="text-gray-400">No product data</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="#2d3748" strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={220} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#10B981" radius={[6, 6, 6, 6]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="bg-gray-800/60 p-4 rounded-xl border border-gray-700">
        <h3 className="text-md font-medium text-emerald-400 mb-3">Product list</h3>
        <div className="overflow-x-auto">
          <table className="min-w-[700px]">
            <thead className="text-gray-400 text-sm">
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
                <tr key={p.id} className="border-t border-gray-700">
                  <td className="py-2 text-sm text-white">{p.name}</td>
                  <td className="py-2 text-sm text-gray-200">{p.manufacturer || "—"}</td>
                  <td className="py-2 text-sm text-gray-200">₹{Number(p.cost_price || 0).toFixed(2)}</td>
                  <td className="py-2 text-sm text-emerald-400">₹{Number(p.price || p.sell_price || 0).toFixed(2)}</td>
                  <td className="py-2 text-sm text-gray-400">{Number(p.quantity || 0)}</td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-gray-400">No products</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700">
    <div className="text-sm text-gray-400">{title}</div>
    <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
  </div>
);

export default StockReport;
