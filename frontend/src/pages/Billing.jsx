import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Search, FileText, ShoppingCart, User2 } from "lucide-react";

const Billing = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: "", contact_number: "" });
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [bills, setBills] = useState([]);
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const API_BILLS = "http://127.0.0.1:8000/api/billings/";
  const token = localStorage.getItem("accessToken");

  // 🔍 Product Search
  const handleSearch = async () => {
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/api/products/?search=${searchTerm}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts(res.data.results || res.data || []);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const fetchBills = async () => {
    try {
      const res = await axios.get(API_BILLS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBills(res.data.results || []);
    } catch (err) {
      console.error("Error fetching bills:", err);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchBills();
    axios
      .get("http://127.0.0.1:8000/api/products/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProducts(res.data.results || res.data || []))
      .catch((err) => console.error("Error loading products:", err));
  }, [token]);

  // 📄 Invoice Download
  const handleDownloadInvoice = async (billId) => {
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/api/billing/${billId}/invoice/`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice_${billId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading invoice:", err);
      alert("Failed to download invoice");
    }
  };

  // 🛒 Cart
  const addToCart = (product) => {
    const exists = cart.find((item) => item.id === product.id);
    if (exists) {
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const roundToCents = (v) => Math.round(v * 100) / 100;
  const subtotal = useMemo(
    () =>
      roundToCents(
        cart.reduce((sum, item) => sum + roundToCents(item.price * item.qty), 0)
      ),
    [cart]
  );
  const tax = useMemo(() => roundToCents(subtotal * 0.05), [subtotal]);
  const discount = useMemo(() => roundToCents(subtotal * 0.1), [subtotal]);
  const total = useMemo(
    () => roundToCents(subtotal + tax - discount),
    [subtotal, tax, discount]
  );

  // 👤 Customer Search
  const handleSearchCustomer = async () => {
    if (!customer.contact_number.trim()) return;
    setLoadingCustomer(true);
    setMessage("");
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/api/customers/search/?contact=${customer.contact_number}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const found = res.data;
      if (found && found.id) {
        setFoundCustomer(found);
        setCustomer({ name: found.name, contact_number: found.contact_number });
        setMessage(`Customer found: ${found.name}`);
      } else {
        setFoundCustomer(null);
        setMessage("New customer — please enter name to add.");
      }
    } catch (err) {
      setErrors(err.contact_number);
      if (err.response?.status === 404) {
        setFoundCustomer(null);
        setMessage("New customer — please enter name to add.");
      } else {
        setMessage("Error searching customer");
      }
    } finally {
      setLoadingCustomer(false);
    }
  };

  // 💳 Generate Bill
  const handleGenerateBill = async () => {
    if (!cart.length) return alert("Cart is empty!");
    if (!token) return alert("Please log in to generate a bill.");

    try {
      let customerId = foundCustomer?.id;
      if (!customerId) {
        if (!customer.name.trim()) return;
        const newCust = await axios.post(
          "http://127.0.0.1:8000/api/customers/",
          customer,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        customerId = newCust.data.id;
      }

      const payload = {
        customer: customerId,
        subtotal,
        tax,
        discount,
        total,
        items: cart.map((i) => ({
          product: i.id,
          quantity: i.qty,
          price: roundToCents(i.price),
        })),
      };

      const billRes = await axios.post(
        "http://127.0.0.1:8000/api/billings/",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`✅ Bill generated: ${billRes.data.bill_id}`);
      setCart([]);
      setCustomer({ name: "", contact_number: "" });
      setFoundCustomer(null);
      setMessage("");
      fetchBills();
    } catch (err) {
      console.error(err.response?.data || err);
      setErrors(err.response?.data?.contact_number);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 p-8">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-8 text-emerald-400 flex items-center gap-2"
      >
        <ShoppingCart className="text-emerald-500" />
        Billing System
      </motion.h1>

      {/* 🧍 Customer Section */}
      <motion.div
        className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 mb-8 shadow-lg shadow-emerald-600/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-semibold text-emerald-400 mb-4 flex items-center gap-2">
          <User2 size={20} /> Customer Details
        </h2>

        <div className="flex flex-wrap gap-3 items-center mb-3">
          <input
            type="text"
            placeholder="Contact Number"
            value={customer.contact_number}
            onChange={(e) =>
              setCustomer({ ...customer, contact_number: e.target.value })
            }
            className="px-3 py-2 rounded-xl bg-gray-700/80 text-white w-48 border border-gray-600 focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={handleSearchCustomer}
            disabled={loadingCustomer}
            className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            {loadingCustomer ? "Searching..." : "Search"}
          </button>
          {message && <p className="text-emerald-400 text-sm">{message}</p>}
          {errors && <p className="text-red-400 text-sm">{errors}</p>}
        </div>

        {!foundCustomer && (
          <input
            type="text"
            placeholder="Customer Name (for new)"
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            className="px-3 py-2 rounded-xl bg-gray-700/80 text-white w-64 border border-gray-600 focus:ring-2 focus:ring-emerald-500"
          />
        )}
      </motion.div>

      {/* 🔍 Product Search */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by category or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 rounded-xl bg-gray-700/80 text-white border border-gray-600 focus:ring-2 focus:ring-emerald-500 w-64"
        />
        <button
          onClick={handleSearch}
          className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <Search size={18} /> Search
        </button>
        <button
          onClick={() => {
            setSearchTerm("");
            axios
              .get("http://127.0.0.1:8000/api/products/", {
                headers: { Authorization: `Bearer ${token}` },
              })
              .then((res) => setProducts(res.data.results || res.data || []));
          }}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl"
        >
          Reset
        </button>
      </div>

      {/* 🧺 Products */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-10">
        {products.length === 0 ? (
          <p className="text-gray-400 italic col-span-full">
            Loading products...
          </p>
        ) : (
          products.map((p) => (
            <motion.div
              key={p.id}
              whileHover={{ scale: 1.05 }}
              className="p-5 bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700 shadow-md hover:shadow-emerald-500/20 cursor-pointer transition-all"
              onClick={() => addToCart(p)}
            >
              <h3 className="text-lg font-medium">{p.name}</h3>
              <p className="text-gray-400 text-sm mt-1">
                ₹{parseFloat(p.price).toFixed(2)}
              </p>
            </motion.div>
          ))
        )}
      </div>

      {/* 🧾 Cart */}
      <motion.div
        className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 shadow-lg shadow-emerald-600/10 mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-semibold text-emerald-400 mb-4 flex items-center gap-2">
          <ShoppingCart size={20} /> Cart ({cart.length})
        </h2>
        {cart.length === 0 ? (
          <p className="text-gray-400 italic">No items in cart</p>
        ) : (
          <>
            <table className="w-full text-left text-gray-300 mb-4">
              <thead className="border-b border-gray-700 text-gray-400 text-sm">
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((i) => (
                  <tr
                    key={i.id}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30"
                  >
                    <td>{i.name}</td>
                    <td>{i.qty}</td>
                    <td>₹{parseFloat(i.price).toFixed(2)}</td>
                    <td>₹{(i.price * i.qty).toFixed(2)}</td>
                    <td>
                      <button
                        onClick={() => removeFromCart(i.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-right text-gray-300 space-y-1 border-t border-gray-700 pt-4">
              <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
              <p>Tax (5%): +₹{tax.toFixed(2)}</p>
              <p>Discount (10%): -₹{discount.toFixed(2)}</p>
              <hr className="my-1 border-gray-700" />
              <p className="font-semibold text-lg text-white">
                Total: ₹{total.toFixed(2)}
              </p>
              <button
                onClick={handleGenerateBill}
                className="bg-emerald-600 hover:bg-emerald-500 mt-4 px-6 py-2 rounded-xl transition-all"
              >
                Generate Bill
              </button>
            </div>
          </>
        )}
      </motion.div>

      {/* 📜 Bill History */}
      <motion.div
        className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 shadow-lg shadow-emerald-600/10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-semibold text-emerald-400 mb-4 flex items-center gap-2">
          <FileText size={20} /> Recent Bills
        </h2>
        {bills.length === 0 ? (
          <p className="text-gray-400 italic">
            No bills yet. Generate your first bill above!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300">
              <thead className="text-gray-400 border-b border-gray-700">
                <tr>
                  <th>Bill ID</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30"
                  >
                    <td className="font-mono text-sm">{b.bill_id}</td>
                    <td>₹{parseFloat(b.total || 0).toFixed(2)}</td>
                    <td>{new Date(b.created_at).toLocaleString("en-IN")}</td>
                    <td>{b.customer_name || "Walk-in"}</td>
                    <td>
                      <button
                        onClick={() => handleDownloadInvoice(b.id)}
                        className="bg-blue-900 cursor-pointer mt-3 hover:bg-blue-800 px-3 py-1 rounded-xl text-sm transition-all"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Billing;
