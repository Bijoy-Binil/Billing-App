import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  Box,
  FileText,
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
    return () => (mounted = false);
  }, [token]);

  // Top 10 chart data
  const chartData = useMemo(() => {
    return [...products]
      .map((p) => ({
        name: p.name,
        quantity: Number(p.quantity || 0),
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [products]);

  const lowStock = useMemo(
    () => products.filter((p) => Number(p.quantity || 0) <= 20),
    [products]
  );

  const fmtINR = (n) => `₹${Number(n || 0).toFixed(2)}`;

  /* ---------------------- EXPORT CSV ----------------------- */
  const downloadCSV = useCallback(() => {
    if (!products.length) return;

    const headers = [
      "Name",
      "Manufacturer",
      "Cost Price",
      "Sell Price",
      "Quantity",
    ];

    const rows = products.map((p) => [
      p.name,
      p.manufacturer || "-",
      Number(p.cost_price || 0).toFixed(2),
      Number(p.price || p.sell_price || 0).toFixed(2),
      Number(p.quantity || 0),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "stock_report.csv";
    a.click();

    URL.revokeObjectURL(url);
  }, [products]);

  /* ---------------------- EXPORT PDF ----------------------- */
  const downloadPDF = useCallback(async () => {
    if (!products.length) return;

    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text("Stock Report", 14, 15);

    const body = products.map((p) => [
      p.name,
      p.manufacturer || "-",
      `INR ${Number(p.cost_price || 0).toFixed(2)}`,
      `INR ${Number(p.price || p.sell_price || 0).toFixed(2)}`,
      p.quantity,
    ]);

    autoTable(doc, {
      startY: 25,
      head: [["Name", "Manufacturer", "Cost", "Price", "Qty"]],
      body,
      styles: { font: "helvetica", fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save("stock_report.pdf");
  }, [products]);

  /* ---------------------- UI START ------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* PAGE HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl sm:rounded-2xl shadow-lg">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Stock Summary Report
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">
                Inventory levels, shortages & product insights
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl shadow-lg font-semibold text-sm sm:text-base">
            {products.length} products
          </div>
        </motion.div>

        {/* EXPORT BUTTONS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 sm:gap-3 bg-white border border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-md"
        >
          <button
            onClick={downloadCSV}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl shadow flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
            Download CSV
          </button>

          <button
            onClick={downloadPDF}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg sm:rounded-xl shadow flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
            Download PDF
          </button>
        </motion.div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <KpiCard
            title="Total Products"
            value={products.length}
            gradient="from-indigo-500 to-blue-600"
            icon={<Box className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
          />
          <KpiCard
            title="Low Stock (≤20)"
            value={lowStock.length}
            gradient="from-amber-400 to-orange-500"
            icon={<AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
          />
          <KpiCard
            title="Top Quantity"
            value={chartData.length ? chartData[0].quantity : 0}
            gradient="from-emerald-500 to-green-500"
            icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
          />
        </div>

        {/* TOP 10 CHART */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="p-2 bg-blue-600 rounded-lg sm:rounded-xl shadow-sm">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Top 10 Products by Quantity
            </h2>
          </div>

          <div className="h-64 sm:h-72">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                Loading chart...
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center text-gray-400 h-full">
                No chart data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid stroke="#E2E8F0" />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <defs>
                    <linearGradient id="qtyBar" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#60A5FA" />
                    </linearGradient>
                  </defs>

                  <Bar dataKey="quantity" fill="url(#qtyBar)" radius={[6, 6, 6, 6]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* FULL INVENTORY TABLE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-blue-200 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6"
        >
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="p-2 bg-indigo-500 rounded-lg sm:rounded-xl shadow-sm">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Product Inventory List
            </h3>
          </div>

          <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-blue-100 shadow-sm">
            <table className="min-w-[600px] w-full text-xs sm:text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="py-3 px-3 sm:py-4 sm:px-4 text-left text-gray-700 font-bold text-xs">Name</th>
                  <th className="py-3 px-3 sm:py-4 sm:px-4 text-left text-gray-700 font-bold text-xs">Manufacturer</th>
                  <th className="py-3 px-3 sm:py-4 sm:px-4 text-left text-gray-700 font-bold text-xs">Cost</th>
                  <th className="py-3 px-3 sm:py-4 sm:px-4 text-left text-gray-700 font-bold text-xs">Sell</th>
                  <th className="py-3 px-3 sm:py-4 sm:px-4 text-left text-gray-700 font-bold text-xs">Qty</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-blue-100">
                {products.length ? (
                  products.map((p) => (
                    <tr className="hover:bg-blue-50" key={p.id}>
                      <td className="py-3 px-3 sm:py-4 sm:px-4 font-semibold text-gray-900">{p.name}</td>
                     
                      <td className="py-3 px-3 sm:py-4 sm:px-4"> 
                        <span className="bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium border border-amber-200">
                          {p.manufacturer || "-"} 
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:py-4 sm:px-4 text-gray-700">
                        {fmtINR(p.cost_price)}
                      </td>
                      <td className="py-3 px-3 sm:py-4 sm:px-4 text-indigo-600 font-bold">
                        {fmtINR(p.price || p.sell_price)}
                      </td>
                      <td className="py-3 px-3 sm:py-4 sm:px-4">
                        <span
                          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold ${
                            p.quantity <= 20
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-green-50 text-green-700 border border-green-200"
                          }`}
                        >
                          {p.quantity}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 sm:py-12 text-gray-500">
                      No products found.
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

/* KPI Component */
const KpiCard = ({ title, value, gradient, icon }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`bg-gradient-to-r ${gradient} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg text-white`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs sm:text-sm opacity-90">{title}</p>
        <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">{value}</p>
      </div>
      {icon}
    </div>
  </motion.div>
);

export default StockReport;