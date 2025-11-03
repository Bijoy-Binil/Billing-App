import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Package,
  PlusCircle,
  Edit2,
  Trash2,
  Boxes,
  AlertTriangle,
  Search,
  Eye,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_PRODUCTS = "http://127.0.0.1:8000/api/products/";
const API_SUPPLIERS = "http://127.0.0.1:8000/api/suppliers/";
const token = localStorage.getItem("accessToken");
const role = localStorage.getItem("role"); // "manager" or "cashier"

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    manufacturer: "",
    supplier: "",
    cost_price: "",
    price: "",
    quantity: "",
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchCategories(), fetchProducts(), fetchSuppliers()]);
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/categories/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_PRODUCTS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.results || res.data;
      setProducts(data);
      const low = data.filter((p) => p.quantity < 10);
      setLowStock(low);
      if (low.length > 0)
        toast.warning(`⚠️ ${low.length} products running low on stock!`);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(API_SUPPLIERS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppliers(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.quantity)
      return toast.warn("⚠️ Please fill all required fields");

    try {
      setLoading(true);
      if (editingId) {
        await axios.put(`${API_PRODUCTS}${editingId}/`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("✅ Product updated!");
      } else {
        await axios.post(API_PRODUCTS, form, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        toast.success("🎉 Product added!");
      }
      setForm({
        name: "",
        category: "",
        manufacturer: "",
        supplier: "",
        cost_price: "",
        price: "",
        quantity: "",
      });
      setEditingId(null);
      fetchProducts();
    } catch {
      toast.error("❌ Error saving product");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`${API_PRODUCTS}${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.info("🗑️ Product deleted");
      fetchProducts();
    } catch {
      toast.error("❌ Failed to delete");
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return toast.info("Enter search term 🔍");
    try {
      const res = await axios.get(`${API_PRODUCTS}?search=${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.results || res.data;
      setProducts(data);
    } catch {
      toast.error("❌ Search failed");
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    fetchProducts();
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category || "",
      manufacturer: product.manufacturer || "",
      supplier: product.supplier || "",
      cost_price: product.cost_price || "",
      price: product.price || "",
      quantity: product.quantity || "",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-3 sm:p-4 lg:p-6 relative">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 w-full bg-red-700/90 text-white py-2 sm:py-3 text-center font-semibold shadow-md z-50 text-sm sm:text-base"
        >
          ⚠️ Low Stock: {lowStock.map((i) => i.name).join(", ")}
        </motion.div>
      )}

      <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6 pt-4">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Boxes className="text-emerald-400" size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400">
                Inventory Management
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">
                {role === "manager" ? "Manage products and stock" : "View product inventory"}
              </p>
            </div>
          </div>

          {role === "manager" && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm({
                  name: "",
                  category: "",
                  manufacturer: "",
                  supplier: "",
                  cost_price: "",
                  price: "",
                  quantity: "",
                });
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 sm:px-4 py-2 rounded-lg shadow-md text-sm sm:text-base transition-all duration-200 w-full sm:w-auto justify-center"
            >
              <PlusCircle size={16} /> New Product
            </button>
          )}
        </header>

        {/* Manager can Add/Edit */}
        {role === "manager" && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 sm:p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                <Package className="text-emerald-400" size={16} />
              </div>
              <h2 className="text-lg font-semibold text-emerald-400">
                {editingId ? "✏️ Edit Product" : "➕ Add New Product"}
              </h2>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
            >
              {["name", "manufacturer"].map((field) => (
                <div key={field} className="sm:col-span-1">
                  <label className="block text-sm text-gray-400 mb-1 capitalize">
                    {field} {field === "name" && "*"}
                  </label>
                  <input
                    type="text"
                    name={field}
                    value={form[field]}
                    onChange={handleChange}
                    placeholder={`Enter ${field}`}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    required={field === "name"}
                  />
                </div>
              ))}

              <div className="sm:col-span-1">
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm text-gray-400 mb-1">Supplier</label>
                <select
                  name="supplier"
                  value={form.supplier}
                  onChange={handleChange}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {["cost_price", "price", "quantity"].map((f) => (
                <div key={f} className="sm:col-span-1">
                  <label className="block text-sm text-gray-400 mb-1 capitalize">
                    {f.replace("_", " ")} {["price", "quantity"].includes(f) && "*"}
                  </label>
                  <div className="relative">
                    {f !== "quantity" && (
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        ₹
                      </span>
                    )}
                    <input
                      type="number"
                      name={f}
                      value={form[f]}
                      onChange={handleChange}
                      className={`w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                        f !== "quantity" ? "pl-8 pr-3" : "px-3"
                      }`}
                      min="0"
                      step={f === "quantity" ? "1" : "0.01"}
                      required={["price", "quantity"].includes(f)}
                    />
                  </div>
                </div>
              ))}

              <div className="sm:col-span-full flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-500 px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 w-full sm:w-auto"
                >
                  {loading ? "Saving..." : editingId ? "Update Product" : "Add Product"}
                </button>
              </div>
            </form>
          </motion.section>
        )}

        {/* Products Section */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 sm:p-6"
        >
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name, category..."
                className="flex-1 px-3 sm:px-4 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="bg-emerald-600 hover:bg-emerald-500 px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1 sm:gap-2 text-sm font-medium transition-all duration-200"
              >
                <Search size={16} />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
            <button
              onClick={handleReset}
              className="bg-gray-700 hover:bg-gray-600 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 sm:w-auto w-full"
            >
              Reset Filters
            </button>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-700/50">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold text-gray-300">Product</th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-300">Category</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-300">Price</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-300">Quantity</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-300">Status</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-white">{p.name}</p>
                        <p className="text-gray-400 text-sm">{p.manufacturer || "No manufacturer"}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {p.category_detail?.name || "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-white">
                      ₹{parseFloat(p.price).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-medium ${p.quantity < 10 ? "text-red-400" : "text-white"}`}>
                        {p.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            p.quantity >= 10
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }`}
                        >
                          {p.quantity >= 10 ? "In Stock" : "Low Stock"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-2">
                        {role === "manager" ? (
                          <>
                            <button
                              onClick={() => handleEdit(p)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-medium flex items-center gap-1 transition-all duration-200"
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-medium flex items-center gap-1 transition-all duration-200"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400 text-sm">
                            <Eye size={14} /> View Only
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {products.map((p) => (
              <div key={p.id} className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-base">{p.name}</h3>
                      <p className="text-gray-400 text-sm">{p.manufacturer || "No manufacturer"}</p>
                    </div>
                    <div className="flex gap-2">
                      {role === "manager" && (
                        <>
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all duration-200"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 bg-red-600 hover:bg-red-500 rounded-lg transition-all duration-200"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Category</p>
                      <p className="text-white">{p.category_detail?.name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Price</p>
                      <p className="text-white font-semibold">₹{parseFloat(p.price).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Quantity</p>
                      <p className={`font-semibold ${p.quantity < 10 ? "text-red-400" : "text-white"}`}>
                        {p.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Status</p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          p.quantity >= 10
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {p.quantity >= 10 ? "In Stock" : "Low Stock"}
                      </span>
                    </div>
                  </div>

                  {/* Cashier View Only */}
                  {role !== "manager" && (
                    <div className="pt-2 border-t border-gray-600/50">
                      <span className="flex items-center gap-2 text-gray-400 text-sm">
                        <Eye size={14} /> View Only - No editing permissions
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {products.length === 0 && (
            <div className="text-center py-8 lg:py-12">
              <Package className="mx-auto text-gray-500 mb-3" size={48} />
              <p className="text-gray-400 text-lg mb-2">No products found</p>
              <p className="text-gray-500 text-sm">
                {searchTerm ? "Try adjusting your search terms" : "Add your first product to get started"}
              </p>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
};

export default Inventory;