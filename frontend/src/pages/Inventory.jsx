import React, { useEffect, useState } from "react";
import axios from "axios";

const API_PRODUCTS = "http://127.0.0.1:8000/api/products/";

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", category: "",manufacturer:"",cost_price:"", price: "", quantity: "" });
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
      console.log((res.data.results))
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      setLoading(true);
      const res = await axios.get(API_PRODUCTS, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setProducts(res.data.results);
      console.log("products==>", res.data.results);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
      setForm({ name: "", category: "", price: "", quantity: "" });
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
    const token = localStorage.getItem("accessToken")
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${API_PRODUCTS}${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 text-gray-100">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-emerald-400">🧾 Inventory Management</h1>
          <p className="text-gray-400 mt-1">Add, edit, or track product stock in one place.</p>
        </header>

        {/* Add / Edit Form */}
        <section className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-emerald-400 mb-4">
            {editingId ? "✏️ Edit Product" : "➕ Add New Product"}
          </h2>

  <form
  onSubmit={handleSubmit}
  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
>
  {/* Name */}
  <div>
    <label className="block text-sm text-gray-400 mb-1">Name</label>
    <input
      type="text"
      name="name"
      value={form.name}
      onChange={handleChange}
      placeholder="Enter product name"
      className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:border-emerald-500 focus:ring-emerald-500 focus:ring-1 outline-none"
      required
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
    <option value="">Select category</option>
    {categories.map((cat) => (
      <option key={cat.id} value={cat.id}>
        {cat.name}
      </option>
    ))}
  </select>
</div>
  {/* Manufacturer ✅ NEW */}
  <div>
    <label className="block text-sm text-gray-400 mb-1">Manufacturer</label>
    <input
      type="text"
      name="manufacturer"
      value={form.manufacturer}
      onChange={handleChange}
      placeholder="Enter manufacturer name"
      className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:border-emerald-500 focus:ring-emerald-500 focus:ring-1 outline-none"
    />
  </div>

  {/* Cost Price ✅ NEW */}
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

  {/* Price */}
  <div>
    <label className="block text-sm text-gray-400 mb-1">Price (₹)</label>
    <input
      type="number"
      name="price"
      value={form.price}
      onChange={handleChange}
      placeholder="Enter price"
      className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:border-emerald-500 focus:ring-emerald-500 focus:ring-1 outline-none"
      required
    />
  </div>

  {/* Quantity */}
  <div>
    <label className="block text-sm text-gray-400 mb-1">Quantity</label>
    <input
      type="number"
      name="quantity"
      value={form.quantity}
      onChange={handleChange}
      placeholder="Enter quantity"
      className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:border-emerald-500 focus:ring-emerald-500 focus:ring-1 outline-none"
      required
    />
  </div>

  <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
    <button
      type="submit"
      disabled={loading}
      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold transition"
    >
      {editingId ? "Update Product" : "Add Product"}
    </button>
  </div>
</form>

        </section>

        {/* Product + Stock Table */}
        <section className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-emerald-400 mb-4">📊 Current Inventory</h2>

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
                    <td className="py-2 px-3">{p.category_detail.name || "-"}</td>
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
                    <td className="py-2 px-3 text-center space-x-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Inventory;
