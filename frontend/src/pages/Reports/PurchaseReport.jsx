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
import { Calendar, Filter, DollarSign, Package, Truck } from "lucide-react";

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

  return (
    <div className="p-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-semibold mb-6 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent"
      >
        Purchase Report
      </motion.h1>

      {/* Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 shadow-lg"
      >
        <h2 className="text-xl font-semibold mb-4 text-emerald-400">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Supplier</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            <label className="block text-sm text-gray-400 mb-1">Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleFilter}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
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
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
      >
        <SummaryCard
          title="Total Purchase Value"
          value={`₹${summary.total_purchases.toFixed(2)}`}
          icon={<DollarSign className="w-6 h-6 text-emerald-400" />}
        />
        <SummaryCard
          title="Total Quantity"
          value={summary.total_quantity}
          icon={<Package className="w-6 h-6 text-emerald-400" />}
        />
        <SummaryCard
          title="Purchase Orders"
          value={summary.purchase_count}
          icon={<Truck className="w-6 h-6 text-emerald-400" />}
        />
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Supplier Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">Purchase by Supplier</h2>
          <div className="h-80">
            {loading ? (
              <LoadingShimmer />
            ) : supplierChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={supplierChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {supplierChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                No data available for the selected filters
              </div>
            )}
          </div>
        </motion.div>

        {/* Product Quantity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">Purchase by Product</h2>
          <div className="h-80">
            {loading ? (
              <LoadingShimmer />
            ) : productChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="product" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: "#1F2937", borderColor: "#10B981" }} />
                  <Bar dataKey="quantity" name="Quantity" fill="#10B981" barSize={35} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                No data available for the selected filters
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Purchase Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 shadow-lg"
      >
        <h2 className="text-xl font-semibold mb-4 text-emerald-400">Purchase Orders</h2>
        
        {loading ? (
          <LoadingShimmer />
        ) : purchases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-gray-300">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-3 px-4 text-left">Purchase ID</th>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Supplier</th>
                  <th className="py-3 px-4 text-left">Product</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr 
                    key={purchase.purchase_id}
                    className="border-b border-gray-700 hover:bg-gray-700/30"
                  >
                    <td className="py-3 px-4">{purchase.purchase_id}</td>
                    <td className="py-3 px-4">
                      {new Date(purchase.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">{purchase.supplier}</td>
                    <td className="py-3 px-4">{purchase.product}</td>
                    <td className="py-3 px-4 text-right">{purchase.quantity}</td>
                    <td className="py-3 px-4 text-right">₹{parseFloat(purchase.cost_price).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">₹{parseFloat(purchase.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-700 font-semibold">
                  <td colSpan="4" className="py-3 px-4 text-right">Total:</td>
                  <td className="py-3 px-4 text-right">{summary.total_quantity}</td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-right">₹{summary.total_purchases.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No purchase data available for the selected filters
          </div>
        )}
      </motion.div>
    </div>
  );
};

const SummaryCard = ({ title, value, icon }) => (
  <motion.div
    whileHover={{ scale: 1.03, boxShadow: "0 0 15px rgba(16,185,129,0.3)" }}
    className="p-6 rounded-2xl bg-gray-800/60 border border-gray-700 backdrop-blur-xl shadow-inner"
  >
    <div className="flex justify-between items-center">
      <div>
        <div className="text-sm text-gray-400 tracking-wide">{title}</div>
        <div className="mt-2 text-3xl font-semibold text-emerald-400 drop-shadow-[0_0_6px_#10b981]">
          {value}
        </div>
      </div>
      <div className="bg-gray-700/50 p-3 rounded-full">
        {icon}
      </div>
    </div>
  </motion.div>
);

const LoadingShimmer = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-2/3 h-4 bg-gray-700 rounded-full animate-pulse" />
  </div>
);

export default PurchaseReport;