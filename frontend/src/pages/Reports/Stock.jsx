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
      setProducts(res.data.results || res.data || []);
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
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`${API_PRODUCTS}${id}/`);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF3FA] p-4 sm:p-6 text-gray-800">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-green-700">Stock Management</h1>
          <p className="text-gray-500 text-sm">Manage product inventory & quantities</p>
        </div>

        {/* Add / Edit Form */}
        <div className="bg-white border rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-semibold text-blue-700 mb-4">
            {editingId ? "Edit Product" : "Add New Product"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div>
              <label className="text-sm text-gray-600">Product Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Parle G"
                className="w-full mt-1 px-3 py-2 border bg-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Price (₹)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g., 10"
                className="w-full mt-1 px-3 py-2 border bg-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="e.g., 50"
                className="w-full mt-1 px-3 py-2 border bg-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
            </div>

            <div className="col-span-full flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow transition disabled:opacity-50"
              >
                {editingId ? "Update Product" : "Add Product"}
              </button>
            </div>
          </form>
        </div>

        {/* Stock Table */}
        <div className="bg-[#E7F1FB] border border-[#D3E3F5] rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-semibold text-blue-700 mb-4">Current Stock</h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="bg-[#DCE7F5] border-b">
                  <th className="py-3 px-4 text-left">Name</th>
                  <th className="py-3 px-4 text-center">Price (₹)</th>
                  <th className="py-3 px-4 text-center">Quantity</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b hover:bg-[#D6E3F4] transition"
                    >
                      <td className="py-3 px-4">{p.name}</td>
                      <td className="py-3 px-4 text-center">{p.price}</td>
                      <td className="py-3 px-4 text-center">{p.quantity}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-4 text-sm">
                          <button
                            onClick={() => handleEdit(p)}
                            className="text-blue-600 hover:text-blue-500"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="text-red-600 hover:text-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Stock;
