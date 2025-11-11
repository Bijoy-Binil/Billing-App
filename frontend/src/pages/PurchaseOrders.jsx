import React, { useState, useEffect } from "react";
import moment from "moment";
import { motion } from "framer-motion";
import { ShoppingBag, PlusCircle, Search, Download } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api";

const PurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  const [progress, setProgress] = useState(0);
  const [downloadingId, setDownloadingId] = useState(null);

  const [formData, setFormData] = useState({
    supplier: "",
    products: [{ product: "", quantity: 1, cost_price: 0 }],
  });

  useEffect(() => {
    fetchPurchaseOrders();
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      const res = await api.get("/purchase-orders/");
      setPurchaseOrders(res.data.results || []);
    } catch (err) {
      toast.error("Failed to fetch purchase orders");
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await api.get("/suppliers/");
      setSuppliers(res.data.results || []);
    } catch {
      toast.error("Failed to fetch suppliers");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products/");
      setProducts(res.data.results || []);
    } catch {
      toast.error("Failed to fetch products");
    }
  };

  const handleProductChange = (index, field, value) => {
    const updated = [...formData.products];
    updated[index][field] =
      field === "quantity" || field === "cost_price" ? Number(value) : value;
    setFormData({ ...formData, products: updated });
  };

  const addProductRow = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { product: "", quantity: 1, cost_price: 0 }],
    });
  };

  const removeProductRow = (index) => {
    const updated = formData.products.filter((_, i) => i !== index);
    setFormData({ ...formData, products: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      for (const p of formData.products) {
        if (!p.product || !p.cost_price) continue;

        await api.post("/purchase-orders/", {
          supplier: formData.supplier,
          product: p.product,
          quantity: p.quantity,
          cost_price: p.cost_price,
        });
      }

      toast.success("Purchase order(s) created");
      setOpen(false);
      setFormData({ supplier: "", products: [{ product: "", quantity: 1, cost_price: 0 }] });
      fetchPurchaseOrders();
    } catch {
      toast.error("Failed to create purchase order");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (id) => {
    setDownloadingId(id);
    setProgress(0);

    try {
      // Simulate generating...
      await new Promise((resolve) => {
        let p = 0;
        const i = setInterval(() => {
          p += Math.random() * 10;
          if (p >= 70) {
            clearInterval(i);
            resolve();
          }
          setProgress(Math.min(p, 70));
        }, 100);
      });

      // Actual download
      const res = await api.get(`/purchase-orders/${id}/invoice/`, {
        responseType: "blob",
        onDownloadProgress: (e) => {
          if (e.total) {
            const pct = 70 + Math.round((e.loaded * 30) / e.total);
            setProgress(Math.min(pct, 100));
          }
        },
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${id}.pdf`;
      a.click();

      window.URL.revokeObjectURL(url);
      toast.success("Invoice downloaded");
    } catch (err) {
      toast.error("Failed to download invoice");
    } finally {
      setTimeout(() => {
        setDownloadingId(null);
        setProgress(0);
      }, 800);
    }
  };

  const filteredOrders = purchaseOrders.filter((po) =>
    po.supplier_name?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800 p-4 sm:p-6">
      <ToastContainer position="top-right" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8"
      >
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <div className="p-3 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl shadow-lg">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Purchase Orders
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Track and manage supplier orders
            </p>
          </div>
        </div>

        <motion.button
          onClick={() => setOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl shadow-lg flex items-center justify-center gap-2 font-semibold transition-all"
        >
          <PlusCircle className="w-5 h-5" /> New Order
        </motion.button>
      </motion.div>

      {/* Search */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-6 sm:mb-8"
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-gray-400 w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Search orders by supplier name..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-10 sm:pl-12 pr-4 py-3 bg-white border border-blue-300 rounded-2xl text-gray-700 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 shadow-sm transition-all placeholder-gray-400"
        />
      </motion.div>

      {/* Table */}
      <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-2xl shadow-lg overflow-hidden"
>
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">ID</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Supplier</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Product</th>
                <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">Image</th>
                <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">Qty</th>
                <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">Cost</th>
                <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">Total</th>
                <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">Date</th>
                <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">Invoice</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-blue-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <ShoppingBag className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="text-gray-500 text-lg font-medium">No purchase orders found</p>
                      <p className="text-gray-400 text-sm mt-1">Create your first purchase order to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-blue-50 transition-colors duration-200">
                    <td className="px-4 sm:px-6 py-4 font-semibold text-gray-900">
                      #{po.id}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="bg-gradient-to-r flex from-amber-50 to-orange-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-200">
                        {po.supplier_name}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 font-medium text-gray-900">
                      {po.product_name}
                    </td>

                    {/* Product Image */}
                    <td className="px-4 sm:px-6 py-4 text-center">
                      <img
                        src={po.product?.image || "/placeholder.png"}
                        className="w-12 h-12 object-cover rounded-xl border border-blue-200 shadow-sm mx-auto"
                        alt="product"
                      />
                    </td>

                    <td className="px-4 sm:px-6 py-4 text-center">
                      <span className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-blue-200">
                        {po.quantity}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-center font-semibold text-gray-900">
                       ₹{po.cost_price}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-center font-bold text-emerald-600 text-lg">
                       ₹{po.total}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right text-gray-600 font-medium">
                      {moment(po.created_at).format("DD MMM YYYY")}
                    </td>

                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => handleDownloadInvoice(po.id)}
                          disabled={downloadingId === po.id}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex items-center gap-2 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                        >
                          <Download className="w-4 h-4" />
                          {downloadingId === po.id ? `${progress}%` : "Invoice"}
                        </button>

                        {downloadingId === po.id && (
                          <div className="w-24 bg-blue-200 h-2 rounded-full overflow-hidden shadow-inner">
                            <div
                              className="h-2 bg-gradient-to-r from-emerald-400 to-green-400 transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
             </table>
  </div>
</motion.div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl border border-blue-200 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl shadow-sm">
                <PlusCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Create Purchase Order
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Supplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                <select
                  value={formData.supplier}
                  onChange={(e) =>
                    setFormData({ ...formData, supplier: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 shadow-sm transition-all"
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
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Products</label>
                  <span className="text-xs text-gray-500 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                    {formData.products.length} item(s)
                  </span>
                </div>

                {formData.products.map((p, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4 p-4 bg-gradient-to-r from-white to-amber-50 rounded-xl border border-amber-200"
                  >
                    <div className="sm:col-span-5">
                      <select
                        value={p.product}
                        onChange={(e) =>
                          handleProductChange(index, "product", e.target.value)
                        }
                        required
                        className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 shadow-sm text-sm"
                      >
                        <option value="">Select Product</option>
                        {products.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        min="1"
                        value={p.quantity}
                        onChange={(e) =>
                          handleProductChange(index, "quantity", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 shadow-sm text-sm"
                        placeholder="Quantity"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={p.cost_price}
                        onChange={(e) =>
                          handleProductChange(index, "cost_price", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 shadow-sm text-sm"
                        placeholder="Cost Price"
                      />
                    </div>

                    <div className="sm:col-span-1 flex gap-2 justify-end">
                      {index === formData.products.length - 1 && (
                        <button
                          type="button"
                          onClick={addProductRow}
                          className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white rounded-lg shadow-sm transition-all flex items-center justify-center"
                        >
                          +
                        </button>
                      )}
                      {formData.products.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProductRow(index)}
                          className="w-8 h-8 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-lg shadow-sm transition-all flex items-center justify-center"
                        >
                          -
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-blue-200">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-5 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl font-medium border border-gray-300 shadow-sm transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </div>
                  ) : (
                    "Create Order"
                  )}
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