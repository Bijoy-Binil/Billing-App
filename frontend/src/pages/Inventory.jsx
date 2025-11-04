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
    <div className="min-h-screen bg-gradient-to-br text-gray-100 p-4 sm:p-6 relative">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 w-full bg-red-700/90 text-white py-3 text-center font-semibold shadow-md z-50"
        >
          ⚠️ Low Stock: {lowStock.map((i) => i.name).join(", ")}
        </motion.div>
      )}

      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <Boxes size={26} /> Inventory Management
          </h1>

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
             
            >
     
            </button>
          )}
        </header>

        {/* Manager can Add/Edit */}
        {role === "manager" && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 sm:p-6"
          >
            <h2 className="text-lg font-semibold text-emerald-400 mb-3">
              {editingId ? "✏️ Edit Product" : "➕ Add Product"}
            </h2>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {["name", "manufacturer"].map((field) => (
                <div key={field}>
                  <label className="block text-sm text-gray-400 mb-1 capitalize">{field}</label>
                  <input
                    type="text"
                    name={field}
                    value={form[field]}
                    onChange={handleChange}
                    placeholder={`Enter ${field}`}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2"
                >
                  <option value="">Select</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Supplier</label>
                <select
                  name="supplier"
                  value={form.supplier}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2"
                >
                  <option value="">Select</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {["cost_price", "price", "quantity"].map((f) => (
                <div key={f}>
                  <label className="block text-sm text-gray-400 mb-1 capitalize">
                    {f.replace("_", " ")} ₹
                  </label>
                  <input
                    type="number"
                    name={f}
                    value={form[f]}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2"
                  />
                </div>
              ))}

              <div className="col-span-full flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-500 px-4 sm:px-6 py-2 rounded-lg"
                >
                  {editingId ? "Update" : "Add Product"}
                </button>
              </div>
            </form>
          </motion.section>
        )}

        {/* Products Table */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 w-full sm:w-64"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="bg-emerald-600 hover:bg-emerald-500 px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1 text-sm sm:text-base"
              >
                <Search size={16} /> Search
              </button>
              <button
                onClick={handleReset}
                className="bg-gray-700 hover:bg-gray-600 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="text-left py-2 px-3">Product</th>
                  <th className="text-left py-2 px-3">Category</th>
                  <th className="text-center py-2 px-3">Price ₹</th>
                  <th className="text-center py-2 px-3">Qty</th>
                  <th className="text-center py-2 px-3">Status</th>
                  <th className="text-center py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700/40">
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2">{p.category_detail?.name || "-"}</td>
                    <td className="px-3 py-2 text-center">₹{p.price}</td>
                    <td className="px-3 py-2 text-center">{p.quantity}</td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          p.quantity >= 10
                            ? "bg-emerald-600/20 text-emerald-400"
                            : "bg-red-600/20 text-red-400"
                        }`}
                      >
                        {p.quantity >= 10 ? "In Stock" : "Low"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center flex gap-2 justify-center">
                      {role === "manager" ? (
                        <>
                          <button
                            onClick={() => handleEdit(p)}
                            className="px-2 sm:px-3 py-1 bg-emerald-600 rounded text-xs flex items-center gap-1"
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="px-2 sm:px-3 py-1 bg-red-600 rounded text-xs flex items-center gap-1"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Eye size={14} /> View Only
                        </span>
                      )}
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
