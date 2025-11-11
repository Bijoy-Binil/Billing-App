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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Calendar, Filter, DollarSign, Package, Truck, Download } from "lucide-react";

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
    } catch (err) {
      console.error("Error loading suppliers:", err);
      setSuppliers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(API_PRODUCTS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.results || res.data || []);
    } catch (err) {
      console.error("Error loading products:", err);
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
      
      if (selectedSupplier) {
        params.append("supplier_id", selectedSupplier);
      }
      
      if (selectedProduct) {
        params.append("product_id", selectedProduct);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setPurchases(res.data.purchases || []);
      setSummary(res.data.summary || {
        total_purchases: 0,
        total_quantity: 0,
        purchase_count: 0,
      });
    } catch (err) {
      console.error("Error loading purchase report:", err);
      setPurchases([]);
      setSummary({
        total_purchases: 0,
        total_quantity: 0,
        purchase_count: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchPurchases();
  };

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setSelectedSupplier("");
    setSelectedProduct("");
  };

  // Prepare data for supplier chart
  const supplierChartData = useMemo(() => {
    const supplierMap = {};
    
    purchases.forEach(item => {
      if (!supplierMap[item.supplier]) {
        supplierMap[item.supplier] = {
          name: item.supplier,
          value: 0
        };
      }
      supplierMap[item.supplier].value += parseFloat(item.total);
    });
    
    return Object.values(supplierMap);
  }, [purchases]);

  // Prepare data for product chart
  const productChartData = useMemo(() => {
    const productMap = {};
    
    purchases.forEach(item => {
      if (!productMap[item.product]) {
        productMap[item.product] = {
          product: item.product,
          quantity: 0,
          total: 0
        };
      }
      productMap[item.product].quantity += item.quantity;
      productMap[item.product].total += parseFloat(item.total);
    });
    
    return Object.values(productMap);
  }, [purchases]);

  const exportToCSV = () => {
    const headers = ["Purchase ID", "Date", "Supplier", "Product", "Quantity", "Cost", "Total"];
    const csvData = purchases.map(purchase => [
      purchase.purchase_id,
      new Date(purchase.created_at).toLocaleDateString(),
      purchase.supplier,
      purchase.product,
      purchase.quantity,
      purchase.cost_price,
      purchase.total
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "purchase-report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-linear-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Purchase Report
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Track purchase orders and supplier performance
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              disabled={purchases.length === 0}
              className="px-6 py-3 bg-linear-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl shadow-lg flex items-center gap-2 font-semibold transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-r from-white to-blue-50 border border-blue-200 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-linear-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-white border border-blue-300 rounded-xl px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-white border border-blue-300 rounded-xl px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Supplier</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full bg-white border border-blue-300 rounded-xl px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full bg-white border border-blue-300 rounded-xl px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
              >
                <option value="">All Products</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-linear-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl border border-gray-300 shadow-sm transition-all font-medium"
            >
              Clear Filters
            </button>
            <button
              onClick={handleFilter}
              className="px-6 py-3 bg-linear-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl shadow-lg transition-all font-semibold flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Apply Filters
            </button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <KpiCard
            title="Total Purchase Value"
            value={` ₹${summary.total_purchases.toFixed(2)}`}
            gradient="from-blue-500 to-blue-600"
            icon={<DollarSign className="w-6 h-6 text-white" />}
          />
          <KpiCard
            title="Total Quantity"
            value={summary.total_quantity}
            gradient="from-emerald-400 to-green-400"
            icon={<Package className="w-6 h-6 text-white" />}
          />
          <KpiCard
            title="Purchase Orders"
            value={summary.purchase_count}
            gradient="from-amber-400 to-orange-400"
            icon={<Truck className="w-6 h-6 text-white" />}
          />
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-linear-to-r from-white to-blue-50 border border-blue-200 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-linear-to-r from-purple-500 to-purple-600 rounded-xl shadow-sm">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Purchase by Supplier
              </h2>
            </div>

            <div className="h-72">
              {loading ? (
                <LoadingShimmer />
              ) : supplierChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={supplierChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}:  ₹${value.toFixed(2)}`}
                    >
                      {supplierChartData.map((entry, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [` ₹${value.toFixed(2)}`, 'Value']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No supplier data available</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-linear-to-r from-white to-blue-50 border border-blue-200 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-linear-to-r from-amber-400 to-orange-400 rounded-xl shadow-sm">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Purchase by Product
              </h2>
            </div>

            <div className="h-72">
              {loading ? (
                <LoadingShimmer />
              ) : productChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="product" fontSize={12} angle={-40} textAnchor="end" />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value, name) => [name === 'quantity' ? value : ` ₹${value.toFixed(2)}`, name === 'quantity' ? 'Quantity' : 'Total']} />
                    <defs>
                      <linearGradient id="quantityBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <Bar dataKey="quantity" fill="url(#quantityBar)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No product data available</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Purchase Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-r from-white to-blue-50 border border-blue-200 rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-linear-to-r from-emerald-400 to-green-400 rounded-xl shadow-sm">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Purchase Orders</h2>
            </div>
            <div className="bg-linear-to-r from-amber-400 to-orange-400 text-white px-4 py-2 rounded-xl shadow-lg font-semibold">
              Total: {purchases.length} orders
            </div>
          </div>

          {loading ? (
            <LoadingShimmer />
          ) : purchases.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-blue-200 shadow-sm">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="bg-linear-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="py-4 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">Purchase ID</th>
                    <th className="py-4 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">Date</th>
                    <th className="py-4 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">Supplier</th>
                    <th className="py-4 px-4 text-left font-bold text-gray-700 uppercase tracking-wide text-xs">Product</th>
                    <th className="py-4 px-4 text-right font-bold text-gray-700 uppercase tracking-wide text-xs">Qty</th>
                    <th className="py-4 px-4 text-right font-bold text-gray-700 uppercase tracking-wide text-xs">Cost</th>
                    <th className="py-4 px-4 text-right font-bold text-gray-700 uppercase tracking-wide text-xs">Total</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-blue-100">
                  {purchases.map((purchase) => (
                    <tr key={purchase.purchase_id} className="hover:bg-blue-50 transition-colors duration-200">
                      <td className="py-4 px-4 font-semibold text-gray-900">{purchase.purchase_id}</td>
                      <td className="py-4 px-4 text-gray-700">
                        {new Date(purchase.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-linear-to-r from-amber-50 to-orange-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-200">
                          {purchase.supplier}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-900">{purchase.product}</td>

                      <td className="py-4 px-4 text-right font-bold text-blue-600">
                        {purchase.quantity}
                      </td>

                      <td className="py-4 px-4 text-right text-gray-700">
                         ₹{parseFloat(purchase.cost_price).toFixed(2)}
                      </td>

                      <td className="py-4 px-4 text-right font-bold text-emerald-600 text-lg">
                         ₹{parseFloat(purchase.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer total */}
              <div className="bg-linear-to-r from-emerald-50 to-green-50 border-t border-emerald-200 p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Grand Total</span>
                  <span className="text-xl font-bold text-emerald-600">
                     ₹{summary.total_purchases.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-lg font-medium">No purchase data available</p>
              <p className="text-gray-400 text-sm mt-1">Purchase data will appear once purchase orders are created</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, gradient, icon }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    className={`bg-linear-to-r ${gradient} rounded-2xl p-6 shadow-lg text-white`}
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

const LoadingShimmer = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 text-sm">Loading data...</p>
    </div>
  </div>
);

export default PurchaseReport;