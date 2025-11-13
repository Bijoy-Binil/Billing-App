// src/pages/Inventory.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package, PlusCircle, Edit2, Trash2, Boxes, AlertTriangle, Search, Eye } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api";
import SectionLoader from "../components/SectionLoader";

const Inventory = () => {
  const token = localStorage.getItem("accessToken");
  const role = localStorage.getItem("role"); // "manager" or "cashier"

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    image: null, // keep File here
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
      const res = await api.get("/categories/");
      setCategories(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products/");
      const data = res.data.results || res.data || [];
      setProducts(data);

      const low = data.filter((p) => Number(p.quantity) < 10);
      setLowStock(low);
      if (low.length > 0) {
        toast.warning(`⚠️ ${low.length} products running low on stock!`, {
          theme: "light",
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load products", { theme: "light" });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await api.get("/suppliers/");
      setSuppliers(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.price || !form.quantity) {
      return toast.warn("⚠️ Please fill all required fields", { theme: "light" });
    }

    try {
      setLoading(true);

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        // Prevent appending empty strings for image when editing
        if (key === "image") {
          if (value) formData.append(key, value);
        } else {
          formData.append(key, value);
        }
      });

      if (editingId) {
        await api.put(`/products/${editingId}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("✅ Product updated!", { theme: "light" });
      } else {
        await api.post("/products/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("🎉 Product added!", { theme: "light" });
      }

      setForm({
        name: "",
        category: "",
        image: null,
        manufacturer: "",
        supplier: "",
        cost_price: "",
        price: "",
        quantity: "",
      });

      setEditingId(null);
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error("❌ Error saving product", { theme: "light" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}/`);
      toast.info("🗑️ Product deleted", { theme: "light" });
      fetchProducts();
    } catch {
      toast.error("❌ Failed to delete", { theme: "light" });
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return toast.info("Enter search term 🔍", { theme: "light" });
    try {
      const res = await api.get(`/products/?search=${encodeURIComponent(searchTerm)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = res.data.results || res.data || [];
      setProducts(data);
    } catch {
      toast.error("❌ Search failed", { theme: "light" });
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    fetchProducts();
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      category: product.category || product.category_detail?.id || "",
      image: null, // keep null; only set if user uploads new file
      manufacturer: product.manufacturer || "",
      supplier: product.supplier || product.supplier_detail?.id || "",
      cost_price: product.cost_price || "",
      price: product.price || "",
      quantity: product.quantity || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800 p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Top Low-stock stripe */}
      {lowStock.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-400 to-orange-400 text-white px-6 py-4 flex items-center gap-3 shadow-lg"
        >
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm font-semibold">
            Low Stock Alert: <span className="font-bold">{lowStock.map((i) => i.name).join(", ")}</span>
          </span>
        </motion.div>
      )}

      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg">
              <Boxes className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-600 text-sm mt-1">Manage your products and stock levels</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-3 bg-white border border-blue-300 rounded-2xl px-4 py-3 shadow-sm">
              <Search className="text-gray-500" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products, category, supplier…"
                className="w-64 sm:w-72 outline-none text-sm bg-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold transition-all shadow-lg"
              >
                Search
              </button>
              <button
                onClick={handleReset}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 text-sm font-semibold transition-all border border-gray-300 shadow-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </motion.header>

        {/* Add/Edit (Manager only) */}
        {role === "manager" && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl shadow-sm">
                  {editingId ? <Edit2 className="text-white" size={16} /> : <PlusCircle className="text-white" size={16} />}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{editingId ? "Edit Product" : "Add New Product"}</h2>
              </div>
              {!editingId ? (
                <div className="text-sm text-gray-500 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                  Fill required fields & click <span className="font-semibold text-amber-700">Add Product</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm({
                      name: "",
                      category: "",
                      image: null,
                      manufacturer: "",
                      supplier: "",
                      cost_price: "",
                      price: "",
                      quantity: "",
                    });
                  }}
                  className="text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border border-gray-300 text-gray-700 font-medium shadow-sm"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g., Parle-G 200g"
                  className="w-full bg-white border border-blue-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 shadow-sm transition-all"
                />
              </div>

              {/* Manufacturer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                <input
                  type="text"
                  name="manufacturer"
                  value={form.manufacturer}
                  onChange={handleChange}
                  placeholder="e.g., Parle"
                  className="w-full bg-white border border-blue-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 shadow-sm transition-all"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full bg-white border border-blue-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 shadow-sm transition-all"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                <select
                  name="supplier"
                  value={form.supplier}
                  onChange={handleChange}
                  className="w-full bg-white border border-blue-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 shadow-sm transition-all"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      image: e.target.files?.[0] || null,
                    })
                  }
                  className="w-full bg-white border border-blue-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 shadow-sm transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {editingId && (
                  <p className="text-xs text-gray-500 mt-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                    Leave empty to keep existing image.
                  </p>
                )}
              </div>

              {/* Prices & Qty */}
              {["cost_price", "price", "quantity"].map((f) => (
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {f.replace("_", " ")} {f !== "quantity" ? " ₹" : ""} *
                  </label>
                  <input
                    type="number"
                    name={f}
                    value={form[f]}
                    onChange={handleChange}
                    placeholder={f === "quantity" ? "e.g., 25" : "e.g., 49.00"}
                    className="w-full bg-white border border-blue-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 shadow-sm transition-all"
                  />
                </div>
              ))}

              <div className="col-span-full flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg transition-all disabled:opacity-60"
                >
                  {editingId ? (
                    <>
                      <Edit2 size={18} /> Update Product
                    </>
                  ) : (
                    <>
                      <PlusCircle size={20} /> Add Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.section>
        )}

        {/* Products Table */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-2xl p-6 shadow-lg"
        >

          <div className="overflow-x-auto rounded-xl border border-blue-200 shadow-sm">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                <tr>
                  <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm uppercase tracking-wide">Image</th>
                  <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm uppercase tracking-wide">Product</th>
                  <th className="text-left py-4 px-4 text-gray-700 font-bold text-sm uppercase tracking-wide">Category</th>
                  <th className="text-center py-4 px-4 text-gray-700 font-bold text-sm uppercase tracking-wide">Price ₹</th>
                  <th className="text-center py-4 px-4 text-gray-700 font-bold text-sm uppercase tracking-wide">
                    Quantity
                  </th>
                  <th className="text-center py-4 px-4 text-gray-700 font-bold text-sm uppercase tracking-wide">
                    Stock Status
                  </th>
                  <th className="text-center py-4 px-4 text-gray-700 font-bold text-sm uppercase tracking-wide">Actions</th>
                </tr>
         {loading && (
  <tr>
    <td colSpan={7}>
      <div className="flex justify-center items-center py-10">
        <SectionLoader />
      </div>
    </td>
  </tr>
)}

              </thead>
              <tbody className="divide-y divide-blue-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50 transition-colors duration-200">
                    <td className="px-4 py-3">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-14 h-14 object-cover rounded-xl border border-blue-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center">
                          <Package className="text-gray-400" size={20} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{p.manufacturer || "No manufacturer"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-200">
                        {p.category_detail?.name || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900 text-lg">₹{Number(p.price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                          Number(p.quantity) >= 10
                            ? "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200"
                            : "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {p.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-3 py-1.5 text-xs font-bold rounded-full border shadow-sm ${
                          Number(p.quantity) >= 10
                            ? "bg-gradient-to-r from-emerald-400 to-green-400 text-white border-emerald-500"
                            : "bg-gradient-to-r from-rose-400 to-pink-400 text-white border-rose-500"
                        }`}
                      >
                        {Number(p.quantity) >= 10 ? "In Stock" : "Low Stock"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {role === "manager" ? (
                          <>
                            <button
                              onClick={() => handleEdit(p)}
                              className="px-3 py-2 cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl border border-blue-600 flex items-center gap-2 transition-all shadow-sm font-medium"
                            >
                              <Edit2 size={14} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="px-3 py-2 cursor-pointer bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl border border-rose-600 flex items-center gap-2 transition-all shadow-sm font-medium"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </>
                        ) : (
                          <span className="flex items-center gap-2 text-gray-500 bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-2 rounded-xl border border-gray-300">
                            <Eye size={14} /> View Only
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Package className="text-gray-400 mb-3" size={48} />
                        <p className="text-gray-500 text-lg font-medium">No products found</p>
                        <p className="text-gray-400 text-sm mt-1">Add products to get started</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Inventory;
