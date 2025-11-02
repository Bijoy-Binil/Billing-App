import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Package, PlusCircle, Edit2, Trash2, Boxes, AlertTriangle } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_PRODUCTS = "http://127.0.0.1:8000/api/products/";
const API_SUPPLIERS = "http://127.0.0.1:8000/api/suppliers/";

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
  const [supplierSuggestions, setSupplierSuggestions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchSuppliers();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get("http://127.0.0.1:8000/api/categories/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data.results || res.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      setLoading(true);
      const res = await axios.get(API_PRODUCTS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.results || res.data;
      setProducts(data);

      // 🔔 Detect low stock items (threshold: 10)
      const lowStock = data.filter((item) => item.quantity < 10);
      setLowStockProducts(lowStock);

      // Optional toast alert for first fetch
      if (lowStock.length > 0) {
        toast.warning(`⚠️ ${lowStock.length} products are running low on stock!`);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(API_SUPPLIERS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppliers(res.data.results || res.data || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSupplierChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, supplier: value });

    // Filter suppliers for autocomplete
    if (value.trim()) {
      const filtered = suppliers.filter((s) => s.name.toLowerCase().includes(value.toLowerCase()));
      setSupplierSuggestions(filtered);
    } else {
      setSupplierSuggestions([]);
    }
  };

  const selectSupplier = (supplier) => {
    setForm({ ...form, supplier: supplier.name });
    setSupplierSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.quantity) {
      toast.warn("⚠️ Please fill all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      setLoading(true);
      if (editingId) {
        await axios.put(`${API_PRODUCTS}${editingId}/`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("✅ Product updated successfully!");
      } else {
        await axios.post(API_PRODUCTS, form, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        toast.success("🎉 Product added successfully!");
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
    } catch (error) {
      toast.error("❌ Error saving product. Try again!");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      category: product.category || "",
      manufacturer: product.manufacturer || "",
      supplier: product.supplier || "",
      cost_price: product.cost_price || "",
      price: product.price || "",
      quantity: product.quantity || "",
    });
    setEditingId(product.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${API_PRODUCTS}${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.info("🗑️ Product deleted");
      fetchProducts();
    } catch (error) {
      toast.error("❌ Error deleting product");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 p-6 relative overflow-hidden">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* 🌟 Floating background orbs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-emerald-600/30 blur-[150px] rounded-full opacity-30 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-emerald-500/20 blur-[120px] rounded-full opacity-20 animate-pulse delay-700" />
      </div>

      {/* ⚠️ BIG LOW STOCK ALERT */}
      {lowStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 w-full bg-red-700/90 text-white py-4 px-6 text-center z-50 shadow-lg"
        >
          <div className="flex items-center justify-center gap-2 text-lg font-semibold">
            <AlertTriangle size={22} className="text-yellow-300 animate-pulse" />
            Low Stock Alert! <span className="text-yellow-200 font-bold">{lowStockProducts.length} product(s)</span> need
            restocking!
          </div>
          <div className="text-sm mt-1 opacity-90">{lowStockProducts.map((item) => item.name).join(", ")}</div>
        </motion.div>
      )}

      {/* 🧩 Inventory UI */}
      <div className="max-w-7xl mx-auto space-y-8 mt-12">
        {/* Header */}
        <header className="flex items-center justify-between">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-emerald-400 flex items-center gap-2"
          >
            <Boxes className="text-emerald-400" size={26} />
            Inventory Management
          </motion.h1>

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
            className="flex items-center gap-2 bg-emerald-600/80 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold transition shadow-md shadow-emerald-600/30"
          >
            <PlusCircle size={18} /> New Product
          </button>
        </header>

        {/* Add/Edit Form */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 shadow-lg shadow-emerald-600/10"
        >
          <h2 className="text-lg font-semibold text-emerald-400 mb-4">
            {editingId ? "✏️ Edit Product" : "➕ Add New Product"}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Product Name */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Product Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter product name"
                className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:border-emerald-500 focus:ring-emerald-500 focus:ring-1 outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:border-emerald-500 focus:ring-emerald-500 focus:ring-1 outline-none"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Manufacturer */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Manufacturer</label>
              <input
                type="text"
                name="manufacturer"
                value={form.manufacturer}
                onChange={handleChange}
                placeholder="Enter manufacturer"
                className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:border-emerald-500 focus:ring-emerald-500 focus:ring-1 outline-none"
              />
            </div>

            {/* Supplier - with autocomplete */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Supplier</label>
              <select
                name="supplier"
                value={form.supplier}
                onChange={handleChange}
                className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:border-emerald-500 focus:ring-emerald-500 focus:ring-1 outline-none"
              >
                <option value="">Select supplier</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cost Price */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cost Price (₹)</label>
              <input
                type="number"
                name="cost_price"
                value={form.cost_price}
                onChange={handleChange}
                placeholder="Enter cost price"
                className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:border-emerald-500 focus:ring-emerald-500 focus:ring-1 outline-none"
              />
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="Enter selling price"
                className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:border-emerald-500 focus:ring-emerald-500 focus:ring-1 outline-none"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Quantity *</label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                placeholder="Enter quantity"
                className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:border-emerald-500 focus:ring-emerald-500 focus:ring-1 outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold transition shadow-md shadow-emerald-600/30"
              >
                {editingId ? "Update Product" : "Add Product"}
              </button>
            </div>
          </form>
        </motion.section>

        {/* Product Table */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 shadow-lg shadow-emerald-600/10"
        >
          <h2 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
            <Package size={20} /> Current Inventory
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="text-left py-2 px-3">Product</th>
                  <th className="text-left py-2 px-3">Category</th>
                  <th className="text-center py-2 px-3">Price (₹)</th>
                  <th className="text-center py-2 px-3">Quantity</th>
                  <th className="text-center py-2 px-3">Status</th>
                  <th className="text-center py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-500 py-4">
                      No products found
                    </td>
                  </tr>
                )}
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700/30 transition">
                    <td className="py-2 px-3">{p.name}</td>
                    <td className="py-2 px-3">{p.category_detail?.name || "-"}</td>
                    <td className="py-2 px-3 text-center">₹{p.price}</td>
                    <td className="py-2 px-3 text-center">{p.quantity}</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          p.quantity >= 10
                            ? "bg-emerald-600/20 text-emerald-400 border border-emerald-700"
                            : "bg-red-600/20 text-red-400 border border-red-700"
                        }`}
                      >
                        {p.quantity >= 10 ? "In Stock" : "Low Stock"}
                      </span>
                    </td>
                    <td className="py-3 flex px-3 text-center space-x-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs flex items-center gap-1"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs flex items-center gap-1"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Inventory;
