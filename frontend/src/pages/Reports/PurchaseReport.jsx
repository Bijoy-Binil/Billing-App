// src/pages/PurchaseReport.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

import {
  Truck,
  Filter,
  Download,
  Package,
  DollarSign,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// 💥 Import your video loader
import SectionLoader from "../../components/SectionLoader";

/* ---------------------------------------------------------
   API ROUTES
--------------------------------------------------------- */
const API_PURCHASES = "http://127.0.0.1:8000/api/reports/purchases/";
const API_SUPPLIERS = "http://127.0.0.1:8000/api/suppliers/";
const API_PRODUCTS = "http://127.0.0.1:8000/api/products/";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const PurchaseReport = () => {
  const [purchases, setPurchases] = useState([]);
  const [summary, setSummary] = useState({
    total_purchases: 0,
    total_quantity: 0,
    purchase_count: 0,
  });

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");

  const token = localStorage.getItem("accessToken");

  /* ---------------------------------------------------------
     INITIAL LOAD
  --------------------------------------------------------- */
  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
    fetchPurchases();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(API_SUPPLIERS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppliers(res.data.results || res.data || []);
    } catch {
      setSuppliers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(API_PRODUCTS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.results || res.data || []);
    } catch {
      setProducts([]);
    }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      let url = API_PURCHASES;
      const params = new URLSearchParams();

      if (fromDate && toDate) {
        params.append("start_date", fromDate);
        params.append("end_date", toDate);
      }
      if (selectedSupplier) params.append("supplier_id", selectedSupplier);
      if (selectedProduct) params.append("product_id", selectedProduct);

      if (params.toString()) url += `?${params.toString()}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPurchases(res.data.purchases || []);
      setSummary(res.data.summary || summary);
    } catch {
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setSelectedSupplier("");
    setSelectedProduct("");
  };

  /* ---------------------------------------------------------
     CHART DATA
  --------------------------------------------------------- */
  const supplierChartData = useMemo(() => {
    const map = {};
    purchases.forEach((p) => {
      if (!map[p.supplier]) {
        map[p.supplier] = { name: p.supplier, value: 0 };
      }
      map[p.supplier].value += Number(p.total);
    });
    return Object.values(map);
  }, [purchases]);

  const productChartData = useMemo(() => {
    const map = {};
    purchases.forEach((p) => {
      if (!map[p.product]) {
        map[p.product] = { product: p.product, quantity: 0, total: 0 };
      }
      map[p.product].quantity += Number(p.quantity);
      map[p.product].total += Number(p.total);
    });
    return Object.values(map);
  }, [purchases]);

  /* ---------------------------------------------------------
     CSV EXPORT
  --------------------------------------------------------- */
  const downloadCSV = useCallback(() => {
    if (!purchases.length) return;

    const headers = ["ID", "Date", "Supplier", "Product", "Quantity", "Cost", "Total"];

    const rows = purchases.map((p) => [
      p.purchase_id,
      new Date(p.created_at).toLocaleDateString(),
      p.supplier,
      p.product,
      p.quantity,
      p.cost_price,
      p.total,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `purchase_report_${fromDate || "all"}_${toDate || "all"}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }, [purchases, fromDate, toDate]);

  /* ---------------------------------------------------------
     PDF EXPORT
  --------------------------------------------------------- */
  const downloadPDF = useCallback(() => {
    if (!purchases.length) return;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Purchase Report", 14, 15);

    doc.setFontSize(10);
    doc.text(`Date Range: ${fromDate || "Start"} → ${toDate || "Now"}`, 14, 22);

    const tableRows = purchases.map((p) => [
      p.purchase_id,
      new Date(p.created_at).toLocaleDateString(),
      p.supplier,
      p.product,
      p.quantity,
      Number(p.cost_price).toFixed(2),
      Number(p.total).toFixed(2),
    ]);

    autoTable(doc, {
      startY: 30,
      head: [["ID", "Date", "Supplier", "Product", "Qty", "Cost", "Total"]],
      body: tableRows,
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
    });

    doc.save(`purchase_report_${fromDate || "all"}_${toDate || "all"}.pdf`);
  }, [purchases, fromDate, toDate]);

  /* ---------------------------------------------------------
     GLOBAL LOADER
  --------------------------------------------------------- */
  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <SectionLoader />
      </div>
    );
  }

  /* ---------------------------------------------------------
     UI START
  --------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl shadow-lg">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Purchase Report
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">
                Track purchase orders, suppliers, and product spend
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl shadow-lg font-semibold text-sm sm:text-base">
            {purchases.length} records
          </div>
        </motion.div>

        {/* FILTER SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="p-2 bg-blue-600 rounded-lg sm:rounded-xl shadow-sm">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>

            <span className="text-gray-700 font-medium text-lg sm:text-xl">
              Filters
            </span>
          </div>

          {/* Filter Inputs */}
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-start lg:items-end">

            {/* GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">

              {/* From */}
              <div>
                <label className="text-gray-700 text-xs sm:text-sm font-medium mb-1 block">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm text-sm sm:text-base"
                />
              </div>

              {/* To */}
              <div>
                <label className="text-gray-700 text-xs sm:text-sm font-medium mb-1 block">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm text-sm sm:text-base"
                />
              </div>

              {/* Supplier */}
              <div>
                <label className="text-gray-700 text-xs sm:text-sm font-medium mb-1 block">
                  Supplier
                </label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm text-sm sm:text-base"
                >
                  <option value="">All Suppliers</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product */}
              <div>
                <label className="text-gray-700 text-xs sm:text-sm font-medium mb-1 block">
                  Product
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm text-sm sm:text-base"
                >
                  <option value="">All Products</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full lg:w-auto">

              {/* Apply */}
              <button
                onClick={fetchPurchases}
                disabled={loading}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl shadow flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                Apply
              </button>

              {/* Clear */}
              <button
                onClick={clearFilters}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg sm:rounded-xl shadow border border-gray-300 text-sm sm:text-base"
              >
                Clear
              </button>

              {/* CSV */}
              <button
                onClick={downloadCSV}
                disabled={!purchases.length}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg sm:rounded-xl shadow flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                CSV
              </button>

              {/* PDF */}
              <button
                onClick={downloadPDF}
                disabled={!purchases.length}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg sm:rounded-xl shadow flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                PDF
              </button>
            </div>
          </div>
        </motion.div>

        {/* KPI CARDS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          {/* Total value */}
          <KpiCard
            title="Total Purchase Value"
            value={`₹${summary.total_purchases.toFixed(2)}`}
            gradient="from-blue-500 to-indigo-600"
            icon={<DollarSign className="w-6 h-6 text-white" />}
          />

          <KpiCard
            title="Total Quantity"
            value={summary.total_quantity}
            gradient="from-emerald-400 to-green-500"
            icon={<Package className="w-6 h-6 text-white" />}
          />

          <KpiCard
            title="Purchase Orders"
            value={summary.purchase_count}
            gradient="from-amber-400 to-orange-500"
            icon={<Truck className="w-6 h-6 text-white" />}
          />
        </motion.div>

        {/* ---------- CHART SECTION ---------- */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Supplier Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
          >
            <ChartHeader
              icon={
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              }
              title="Purchase by Supplier"
              gradient="from-purple-500 to-purple-600"
            />

            <div className="h-64 sm:h-72">
              {!supplierChartData.length ? (
                <ChartEmpty />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={supplierChartData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      label={({ name, value }) =>
                        `${name}: ₹${value.toFixed(2)}`
                      }
                    >
                      {supplierChartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`₹${Number(v).toFixed(2)}`, "Value"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Product Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
          >
            <ChartHeader
              icon={<Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
              title="Purchase by Product"
              gradient="from-amber-400 to-orange-500"
            />

            <div className="h-64 sm:h-72">
              {!productChartData.length ? (
                <ChartEmpty />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="product"
                      angle={-40}
                      textAnchor="end"
                      height={60}
                      fontSize={11}
                    />
                    <YAxis fontSize={12} />

                    <Tooltip
                      formatter={(v, n) =>
                        n === "quantity"
                          ? [v, "Qty"]
                          : [`₹${v.toFixed(2)}`, "Total"]
                      }
                    />

                    <defs>
                      <linearGradient id="prodQtyBar" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.85} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.25} />
                      </linearGradient>
                    </defs>

                    <Bar
                      dataKey="quantity"
                      fill="url(#prodQtyBar)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        </div>

        {/* ---------- PURCHASE TABLE ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-blue-200 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row justify-between mb-6">
            <ChartHeader
              icon={<Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
              title="Purchase Orders"
              gradient="from-emerald-400 to-green-500"
            />

            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-2 rounded-lg text-white font-semibold shadow">
              Total: {purchases.length} orders
            </div>
          </div>

          {!purchases.length ? (
            <ChartEmpty />
          ) : (
            <div className="overflow-x-auto border border-blue-200 rounded-lg">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-blue-50">
                  <tr>
                    <Th>ID</Th>
                    <Th>Date</Th>
                    <Th>Supplier</Th>
                    <Th>Product</Th>
                    <Th align="right">Qty</Th>
                    <Th align="right">Cost</Th>
                    <Th align="right">Total</Th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-blue-100">
                  {purchases.map((p) => (
                    <tr key={p.purchase_id} className="hover:bg-blue-50">
                      <Td>#{p.purchase_id}</Td>
                      <Td>{new Date(p.created_at).toLocaleDateString()}</Td>

                      <Td>
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                          {p.supplier}
                        </span>
                      </Td>

                      <Td>{p.product}</Td>

                      <Td align="right" className="font-bold text-blue-700">
                        {p.quantity}
                      </Td>

                      <Td align="right">
                        ₹{Number(p.cost_price).toFixed(2)}
                      </Td>

                      <Td align="right" className="font-bold text-emerald-600">
                        ₹{Number(p.total).toFixed(2)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Footer */}
              <div className="bg-green-50 border-t border-green-200 p-4 flex justify-between">
                <span className="font-semibold text-gray-900">Grand Total</span>
                <span className="font-bold text-emerald-700 text-lg">
                  ₹{summary.total_purchases.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

/* ---------- EXTRA COMPONENTS ---------- */

// KPI
const KpiCard = ({ title, value, gradient, icon }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`bg-gradient-to-r ${gradient} rounded-xl p-5 shadow-lg text-white flex items-center justify-between`}
  >
    <div>
      <p className="text-xs opacity-90">{title}</p>
      <h2 className="text-2xl font-bold mt-1">{value}</h2>
    </div>
    {icon}
  </motion.div>
);

// Table Header Cell
const Th = ({ children, align = "left" }) => (
  <th
    className={`py-3 px-4 text-${align} font-bold text-gray-700 uppercase text-xs`}
  >
    {children}
  </th>
);

// Table Data Cell
const Td = ({ children, align = "left", className = "" }) => (
  <td className={`py-3 px-4 text-${align} ${className}`}>{children}</td>
);

// Chart Header
const ChartHeader = ({ icon, title, gradient }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className={`p-2 bg-gradient-to-r ${gradient} rounded-lg shadow`}>
      {icon}
    </div>
    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
  </div>
);

// Empty State with SectionLoader
const ChartEmpty = () => (
  <div className="h-full flex items-center justify-center">
    <SectionLoader />
  </div>
);

export default PurchaseReport;
