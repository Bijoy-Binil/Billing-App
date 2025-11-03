import React, { useEffect, useState } from "react";
import axios from "axios";

const API_PRODUCTS = "http://127.0.0.1:8000/api/products/";

const Stock = () => {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ name: "", price: "", quantity: "" });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_PRODUCTS);
      setProducts(res.data);
    } catch (error) {
      console.error("Error fetching stock:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.quantity) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await axios.put(`${API_PRODUCTS}${editingId}/`, formData);
      } else {
        await axios.post(API_PRODUCTS, formData);
      }
      setFormData({ name: "", price: "", quantity: "" });
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      price: product.price,
      quantity: product.quantity,
    });
    setEditingId(product.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${API_PRODUCTS}${id}/`);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6 text-gray-100">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <h1 className="text-xl sm:text-2xl font-bold text-emerald-400">📦 Stock Management</h1>

        {/* Add / Edit Form */}
        <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-emerald-400 mb-3 sm:mb-4">
            {editingId ? "✏️ Edit Product" : "➕ Add New Product"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-end"
          >
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1">Product Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter product name"
                className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:border-emerald-500 focus:ring-emerald-500 focus:ring-1 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1">Price (₹)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Enter price"
                className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:border-emerald-500 focus:ring-emerald-500 focus:ring-1 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Enter quantity"
                className="w-full bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:border-emerald-500 focus:ring-emerald-500 focus:ring-1 outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex justify-end mt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold transition"
              >
                {editingId ? "Update Product" : "Add Product"}
              </button>
            </div>
          </form>
        </div>

        {/* Stock Table */}
        <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-emerald-400 mb-3 sm:mb-4">📊 Current Stock</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[600px]">
              <thead className="text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="text-left py-2 px-2 sm:px-3">Name</th>
                  <th className="py-2 px-2 sm:px-3">Price (₹)</th>
                  <th className="py-2 px-2 sm:px-3">Quantity</th>
                  <th className="py-2 px-2 sm:px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-500 py-3 sm:py-4">
                      No products found
                    </td>
                  </tr>
                )}
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-700 hover:bg-gray-700/30 transition"
                  >
                    <td className="py-2 px-2 sm:px-3">{p.name}</td>
                    <td className="py-2 px-2 sm:px-3 text-center">{p.price}</td>
                    <td className="py-2 px-2 sm:px-3 text-center">{p.quantity}</td>
                    <td className="py-2 px-2 sm:px-3 text-center">
                      <div className="flex justify-center gap-2 sm:gap-3">
                        <button
                          onClick={() => handleEdit(p)}
                          className="text-emerald-400 hover:text-emerald-300 text-xs sm:text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-red-400 hover:text-red-300 text-xs sm:text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Stock;
