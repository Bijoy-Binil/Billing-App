import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import { motion } from "framer-motion";
import { ShoppingBag, PlusCircle, Search } from "lucide-react";
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
    console.log("formData.products==>",products)
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      const res = await axios.get(`${baseUrl}purchase-orders/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPurchaseOrders(res.data.results || []);
         console.log("formData.products==>",res.data.results)
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

      // Simulate "generation" phase (0-70%) – mimics backend work
      const simulateGeneration = () => new Promise((resolve) => {
        let simProgress = 0;
        const interval = setInterval(() => {
          simProgress += Math.random() * 10; // Random for realism
          if (simProgress >= 70) {
            simProgress = 70;
            clearInterval(interval);
            resolve();
          }
          setProgress(simProgress);
        }, 100); // Update every 100ms
      });

      await simulateGeneration();

      // Real download (70-100%) – Axios progress if available
      const res = await axios.get(
        `${baseUrl}purchase-orders/${purchase_id}/invoice/`,
        { 
          headers: { Authorization: `Bearer ${token}` }, 
          responseType: "blob",
          onDownloadProgress: (event) => {
            if (event.total) {
              const percent = 70 + Math.round((event.loaded * 30) / event.total); // Scale to 70-100%
              setProgress(Math.min(percent, 100));
            }
          }
        }
      );

      // Convert to blob and trigger download
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice_${purchase_id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setProgress(100); // Ensure 100%
      toast.success("Invoice downloaded ✅");
    } catch (err) {
      console.error("Error downloading invoice:", err);
      toast.error("Failed to download invoice ❌");
    } finally {
      setTimeout(() => {
        setProgress(0);
        setDownloadingId(null);
      }, 1000); // Brief "complete" state
    }
  };

  const filteredOrders = Array.isArray(purchaseOrders)
    ? purchaseOrders.filter((po) =>
        po.supplier_name?.toLowerCase().includes(searchText.toLowerCase())
      )
    : [];
   console.log("filteredOrders==>",filteredOrders)
  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <ToastContainer position="top-right" theme="dark" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3 sm:gap-0"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
            Purchase Orders
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Track and manage all purchase orders from suppliers
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(true)}
          className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-emerald-900/20 text-sm sm:text-base"
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
          placeholder="Search purchase orders..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-200 placeholder-gray-400 text-sm sm:text-base"
        />
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Product(s)
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Invoice
                </th>
              </tr>
            </thead>
      <tbody className="divide-y divide-gray-700">
  {loading ? (
    <tr>
      <td colSpan="8" className="px-3 sm:px-6 py-3 sm:py-4 text-center text-gray-400 text-sm">
        Loading...
      </td>
    </tr>
  ) : filteredOrders.length === 0 ? (
    <tr>
      <td colSpan="8" className="px-3 sm:px-6 py-3 sm:py-4 text-center text-gray-400 text-sm">
        No purchase orders found
      </td>
    </tr>
  ) : (
    filteredOrders.map((po) => (
      <tr key={po.id} className="hover:bg-gray-700/30 transition-colors">
        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300">{po.id}</td>
        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300">{po.supplier_name || "N/A"}</td>
        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300">{po.product_name || "N/A"}</td>
        <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-gray-200">{po.quantity}</td>
        <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-gray-200">₹{po.cost_price}</td>
        <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-emerald-400 font-medium">₹{po.total}</td>
        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm text-gray-400">
          {moment(po.created_at).format("DD MMM YYYY")}
        </td>
        <td className="px-3 sm:px-6 py-3 sm:py-4">
          <button
            onClick={() => handleDownloadInvoice(po.id)}
            className="bg-blue-900 cursor-pointer mt-2 sm:mt-3 hover:bg-blue-800 px-2 sm:px-3 py-1 rounded-xl text-xs sm:text-sm transition-all"
            disabled={downloadingId === po.id}
          >
            {downloadingId === po.id ? "Downloading..." : "Download"}
          </button>
          {downloadingId === po.id && (
            <div className="mt-1 sm:mt-2 w-24 sm:w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-2 bg-emerald-500 transition-all duration-300 ease-linear"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
          {downloadingId === po.id && progress === 100 && (
            <p className="text-emerald-400 text-xs mt-1">✅ Complete</p>
          )}
        </td>
      </tr>
    ))
  )}
</tbody>

          </table>
        </div>
      </motion.div>

      {/* Add Purchase Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-700 shadow-xl relative">
            <h3 className="text-xl font-semibold text-emerald-400 mb-4">Create Purchase Order</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Supplier */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Supplier</label>
                <select
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full bg-gray-900 text-gray-200 border border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
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
                <label className="block text-sm text-gray-300 mb-1">Products</label>
                {formData.products.map((p, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 mb-2 items-end">
                    <select
                      value={p.product}
                      onChange={(e) => handleProductChange(index, "product", e.target.value)}
                      className="bg-gray-900 text-gray-200 border border-gray-700 rounded-lg px-2 py-1"
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name}
                        </option>
                      ))}
                    </select>
 <label className="block text-sm text-gray-300 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={p.quantity}
                      onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
                      className="bg-gray-900 text-gray-200 border border-gray-700 rounded-lg px-2 py-1"
                      placeholder="Qty"
                      required
                    />
 <label className="block text-sm text-gray-300 mb-1">Cost</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={p.cost_price}
                      onChange={(e) => handleProductChange(index, "cost_price", e.target.value)}
                      className="bg-gray-900 text-gray-200 border border-gray-700 rounded-lg px-2 py-1"
                      placeholder="Cost ₹"
                      required
                    />

                    <div className="flex gap-1">
                      {index === formData.products.length - 1 && (
                        <button
                          type="button"
                          onClick={addProductRow}
                          className="bg-emerald-600 px-2 py-1 rounded"
                        >
                          +
                        </button>
                      )}
                      {formData.products.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProductRow(index)}
                          className="bg-red-600 px-2 py-1 rounded"
                        >
                          -
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  {loading ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;