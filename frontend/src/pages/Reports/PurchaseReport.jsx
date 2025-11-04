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
    <div className="p-4 sm:p-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent text-center sm:text-left"
      >
        Purchase Report
      </motion.h1>

      {/* Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
      >
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-emerald-400">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm text-gray-400 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm sm:text-base text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-gray-400 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm sm:text-base text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-gray-400 mb-1">Supplier</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm sm:text-base text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            <label className="block text-xs sm:text-sm text-gray-400 mb-1">Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm sm:text-base text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
        <div className="mt-4 flex justify-center sm:justify-end">
          <button
            onClick={handleFilter}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6"
      >
        <SummaryCard
          title="Total Purchase Value"
          value={`₹${summary.total_purchases.toFixed(2)}`}
          icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />}
        />
        <SummaryCard
          title="Total Quantity"
          value={summary.total_quantity}
          icon={<Package className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />}
        />
        <SummaryCard
          title="Purchase Orders"
          value={summary.purchase_count}
          icon={<Truck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />}
        />
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Supplier Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
        >
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-emerald-400">Purchase by Supplier</h2>
          <div className="h-64 sm:h-80">
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
                    outerRadius={60}
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
              <div className="h-full flex items-center justify-center text-gray-400 text-sm sm:text-base">
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
          className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
        >
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-emerald-400">Purchase by Product</h2>
          <div className="h-64 sm:h-80">
            {loading ? (
              <LoadingShimmer />
            ) : productChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={productChartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="product" 
                    stroke="#9CA3AF" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={12}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#1F2937", 
                      borderColor: "#10B981",
                      fontSize: '12px'
                    }} 
                  />
                  <Bar 
                    dataKey="quantity" 
                    name="Quantity" 
                    fill="#10B981" 
                    barSize={25} 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm sm:text-base">
                No data available for the selected filters
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Purchase Table - Enhanced with better spacing */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <h2 className="text-lg sm:text-xl font-semibold text-emerald-400">Purchase Orders</h2>
          <div className="text-xs sm:text-sm text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">
            Total: {purchases.length} orders
          </div>
        </div>
        
        {loading ? (
          <LoadingShimmer />
        ) : purchases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-gray-300 min-w-[800px]">
              <thead>
                <tr className="border-b-2 border-emerald-500/30">
                  <th className="py-3 px-4 text-left text-sm font-semibold text-emerald-400 bg-gray-700/30 rounded-l-lg">Purchase ID</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-emerald-400 bg-gray-700/30">Date</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-emerald-400 bg-gray-700/30">Supplier</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-emerald-400 bg-gray-700/30">Product</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-emerald-400 bg-gray-700/30">Quantity</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-emerald-400 bg-gray-700/30">Cost Price</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-emerald-400 bg-gray-700/30 rounded-r-lg">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {purchases.map((purchase, index) => (
                  <tr 
                    key={purchase.purchase_id}
                    className="hover:bg-gray-700/30 transition-colors duration-200 group"
                  >
                    <td className="py-4 px-4 text-sm font-medium text-white group-hover:text-emerald-300 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        {purchase.purchase_id}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-200">{new Date(purchase.created_at).toLocaleDateString()}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(purchase.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="max-w-[180px]">
                        <span className="text-sm text-gray-200 font-medium block truncate">
                          {purchase.supplier}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="max-w-[200px]">
                        <span className="text-sm text-gray-200 block truncate">
                          {purchase.product}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="inline-block bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-sm font-medium min-w-[60px]">
                        {purchase.quantity}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-sm font-medium text-gray-200">
                      ₹{parseFloat(purchase.cost_price).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                        ₹{parseFloat(purchase.total).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-emerald-500/30 bg-gray-700/40">
                  <td colSpan="4" className="py-4 px-4 text-right text-sm font-semibold text-gray-300">
                    Grand Total:
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-sm font-bold text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">
                      {summary.total_quantity}
                    </span>
                  </td>
                  <td className="py-4 px-4"></td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-lg font-bold text-emerald-400 bg-emerald-500/20 px-4 py-2 rounded-full">
                      ₹{summary.total_purchases.toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <p className="text-lg font-medium mb-2">No purchase data available</p>
            <p className="text-sm">Try adjusting your filters or check back later</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const SummaryCard = ({ title, value, icon }) => (
  <motion.div
    whileHover={{ scale: 1.03, boxShadow: "0 0 15px rgba(16,185,129,0.3)" }}
    className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gray-800/60 border border-gray-700 backdrop-blur-xl shadow-inner"
  >
    <div className="flex justify-between items-center">
      <div>
        <div className="text-xs sm:text-sm text-gray-400 tracking-wide">{title}</div>
        <div className="mt-1 sm:mt-2 text-xl sm:text-2xl lg:text-3xl font-semibold text-emerald-400 drop-shadow-[0_0_6px_#10b981]">
          {value}
        </div>
      </div>
      <div className="bg-gray-700/50 p-2 sm:p-3 rounded-full">
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