import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Search, FileText, ShoppingCart, User2, Download, Calendar, DollarSign } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // ✅ Important import
import { PayPalButtons } from "@paypal/react-paypal-js";

const Billing = () => {
  const role = localStorage.getItem("role"); // "manager" or "cashier"
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: "", contact_number: "" });
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [bills, setBills] = useState([]);
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showPayPal, setShowPayPal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadingId, setDownloadingId] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [paypalOrderId, setPaypalOrderId] = useState(null);

  const API_BILLS = "http://127.0.0.1:8000/api/billings/";
  const token = localStorage.getItem("accessToken");

  // 🔍 Product Search
  const handleSearch = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/products/?search=${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.results || res.data || []);
      toast.success("Products filtered successfully ✅");
    } catch (err) {
      console.error("Search error:", err);
      toast.error("Failed to search products ❌");
    }
  };

  // 📦 Fetch Bills + Products
  const fetchBills = async () => {
    try {
      const res = await axios.get(API_BILLS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBills(res.data.results || []);
    } catch (err) {
      toast.error("Failed to fetch bills ❌");
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchBills();
    if (role === "cashier") {
      axios
        .get("http://127.0.0.1:8000/api/products/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setProducts(res.data.results || res.data || []))
        .catch(() => toast.error("Error loading products ❌"));
    }
  }, [token, role]);

  // 📄 Invoice Download (Updated with simulation)
  const handleDownloadInvoice = async (billId) => {
    setDownloadingId(billId);
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
      const res = await axios.get(`http://127.0.0.1:8000/api/billing/${billId}/invoice/`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
        onDownloadProgress: (event) => {
          if (event.total) {
            const percent = 70 + Math.round((event.loaded * 30) / event.total); // Scale to 70-100%
            setProgress(Math.min(percent, 100));
          }
        },
      });

      // Trigger download
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice_${billId}.pdf`);
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

  // 🛒 Cart
  const addToCart = (product) => {
    const exists = cart.find((item) => item.id === product.id);
    if (exists) {
      setCart(cart.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item)));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    const removedItem = cart.find((i) => i.id === id);
    setCart(cart.filter((item) => item.id !== id));
    toast.warn(`${removedItem?.name || "Item"} removed from cart ⚠️`);
  };

  const roundToCents = (v) => Math.round(v * 100) / 100;
  const subtotal = useMemo(
    () => roundToCents(cart.reduce((sum, item) => sum + roundToCents(item.price * item.qty), 0)),
    [cart]
  );
  const tax = useMemo(() => roundToCents(subtotal * 0.05), [subtotal]);
  const discount = useMemo(() => roundToCents(subtotal * 0.1), [subtotal]);
  const total = useMemo(() => roundToCents(subtotal + tax - discount), [subtotal, tax, discount]);
  // ✅ Speak amount using browser voice
  const speakTotal = (amount) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(`Your total is rupees ${amount}`);
      utterance.lang = "en-IN"; // Indian English accent
      utterance.rate = 0.95;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    } else {
      console.warn("Speech synthesis not supported in this browser.");
    }
  };

  // 👤 Customer Search
  const handleSearchCustomer = async () => {
    if (!customer.contact_number.trim()) return;
    setLoadingCustomer(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/customers/search/?contact=${customer.contact_number}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const found = res.data;
      if (found && found.id) {
        setFoundCustomer(found);
        setCustomer({ name: found.name, contact_number: found.contact_number });
        toast.success(`Customer found: ${found.name}`);
        setMessage(`Customer found: ${found.name}`);
      } else {
        setFoundCustomer(null);
        toast.info("New customer — please enter name to add");
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setFoundCustomer(null);
        toast.info("New customer — please enter name to add");
      } else {
        toast.error("Error searching customer ❌");
      }
    } finally {
      setLoadingCustomer(false);
    }
  };

  // 💳 Generate Bill
  // ✅ Update after PayPal success
  const handleGenerateBill = async () => {
    if (role !== "cashier") {
      return toast.error("Access denied: Only cashiers can generate bills. 🔒");
    }
    if (!cart.length) return toast.warning("Cart is empty!");
    if (!token) return toast.error("Please log in to generate a bill.");
    if (!isPaid) return toast.warning("Please complete PayPal payment first 💳");

    try {
      let customerId = foundCustomer?.id;
      if (!customerId) {
        if (!customer.name.trim()) return toast.warning("Please enter new customer name.");
        const newCust = await axios.post("http://127.0.0.1:8000/api/customers/", customer, {
          headers: { Authorization: `Bearer ${token}` },
        });
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

      // Step 1: create the bill
      const billRes = await axios.post(API_BILLS, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Step 2: link PayPal payment to the bill
      if (paypalOrderId) {
        await axios.patch(
          `${import.meta.env.VITE_API_BASE_URL}/payments/${paypalOrderId}/link_bill/`,
          { bill_id: billRes.data.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Step 3: mark the bill as paid
        await axios.patch(
          `http://127.0.0.1:8000/api/billing/${billRes.data.id}/mark_paid/`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      toast.success("Bill generated and marked as Paid ✅");
      setCart([]);
      setCustomer({ name: "", contact_number: "" });
      setFoundCustomer(null);
      setIsPaid(false);
      setPaypalOrderId(null);
      fetchBills();
    } catch (err) {
      console.error("Bill creation error:", err);
      toast.error("Failed to generate bill ❌");
    }
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-xl mb-4">Role not found. Please log in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br   text-gray-100 p-6 relative">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="text-3xl font-bold  text-emerald-400 drop-shadow-lg">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-2xl font-bold mb-4 text-emerald-400 flex items-center gap-2" ${
            role === "cashier" ? "text-emerald-400" : "text-emerald-400"
          }`}
        >
          {role === "cashier" ? (
            <>
              <ShoppingCart className="text-emerald-500" />
              Billing System
            </>
          ) : (
            <>
              <FileText className="text-emerald-500" />
              Bill Management Dashboard
            </>
          )}
        </motion.h1>

        {role === "cashier" && (
          <>
            {/* 🧍 Customer Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/70 border border-gray-700 rounded-xl p-6"
            >
              <h2 className="text-xl font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                <User2 size={20} /> Customer Details
              </h2>

              <div className="flex flex-wrap gap-3 items-center mb-3">
                <input
                  type="text"
                  placeholder="Contact Number"
                  value={customer.contact_number}
                  onChange={(e) => setCustomer({ ...customer, contact_number: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-gray-900 text-white w-48 border border-gray-700"
                />
                <button
                  onClick={handleSearchCustomer}
                  disabled={loadingCustomer}
                  className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg transition-all disabled:opacity-50"
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
                  className="px-3 py-2 rounded-lg bg-gray-900 text-white w-64 border border-gray-700"
                />
              )}
            </motion.section>

            {/* 🔍 Product Search */}
            <div className="flex flex-wrap gap-3 mb-6">
              <input
                type="text"
                placeholder="Search by category or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 rounded-lg bg-gray-900 text-white border border-gray-700 w-64"
              />
              <button
                onClick={handleSearch}
                className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg flex items-center gap-2"
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
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
              >
                Reset
              </button>
            </div>

            {/* 🧺 Products */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-10"
            >
              {products.length === 0 ? (
                <p className="text-gray-400 italic col-span-full">Loading products...</p>
              ) : (
                products.map((p) => (
                  <motion.div
                    key={p.id}
                    whileHover={{ scale: 1.05 }}
                    className="p-5 bg-gray-800/70 rounded-xl border border-gray-700 shadow-md hover:shadow-emerald-500/20 cursor-pointer transition-all"
                    onClick={() => addToCart(p)}
                  >
                    <h3 className="text-lg font-medium">{p.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">₹{parseFloat(p.price).toFixed(2)}</p>
                  </motion.div>
                ))
              )}
            </motion.section>

            {/* 🧾 Cart */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/70 border border-gray-700 rounded-xl p-6"
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
                        <tr key={i.id} className="border-b border-gray-700/50 hover:bg-gray-700/40">
                          <td>{i.name}</td>
                          <td>{i.qty}</td>
                          <td>₹{parseFloat(i.price).toFixed(2)}</td>
                          <td>₹{(i.price * i.qty).toFixed(2)}</td>
                          <td>
                            <button onClick={() => removeFromCart(i.id)} className="text-red-400 hover:text-red-600">
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
                    <p className="font-semibold text-lg text-white">Total: ₹{total.toFixed(2)}</p>

                    {/* ✅ Conditional Buttons */}
                    {!isPaid ? (
                      <>
                        {!showPayPal ? (
                          <button
                            onClick={() => {
                              speakTotal(total.toFixed(2));
                              setTimeout(() => setShowPayPal(true), 5000); // wait 5 seconds
                            }}
                            className="bg-blue-600 hover:bg-blue-500 mt-4 px-6 py-2 rounded-lg transition-all"
                          >
                            Go to Payment 💳
                          </button>
                        ) : (
                          <div className="mt-6">
                            <h3 className="text-emerald-400 text-sm mb-2">Proceed to Payment</h3>
                            <PayPalButtons
                              style={{
                                layout: "vertical",
                                color: "gold",
                                shape: "rect",
                                label: "paypal",
                              }}
                              createOrder={(data, actions) =>
                                actions.order.create({
                                  purchase_units: [
                                    {
                                      description: "Supermarket Bill Payment",
                                      amount: {
                                        currency_code: import.meta.env.VITE_PAYPAL_CURRENCY || "USD",
                                        value: total.toFixed(2) === "0.00" ? "0.01" : total.toFixed(2),
                                      },
                                    },
                                  ],
                                })
                              }
                              onApprove={async (data, actions) => {
                                const order = await actions.order.capture();
                                try {
                                  await axios.post(
                                    `${import.meta.env.VITE_API_BASE_URL}/payments/`,
                                    {
                                      bill: null,
                                      transaction_id: order.id,
                                      amount: total,
                                      status: "succeeded",
                                    },
                                    { headers: { Authorization: `Bearer ${token}` } }
                                  );
                                  setPaypalOrderId(order.id);
                                  setIsPaid(true);
                                  setShowPayPal(false);
                                  toast.success("✅ Payment successful! You can now generate the bill.");
                                } catch (err) {
                                  console.error("Payment save error:", err);
                                  toast.error("Failed to record payment ❌");
                                }
                              }}
                              onError={(err) => {
                                console.error("PayPal error:", err);
                                toast.error("Payment failed ❌");
                              }}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="mt-6 text-center">
                        <p className="text-green-400 font-semibold mb-2">✅ Payment successful! Now generate your bill.</p>
                        <button
                          onClick={handleGenerateBill}
                          className="bg-emerald-600 hover:bg-emerald-500 mt-2 px-6 py-2 rounded-lg transition-all"
                        >
                          Generate Bill 🧾
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.section>
          </>
        )}

        {/* 📜 Bill History - Enhanced for Manager */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/70 border border-gray-700 rounded-xl p-6"
        >
          <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
            role === "manager" ? "text-emerald-400" : "text-emerald-400"
          }`}>
            <FileText size={20} /> {role === "manager" ? "All Bills Overview" : "Recent Bills"}
          </h2>
          {bills.length === 0 ? (
            <p className="text-gray-400 italic">No bills yet. {role === "cashier" ? "Generate your first bill above!" : "No bills recorded."}</p>
          ) : (
            <>
              {role === "manager" && (
                <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                  <motion.div
                    className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-4"
                    whileHover={{ scale: 1.02 }}
                  >
                    <DollarSign className="mx-auto mb-2 text-emerald-400" size={24} />
                    <p className="text-2xl font-bold text-emerald-300">₹{bills.reduce((sum, b) => sum + parseFloat(b.total || 0), 0).toFixed(2)}</p>
                    <p className="text-emerald-400 text-sm">Total Revenue</p>
                  </motion.div>
                  <motion.div
                    className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-4"
                    whileHover={{ scale: 1.02 }}
                  >
                    <FileText className="mx-auto mb-2 text-emerald-400" size={24} />
                    <p className="text-2xl font-bold text-emerald-300">{bills.length}</p>
                    <p className="text-emerald-400 text-sm">Total Bills</p>
                  </motion.div>
                  <motion.div
                    className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-4"
                    whileHover={{ scale: 1.02 }}
                  >
                    <Calendar className="mx-auto mb-2 text-emerald-400" size={24} />
                    <p className="text-2xl font-bold text-emerald-300">{new Date(bills[0]?.created_at).toLocaleDateString("en-IN")}</p>
                    <p className="text-emerald-400 text-sm">Latest Bill</p>
                  </motion.div>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className={`w-full text-sm ${
                  role === "manager" ? "text-gray-200" : "text-gray-300"
                }`}>
                  <thead className={`${
                    role === "manager" ? "text-emerald-400 border-b border-emerald-700" : "text-gray-400 border-b border-gray-700"
                  }`}>
                    <tr>
                      <th className="py-2 px-3 font-semibold">Bill ID</th>
                      <th className="py-2 px-3 font-semibold">Total</th>
                      <th className="py-2 px-3 font-semibold">Date</th>
                      <th className="py-2 px-3 font-semibold">Customer</th>
                      <th className="py-2 px-3 font-semibold">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((b) => (
                      <motion.tr
                        key={b.id}
                        whileHover={{ backgroundColor: role === "manager" ? "rgba(16, 185, 129, 0.1)" : "rgba(75, 85, 99, 0.3)" }}
                        className={`border-b ${
                          role === "manager" ? "border-emerald-700/30" : "border-gray-700/50"
                        } transition-colors hover:bg-gray-700/40`}
                      >
                        <td className="py-2 px-3 font-mono text-sm bg-emerald-90/20 rounded-l-lg">{b.bill_id}</td>
                        <td className="py-2 px-3 font-semibold text-emerald-400">₹{parseFloat(b.total || 0).toFixed(2)}</td>
                        <td className="py-2 px-3">{new Date(b.created_at).toLocaleString("en-IN")}</td>
                        <td className="py-2 px-3">{b.customer_name || "Walk-in"}</td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => handleDownloadInvoice(b.id)}
                            className={`${
                              role === "manager"
                                ? "bg-blue-900 hover:bg-blue-500 text-white"
                                : "bg-blue-900 hover:bg-blue-800 text-gray-200"
                            } cursor-pointer px-4 py-2 rounded-lg text-sm transition-all`}
                          >
                            <Download size={14} className="inline mr-1" /> Download
                          </button>
                          {downloadingId === b.id && (
                            <div className="mt-2 w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-2 bg-emerald-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          )}
                          {downloadingId === b.id && progress === 100 && (
                            <p className={`text-xs mt-1 ${
                              role === "manager" ? "text-emerald-400" : "text-emerald-400"
                            }`}>✅ Download Complete</p>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </motion.section>
      </div>
    </div>
  );
};

export default Billing;