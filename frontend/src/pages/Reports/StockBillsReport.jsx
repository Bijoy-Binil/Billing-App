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

/* ---------------------------------------------------------
   ✅ API ROUTES
--------------------------------------------------------- */
const API_PURCHASES = "http://127.0.0.1:8000/api/reports/purchases/";
const API_SUPPLIERS = "http://127.0.0.1:8000/api/suppliers/";
const API_PRODUCTS = "http://127.0.0.1:8000/api/products/";

/* ---------------------------------------------------------
   ✅ SAFE COLORS FOR CHARTS
--------------------------------------------------------- */
const COLORS = [
  "#10B981",
  "#3B82F6",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

/* ---------------------------------------------------------
   ✅ MAIN COMPONENT
--------------------------------------------------------- */
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
     ✅ INITIAL LOAD
  --------------------------------------------------------- */
  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
    fetchPurchases();
  }, []);

  /* ---------------------------------------------------------
     ✅ FETCH SUPPLIERS
  --------------------------------------------------------- */
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

  /* ---------------------------------------------------------
     ✅ FETCH PRODUCTS
  --------------------------------------------------------- */
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

  /* ---------------------------------------------------------
     ✅ FETCH PURCHASE DATA
  --------------------------------------------------------- */
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
    } catch (err) {
      console.error("Error fetching purchase data:", err);
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
     ✅ SUPPLIER PIE CHART DATA
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

  /* ---------------------------------------------------------
     ✅ PRODUCT BAR CHART DATA
  --------------------------------------------------------- */
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
     ✅ CSV EXPORT (FILTERED)
  --------------------------------------------------------- */
  const downloadCSV = useCallback(() => {
    if (!purchases.length) return;

    const headers = [
      "ID",
      "Date",
      "Supplier",
      "Product",
      "Quantity",
      "Cost",
      "Total",
    ];

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
    a.download = `purchase_report_${fromDate || "all"}_${toDate ||
      "all"}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }, [purchases, fromDate, toDate]);

  /* ---------------------------------------------------------
     ✅ PDF EXPORT (FILTERED)
  --------------------------------------------------------- */
  const downloadPDF = useCallback(() => {
    if (!purchases.length) return;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Purchase Report", 14, 15);

    doc.setFontSize(10);
    doc.text(
      `Date Range: ${fromDate || "Start"} → ${toDate || "Now"}`,
      14,
      22
    );

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
      head: [
        ["ID", "Date", "Supplier", "Product", "Qty", "Cost", "Total"],
      ],
      body: tableRows,
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
    });

    doc.save(
      `purchase_report_${fromDate || "all"}_${toDate || "all"}.pdf`
    );
  }, [purchases, fromDate, toDate]);
  
  /* ---------------------------------------------------------
     ✅ UI
  --------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {/* ✅ HEADER */}
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

        {/* ✅ FILTERS + EXPORT BUTTONS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
        >
          {/* Title */}
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="p-2 bg-blue-600 rounded-lg sm:rounded-xl shadow-sm">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-gray-700 font-medium text-lg sm:text-xl">
              Filters
            </span>
          </div>

          {/* Inputs */}
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-start lg:items-end">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
              <div>
                <label className="text-gray-700 text-xs sm:text-sm font-medium mb-1 block">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="text-gray-700 text-xs sm:text-sm font-medium mb-1 block">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
                />
              </div>

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
              <button
                onClick={fetchPurchases}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl shadow flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50"
                disabled={loading}
              >
                <Filter className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`} />
                Apply
              </button>

              <button
                onClick={clearFilters}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg sm:rounded-xl shadow border border-gray-300 text-sm sm:text-base"
                disabled={loading}
              >
                Clear
              </button>

              <button
                onClick={downloadCSV}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg sm:rounded-xl shadow flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-60"
                disabled={!purchases.length}
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                CSV
              </button>

              <button
                onClick={downloadPDF}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg sm:rounded-xl shadow flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-60"
                disabled={!purchases.length}
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                PDF
              </button>
            </div>
          </div>
        </motion.div>

        {/* ✅ KPI CARDS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm opacity-90">Total Purchase Value</div>
                <div className="text-xl sm:text-2xl font-bold">
                  ₹{summary.total_purchases.toFixed(2)}
                </div>
              </div>
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-400 to-green-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm opacity-90">Total Quantity</div>
                <div className="text-xl sm:text-2xl font-bold">{summary.total_quantity}</div>
              </div>
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm opacity-90">Purchase Orders</div>
                <div className="text-xl sm:text-2xl font-bold">{summary.purchase_count}</div>
              </div>
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
        </motion.div>

        {/* ✅ CHARTS */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">

          {/* Supplier Pie */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg sm:rounded-xl">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Purchase by Supplier
              </h2>
            </div>

            <div className="h-64 sm:h-72">
              {loading ? (
                <LoadingShimmer />
              ) : supplierChartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={supplierChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ₹${value.toFixed(2)}`}
                    >
                      {supplierChartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`₹${Number(value).toFixed(2)}`, "Value"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No supplier data available
                </div>
              )}
            </div>
          </motion.div>

          {/* Product Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="p-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg sm:rounded-xl">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Purchase by Product
              </h2>
            </div>

            <div className="h-64 sm:h-72">
              {loading ? (
                <LoadingShimmer />
              ) : productChartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="product"
                      fontSize={12}
                      angle={-40}
                      textAnchor="end"
                    />
                    <YAxis fontSize={12} />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "quantity"
                          ? value
                          : `₹${Number(value).toFixed(2)}`,
                        name === "quantity" ? "Quantity" : "Total",
                      ]}
                    />

                    <defs>
                      <linearGradient id="quantityBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.85} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.25} />
                      </linearGradient>
                    </defs>

                    <Bar
                      dataKey="quantity"
                      fill="url(#quantityBar)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No product data available
                </div>
              )}
            </div>
          </motion.div>
        </div>
        
        {/* ✅ PURCHASE TABLE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-blue-200 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-emerald-400 to-green-500 rounded-lg sm:rounded-xl">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Purchase Orders
              </h2>
            </div>

            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl shadow-lg font-semibold text-sm sm:text-base">
              Total: {purchases.length} orders
            </div>
          </div>

          {loading ? (
            <LoadingShimmer />
          ) : purchases.length > 0 ? (
            <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-blue-200 shadow-sm">
              <table className="w-full min-w-[900px] text-xs sm:text-sm">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 text-left font-bold text-gray-700 text-xs">
                      ID
                    </th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 text-left font-bold text-gray-700 text-xs">
                      Date
                    </th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 text-left font-bold text-gray-700 text-xs">
                      Supplier
                    </th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 text-left font-bold text-gray-700 text-xs">
                      Product
                    </th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 text-right font-bold text-gray-700 text-xs">
                      Qty
                    </th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 text-right font-bold text-gray-700 text-xs">
                      Cost
                    </th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 text-right font-bold text-gray-700 text-xs">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-blue-100">
                  {purchases.map((p) => (
                    <tr key={p.purchase_id} className="hover:bg-blue-50">
                      <td className="py-3 px-3 sm:py-4 sm:px-4 font-semibold text-gray-900">
                        #{p.purchase_id}
                      </td>

                      <td className="py-3 px-3 sm:py-4 sm:px-4 text-gray-700">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-3 sm:py-4 sm:px-4">
                        <span className="bg-blue-50 text-blue-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs border border-blue-200">
                          {p.supplier}
                        </span>
                      </td>

                      <td className="py-3 px-3 sm:py-4 sm:px-4">{p.product}</td>

                      <td className="py-3 px-3 sm:py-4 sm:px-4 text-right font-bold text-blue-700">
                        {p.quantity}
                      </td>

                      <td className="py-3 px-3 sm:py-4 sm:px-4 text-right text-gray-700">
                        ₹{Number(p.cost_price).toFixed(2)}
                      </td>

                      <td className="py-3 px-3 sm:py-4 sm:px-4 text-right font-bold text-emerald-600">
                        ₹{Number(p.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ✅ FOOTER TOTAL */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-t border-emerald-200 p-3 sm:p-4">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">
                    Grand Total
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-emerald-600">
                    ₹{summary.total_purchases.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 text-gray-500">
              No purchase data available.
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

/* ✅ Loading Spinner */
const LoadingShimmer = () => (
  <div className="w-full h-full flex items-center justify-center py-8 sm:py-10">
    <div className="flex flex-col items-center">
      <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-gray-500 mt-2 text-sm">Loading...</p>
    </div>
  </div>
);

export default PurchaseReport;