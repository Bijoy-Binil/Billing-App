import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Package, PlusCircle, Edit2, Trash2, Boxes } from "lucide-react";

const API_PRODUCTS = "http://127.0.0.1:8000/api/products/";

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    manufacturer: "",
    cost_price: "",
    price: "",
    quantity: "",
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
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
      setProducts(res.data.results || res.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.quantity) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      setLoading(true);
      if (editingId) {
        await axios.put(`${API_PRODUCTS}${editingId}/`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(API_PRODUCTS, form, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
      setForm({
        name: "",
        category: "",
        manufacturer: "",
        cost_price: "",
        price: "",
        quantity: "",
      });
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      category: product.category || "",
      manufacturer: product.manufacturer || "",
      cost_price: product.cost_price || "",
      price: product.price || "",
      quantity: product.quantity || "",
    });
    setEditingId(product.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${API_PRODUCTS}${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 p-6 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-emerald-600/30 blur-[150px] rounded-full opacity-30 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-emerald-500/20 blur-[120px] rounded-full opacity-20 animate-pulse delay-700" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
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

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
          >
            {[
              { name: "name", label: "Product Name", type: "text" },
              { name: "manufacturer", label: "Manufacturer", type: "text" },
              { name: "cost_price", label: "Cost Price (₹)", type: "number" },
              { name: "price", label: "Selling Price (₹)", type: "number" },
              { name: "quantity", label: "Quantity", type: "number" },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm text-gray-400 mb-1">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:border-emerald-500 focus:ring-emerald-500 focus:ring-1 outline-none"
                />
              </div>
            ))}

            {/* Category */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:border-emerald-500 focus:ring-emerald-500 focus:ring-1 outline-none"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
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
                    <td
                      colSpan={6}
                      className="text-center text-gray-500 py-4"
                    >
                      No products found
                    </td>
                  </tr>
                )}
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-700 hover:bg-gray-700/30 transition"
                  >
                    <td className="py-2 px-3">{p.name}</td>
                    <td className="py-2 px-3">
                      {p.category_detail?.name || "-"}
                    </td>
                    <td className="py-2 px-3 text-center">₹{p.price}</td>
                    <td className="py-2 px-3 text-center">{p.quantity}</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          p.quantity > 10
                            ? "bg-emerald-600/20 text-emerald-400 border border-emerald-700"
                            : "bg-red-600/20 text-red-400 border border-red-700"
                        }`}
                      >
                        {p.quantity > 10 ? "In Stock" : "Low Stock"}
                      </span>
                    </td>
                    <td className="py-3 flex  px-3 text-center space-x-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className="px-3 py-1 cursor-pointer  bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs flex items-center gap-1"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="px-3 py-1 cursor-pointer bg-red-600 hover:bg-red-500 text-white rounded-md text-xs flex items-center gap-1"
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
