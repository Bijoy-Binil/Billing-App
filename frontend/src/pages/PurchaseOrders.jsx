import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import { motion } from "framer-motion";
import { ShoppingBag, PlusCircle, Search, X, Download } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [formData, setFormData] = useState({
    supplier: "",
    products: [{ product: "", quantity: 1, cost_price: 0 }],
  });
  const [progress, setProgress] = useState(0);
  const [downloadingId, setDownloadingId] = useState(null);

  const baseUrl = "http://127.0.0.1:8000/api/";
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    fetchPurchaseOrders();
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      const res = await axios.get(`${baseUrl}purchase-orders/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPurchaseOrders(res.data.results || []);
    } catch (err) {
      console.error("Error fetching purchase orders", err);
      toast.error("Failed to fetch purchase orders");
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${baseUrl}suppliers/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppliers(res.data.results || []);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
      toast.error("Failed to fetch suppliers");
      setSuppliers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${baseUrl}products/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.results || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      toast.error("Failed to fetch products");
      setProducts([]);
    }
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...formData.products];
    newProducts[index][field] =
      field === "quantity" || field === "cost_price" ? Number(value) : value;
    setFormData({ ...formData, products: newProducts });
  };

  const addProductRow = () => {
    setFormData({
      ...formData,
      products: [
        ...formData.products,
        { product: "", quantity: 1, cost_price: 0 },
      ],
    });
  };

  const removeProductRow = (index) => {
    const newProducts = formData.products.filter((_, i) => i !== index);
    setFormData({ ...formData, products: newProducts });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      for (const p of formData.products) {
        if (!p.product || !p.cost_price) continue;

        await axios.post(
          `${baseUrl}purchase-orders/`,
          {
            supplier: formData.supplier,
            product: p.product,
            quantity: p.quantity,
            cost_price: p.cost_price,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      toast.success("Purchase order(s) created successfully!");
      setOpen(false);
      setFormData({ supplier: "", products: [{ product: "", quantity: 1, cost_price: 0 }] });
      fetchPurchaseOrders();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create purchase order");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (purchase_id) => {
    setDownloadingId(purchase_id);
    setProgress(0);

    try {
      toast.info("Generating & downloading invoice... ⏳");

      const simulateGeneration = () => new Promise((resolve) => {
        let simProgress = 0;
        const interval = setInterval(() => {
          simProgress += Math.random() * 10;
          if (simProgress >= 70) {
            simProgress = 70;
            clearInterval(interval);
            resolve();
          }
          setProgress(simProgress);
        }, 100);
      });

      await simulateGeneration();

      const res = await axios.get(
        `${baseUrl}purchase-orders/${purchase_id}/invoice/`,
        { 
          headers: { Authorization: `Bearer ${token}` }, 
          responseType: "blob",
          onDownloadProgress: (event) => {
            if (event.total) {
              const percent = 70 + Math.round((event.loaded * 30) / event.total);
              setProgress(Math.min(percent, 100));
            }
          }
        }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice_${purchase_id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setProgress(100);
      toast.success("Invoice downloaded ✅");
    } catch (err) {
      console.error("Error downloading invoice:", err);
      toast.error("Failed to download invoice ❌");
    } finally {
      setTimeout(() => {
        setProgress(0);
        setDownloadingId(null);
      }, 1000);
    }
  };

  const filteredOrders = Array.isArray(purchaseOrders)
    ? purchaseOrders.filter((po) =>
        po.supplier_name?.toLowerCase().includes(searchText.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-3 sm:p-4 lg:p-6">
      <ToastContainer position="top-right" theme="dark" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 lg:mb-8 gap-3 sm:gap-4"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400">
              Purchase Orders
            </h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">
              Track and manage all purchase orders from suppliers
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(true)}
          className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-emerald-900/20 text-sm sm:text-base font-medium"
        >
          <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          New Order
        </motion.button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative mb-4 sm:mb-6"
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search purchase orders by supplier name..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 bg-gray-800/60 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-200 placeholder-gray-400 text-sm sm:text-base transition-all duration-200"
        />
      </motion.div>

      {/* Purchase Orders Table/Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg overflow-hidden"
      >
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700/50">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 lg:px-6 py-3 text-center text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-4 lg:px-6 py-3 text-center text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-4 lg:px-6 py-3 text-center text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Invoice
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                    </div>
                    <p className="text-gray-400 mt-2 text-sm">Loading purchase orders...</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8">
                    <ShoppingBag className="mx-auto h-12 w-12 text-gray-500 mb-3" />
                    <p className="text-gray-400 text-base">No purchase orders found</p>
                    <p className="text-gray-500 text-sm mt-1">
                      {searchText ? "Try adjusting your search terms" : "Create your first purchase order to get started"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-700/30 transition-colors duration-200">
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-300">#{po.id}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-300">{po.supplier_name || "N/A"}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-300">{po.product_name || "N/A"}</td>
                    <td className="px-4 lg:px-6 py-4 text-center text-sm text-gray-200">{po.quantity}</td>
                    <td className="px-4 lg:px-6 py-4 text-center text-sm text-gray-200">₹{po.cost_price}</td>
                    <td className="px-4 lg:px-6 py-4 text-center text-sm text-emerald-400 font-medium">₹{po.total}</td>
                    <td className="px-4 lg:px-6 py-4 text-right text-sm text-gray-400">
                      {moment(po.created_at).format("DD MMM YYYY")}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-right">
                      <button
                        onClick={() => handleDownloadInvoice(po.id)}
                        disabled={downloadingId === po.id}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        {downloadingId === po.id ? "Downloading..." : "Invoice"}
                      </button>
                      {downloadingId === po.id && (
                        <div className="mt-2 w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-2 bg-emerald-500 transition-all duration-300 ease-linear"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3 p-3 sm:p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto"></div>
              <p className="text-gray-400 mt-2 text-sm">Loading purchase orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-500 mb-3" />
              <p className="text-gray-400 text-base">No purchase orders found</p>
              <p className="text-gray-500 text-sm mt-1">
                {searchText ? "Try adjusting your search terms" : "Create your first purchase order to get started"}
              </p>
            </div>
          ) : (
            filteredOrders.map((po) => (
              <div
                key={po.id}
                className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-base mb-1">Order #{po.id}</h3>
                    <p className="text-gray-300 text-sm">🏢 {po.supplier_name || "N/A"}</p>
                    <p className="text-gray-300 text-sm mt-1">📦 {po.product_name || "N/A"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">
                      {moment(po.created_at).format("DD MMM YYYY")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-400 text-xs">Quantity</p>
                    <p className="text-white font-medium">{po.quantity}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Cost</p>
                    <p className="text-white">₹{po.cost_price}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Total</p>
                    <p className="text-emerald-400 font-semibold">₹{po.total}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadInvoice(po.id)}
                  disabled={downloadingId === po.id}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {downloadingId === po.id ? `Downloading ${progress}%` : "Download Invoice"}
                </button>
                
                {downloadingId === po.id && (
                  <div className="mt-2 w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-emerald-500 transition-all duration-300 ease-linear"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Add Purchase Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-emerald-400">Create Purchase Order</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Supplier */}
              <div>
                <label className="block text-sm text-gray-300 mb-2 font-medium">Supplier</label>
                <select
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all duration-200"
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Products */}
              <div>
                <label className="block text-sm text-gray-300 mb-2 font-medium">Products</label>
                <div className="space-y-3">
                  {formData.products.map((p, index) => (
                    <div key={index} className="bg-gray-700/50 p-3 rounded-lg border border-gray-600/50">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-3">
                          <label className="block text-xs text-gray-400 mb-1">Product</label>
                          <select
                            value={p.product}
                            onChange={(e) => handleProductChange(index, "product", e.target.value)}
                            className="w-full bg-gray-600 text-gray-200 border border-gray-500 rounded-lg px-2 py-1 text-sm"
                            required
                          >
                            <option value="">Select Product</option>
                            {products.map((prod) => (
                              <option key={prod.id} value={prod.id}>
                                {prod.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={p.quantity}
                            onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
                            className="w-full bg-gray-600 text-gray-200 border border-gray-500 rounded-lg px-2 py-1 text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Cost (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={p.cost_price}
                            onChange={(e) => handleProductChange(index, "cost_price", e.target.value)}
                            className="w-full bg-gray-600 text-gray-200 border border-gray-500 rounded-lg px-2 py-1 text-sm"
                            required
                          />
                        </div>
                        <div className="flex gap-2 items-end">
                          {formData.products.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeProductRow(index)}
                              className="w-full px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm transition-all duration-200"
                            >
                              Remove
                            </button>
                          )}
                          {index === formData.products.length - 1 && (
                            <button
                              type="button"
                              onClick={addProductRow}
                              className="w-full px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm transition-all duration-200"
                            >
                              Add Product
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Order"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;