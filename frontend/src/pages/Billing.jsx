// src/pages/Billing.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Search,
  FileText,
  ShoppingCart,
  User2,
  Download,
  Calendar,
  DollarSign,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const Billing = () => {
  const API_BASE = "http://127.0.0.1:8000";
  const API_BILLS = `${API_BASE}/api/billings/`;
  const API_PAYMENTS = `${API_BASE}/api/payments/`;
  const API_PRODUCTS = `${API_BASE}/api/products/`;
  const API_CUSTOMERS_SEARCH = `${API_BASE}/api/customers/search/`;
  const API_CUSTOMERS = `${API_BASE}/api/customers/`;

  const token = localStorage.getItem("accessToken");
  const role = localStorage.getItem("role");
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "";
  const paypalCurrency = import.meta.env.VITE_PAYPAL_CURRENCY || "USD";

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: "", contact_number: "" });
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [bills, setBills] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPayPal, setShowPayPal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadingId, setDownloadingId] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [paypalOrderId, setPaypalOrderId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // Fetch functions
  const fetchProducts = async () => {
    try {
      const res = await axios.get(API_PRODUCTS, { headers: authHeaders });
      setProducts(res.data.results || res.data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Error loading products ❌");
    }
  };

  const fetchBills = async () => {
    try {
      const res = await axios.get(API_BILLS, { headers: authHeaders });
      setBills(res.data.results || res.data || []);
    } catch (err) {
      console.error("Error fetching bills:", err);
      toast.error("Failed to fetch bills ❌");
    }
  };

  const fetchRecentBills = async () => {
    try {
      const res = await axios.get(`${API_BILLS}?recent=5`, { headers: authHeaders });
      setRecentBills(res.data.results || res.data || []);
    } catch (err) {
      console.error("Error fetching recent bills:", err);
      toast.error("Failed to fetch recent bills ❌");
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchBills();
    fetchRecentBills();
    if (role === "cashier") fetchProducts();
  }, [token, role]);

  // Product search
  const handleSearch = async () => {
    try {
      const res = await axios.get(`${API_PRODUCTS}?search=${encodeURIComponent(searchTerm)}`, {
        headers: authHeaders,
      });
      setProducts(res.data.results || res.data || []);
      toast.success("Products filtered ✅");
    } catch (err) {
      console.error("Product search error:", err);
      toast.error("Failed to search products ❌");
    }
  };

  // Cart functions
  const addToCart = (product) => {
    const exists = cart.find((c) => c.id === product.id);
    if (exists) {
      setCart(cart.map((c) => (c.id === product.id ? { ...c, qty: c.qty + 1 } : c)));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    const removed = cart.find((c) => c.id === id);
    setCart(cart.filter((c) => c.id !== id));
    toast.info(`${removed?.name || "Item"} removed from cart`);
  };

  // Calculations
  const roundToCents = (v) => Math.round(Number(v) * 100) / 100;
  const subtotal = useMemo(
    () => roundToCents(cart.reduce((s, i) => s + roundToCents(Number(i.price) * Number(i.qty)), 0)),
    [cart]
  );
  const tax = useMemo(() => roundToCents(subtotal * 0.05), [subtotal]);
  const discount = useMemo(() => roundToCents(subtotal * 0.1), [subtotal]);
  const total = useMemo(() => roundToCents(subtotal + tax - discount), [subtotal, tax, discount]);

  // Customer search
  const handleSearchCustomer = async () => {
    if (!customer.contact_number?.trim()) return;
    setLoadingCustomer(true);
    try {
      const res = await axios.get(`${API_CUSTOMERS_SEARCH}?contact=${encodeURIComponent(customer.contact_number)}`, {
        headers: authHeaders,
      });
      const found = res.data;
      if (found && found.id) {
        setFoundCustomer(found);
        setCustomer({ name: found.name, contact_number: found.contact_number });
        toast.success(`Customer found: ${found.name}`);
      } else {
        setFoundCustomer(null);
        toast.info("New customer — please enter name to add");
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setFoundCustomer(null);
        toast.info("New customer — please enter name to add");
      } else {
        console.error("Customer search error:", err);
        toast.error("Error searching customer ❌");
      }
    } finally {
      setLoadingCustomer(false);
    }
  };

  // Invoice download
  const handleDownloadInvoice = async (billId) => {
    setDownloadingId(billId);
    setProgress(0);
    try {
      toast.info("Generating invoice...");
      await new Promise((resolve) => {
        let sim = 0;
        const t = setInterval(() => {
          sim += Math.random() * 12;
          setProgress(Math.min(sim, 70));
          if (sim >= 70) {
            clearInterval(t);
            resolve();
          }
        }, 90);
      });

      const res = await axios.get(`${API_BILLS}${billId}/invoice/`, {
        headers: authHeaders,
        responseType: "blob",
        onDownloadProgress: (ev) => {
          if (ev.total) {
            const pct = 70 + Math.round((ev.loaded * 30) / ev.total);
            setProgress(Math.min(pct, 100));
          }
        },
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice_${billId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Invoice downloaded ✅");
      await fetchBills();
    } catch (err) {
      console.error("Invoice download error:", err);
      toast.error("Failed to download invoice ❌");
    } finally {
      setTimeout(() => {
        setProgress(0);
        setDownloadingId(null);
      }, 800);
    }
  };

  // Create bill
  const handleGenerateBill = async () => {
    if (role !== "cashier") {
      return toast.error("Only cashiers can generate bills.");
    }
    if (!cart.length) return toast.warn("Cart is empty");
    if (!token) return toast.error("Please log in");

    try {
      let customerId = foundCustomer?.id;
      if (!customerId) {
        if (!customer.name?.trim()) return toast.warn("Enter new customer name");
        const newCust = await axios.post(API_CUSTOMERS, customer, { headers: authHeaders });
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

      const billRes = await axios.post(API_BILLS, payload, { headers: authHeaders });
      const billId = billRes.data.id;

      toast.success("Bill created successfully with Pending Payment status ✅");
      
      setCart([]);
      setCustomer({ name: "", contact_number: "" });
      setFoundCustomer(null);
      setIsPaid(false);
      setPaypalOrderId(null);
      setShowPayPal(false);
      
      fetchBills();
      fetchRecentBills();
    } catch (err) {
      console.error("Bill creation error:", err);
      toast.error("Failed to generate bill ❌");
      setIsPaid(false);
      setPaypalOrderId(null);
    }
  };

  // Payment modal functions
  const openPaymentModal = (bill) => {
    setSelectedBillForPayment(bill);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedBillForPayment(null);
  };

  const processBillPayment = async (bill, transactionId, paymentMethod = 'paypal') => {
    try {
      await axios.patch(
        `${API_BILLS}${bill.id}/mark_paid/`, 
        { 
          transaction_id: transactionId,
          payment_method: paymentMethod 
        }, 
        { headers: authHeaders }
      );
      
      toast.success("✅ Payment successful! Invoice unlocked.");
      fetchBills();
      fetchRecentBills();
      closePaymentModal();
    } catch (err) {
      console.error("Bill payment error:", err);
      toast.error("Failed to process payment ❌");
    }
  };

  // PayPal Components
  const CartPaypalButtons = () => {
    return (
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
                  currency_code: paypalCurrency,
                  value: total.toFixed(2) === "0.00" ? "0.01" : total.toFixed(2),
                },
              },
            ],
          })
        }
        onApprove={async (data, actions) => {
          try {
            const order = await actions.order.capture();
            const paymentAmount = parseFloat(order.purchase_units[0].amount.value);
            const cartTotal = parseFloat(total);
            
            if (Math.abs(paymentAmount - cartTotal) > 0.01) {
              toast.error(`Payment amount mismatch: ₹${paymentAmount} vs ₹${cartTotal}`);
              return;
            }
            
            const paymentResponse = await axios.post(
              API_PAYMENTS,
              {
                bill: null,
                transaction_id: order.id,
                amount: total,
                status: "succeeded",
              },
              { headers: authHeaders }
            );
            
            if (paymentResponse.data?.id) {
              setPaypalOrderId(order.id);
              setIsPaid(true);
              setShowPayPal(false);
              toast.success("✅ Payment successful! Now generate the bill.");
            } else {
              throw new Error("Payment record creation failed");
            }
          } catch (err) {
            console.error("Cart payment save error:", err);
            const errorMessage = err.response?.data?.detail || "Failed to record payment";
            toast.error(`❌ ${errorMessage}`);
            setIsPaid(false);
            setPaypalOrderId(null);
            setShowPayPal(false);
          }
        }}
        onCancel={() => {
          setShowPayPal(false);
          toast.info("Payment cancelled");
          setIsPaid(false);
          setPaypalOrderId(null);
        }}
        onError={(err) => {
          console.error("PayPal error:", err);
          toast.error("PayPal error occurred");
          setShowPayPal(false);
          setIsPaid(false);
          setPaypalOrderId(null);
        }}
      />
    );
  };

  const PaymentModal = () => {
    if (!showPaymentModal || !selectedBillForPayment) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full mx-auto border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-emerald-400">Process Payment</h3>
            <button
              onClick={closePaymentModal}
              className="text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>
          
          <div className="mb-4 sm:mb-6">
            <p className="text-gray-300 mb-2 text-sm sm:text-base">
              <strong>Bill ID:</strong> {selectedBillForPayment.bill_id}
            </p>
            <p className="text-gray-300 mb-2 text-sm sm:text-base">
              <strong>Customer:</strong> {selectedBillForPayment.customer_name || "Walk-in Customer"}
            </p>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">
              <strong>Total Amount:</strong> ₹{parseFloat(selectedBillForPayment.total).toFixed(2)}
            </p>
          </div>

          <div className="space-y-3">
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
                      description: `Bill #${selectedBillForPayment.bill_id}`,
                      amount: { 
                        currency_code: paypalCurrency, 
                        value: String(Number(selectedBillForPayment.total).toFixed(2) || "0.01") 
                      },
                    },
                  ],
                })
              }
              onApprove={async (data, actions) => {
                try {
                  const order = await actions.order.capture();
                  await processBillPayment(selectedBillForPayment, order.id, 'paypal');
                } catch (err) {
                  console.error("PayPal payment error:", err);
                  toast.error("Payment failed ❌");
                }
              }}
              onCancel={() => {
                toast.info("Payment cancelled");
              }}
              onError={(err) => {
                console.error("PayPal error:", err);
                toast.error("PayPal error occurred");
              }}
            />
            
            <button
              onClick={closePaymentModal}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg transition-all text-sm sm:text-base"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PayPalScriptProvider options={{ "client-id": paypalClientId, currency: paypalCurrency }}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-3 sm:p-4 lg:p-6">
        <PaymentModal />
        <ToastContainer position="top-right" autoClose={3000} />
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              {role === "cashier" ? (
                <ShoppingCart className="text-emerald-400" size={20} />
              ) : (
                <FileText className="text-emerald-400" size={20} />
              )}
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400">
              {role === "cashier" ? "Billing System" : "Bill Management Dashboard"}
            </h1>
          </div>
          <p className="text-gray-400 text-sm sm:text-base">
            {role === "cashier" ? "Process customer orders and payments" : "View and manage billing history"}
          </p>
        </motion.div>

        {role === "cashier" && (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Customer Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700/50"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-1.5 sm:p-2 bg-emerald-500/20 rounded-lg">
                  <User2 className="text-emerald-400" size={16} />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-emerald-400">Customer Details</h2>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Contact Number"
                    value={customer.contact_number}
                    onChange={(e) => setCustomer({ ...customer, contact_number: e.target.value })}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm sm:text-base"
                  />
                  <button
                    onClick={handleSearchCustomer}
                    disabled={loadingCustomer}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg sm:rounded-xl transition-all duration-200 disabled:opacity-50 font-medium text-sm sm:text-base w-full sm:w-auto"
                  >
                    {loadingCustomer ? "Searching..." : "Search"}
                  </button>
                </div>

                {!foundCustomer && (
                  <input
                    type="text"
                    placeholder="Customer Name (for new customer)"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm sm:text-base"
                  />
                )}

                {foundCustomer && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <p className="text-emerald-400 font-medium text-sm sm:text-base">Customer Found</p>
                    <p className="text-gray-300 text-sm sm:text-base">{foundCustomer.name}</p>
                    <p className="text-gray-400 text-xs sm:text-sm">{foundCustomer.contact_number}</p>
                  </div>
                )}
              </div>
            </motion.section>

            {/* Product Search & Grid */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <div className="flex-1 flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                  <input
                    type="text"
                    placeholder="Search products by name or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm sm:text-base"
                  />
                  <button
                    onClick={handleSearch}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm sm:text-base w-full sm:w-auto"
                  >
                    <Search size={16} />
                    <span>Search</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    fetchProducts();
                  }}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 hover:bg-gray-600 rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-sm sm:text-base w-full sm:w-auto"
                >
                  Reset
                </button>
              </div>

              {/* Products Grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
              >
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-700/50 hover:border-emerald-500/30 cursor-pointer transition-all duration-200 group"
                    onClick={() => addToCart(product)}
                  >
                    <div className="space-y-2">
                      <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors text-sm sm:text-base line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-gray-400 text-xs sm:text-sm">{product.category}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-base sm:text-lg font-bold text-emerald-400">
                          ₹{parseFloat(product.price).toFixed(2)}
                        </span>
                        <div className="px-2 py-1 bg-emerald-500/20 rounded-lg">
                          <span className="text-emerald-400 text-xs sm:text-sm font-medium">Add +</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Cart Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700/50"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-1.5 sm:p-2 bg-emerald-500/20 rounded-lg">
                  <ShoppingCart className="text-emerald-400" size={16} />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-emerald-400">
                  Shopping Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
                </h2>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <ShoppingCart className="mx-auto text-gray-500 mb-3 sm:mb-4" size={40} />
                  <p className="text-gray-400 text-base sm:text-lg mb-2">Your cart is empty</p>
                  <p className="text-gray-500 text-sm">Add products from above to get started</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {/* Desktop Table */}
                  <div className="hidden sm:block overflow-hidden rounded-xl border border-gray-700/50">
                    <table className="w-full">
                      <thead className="bg-gray-700/50">
                        <tr>
                          <th className="py-3 px-3 sm:px-4 text-left font-semibold text-gray-300 text-sm">Product</th>
                          <th className="py-3 px-3 sm:px-4 text-center font-semibold text-gray-300 text-sm">Qty</th>
                          <th className="py-3 px-3 sm:px-4 text-right font-semibold text-gray-300 text-sm">Price</th>
                          <th className="py-3 px-3 sm:px-4 text-right font-semibold text-gray-300 text-sm">Total</th>
                          <th className="py-3 px-3 sm:px-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {cart.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-700/30 transition-colors">
                            <td className="py-3 px-3 sm:px-4">
                              <div>
                                <p className="font-medium text-white text-sm">{item.name}</p>
                                <p className="text-xs text-gray-400">{item.category}</p>
                              </div>
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-center">
                              <span className="bg-gray-700/50 px-2 py-1 rounded-lg font-medium text-sm">
                                {item.qty}
                              </span>
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-right text-gray-300 text-sm">
                              ₹{parseFloat(item.price).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-right font-semibold text-white text-sm">
                              ₹{(item.price * item.qty).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 sm:px-4">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cart Items */}
                  <div className="sm:hidden space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="bg-gray-700/30 rounded-xl p-3 border border-gray-600/50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-white text-sm">{item.name}</p>
                            <p className="text-xs text-gray-400">{item.category}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-4">
                            <span className="bg-gray-700/50 px-2 py-1 rounded-lg font-medium">
                              Qty: {item.qty}
                            </span>
                            <span className="text-gray-300">
                              ₹{parseFloat(item.price).toFixed(2)} each
                            </span>
                          </div>
                          <span className="font-semibold text-white">
                            ₹{(item.price * item.qty).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cart Summary */}
                  <div className="bg-gray-700/30 rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Subtotal:</span>
                          <span className="text-white">₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tax (5%):</span>
                          <span className="text-red-400">+₹{tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Discount (10%):</span>
                          <span className="text-emerald-400">-₹{discount.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="bg-gray-600/30 rounded-lg p-3 sm:p-4">
                        <div className="flex justify-between items-center text-base sm:text-lg font-bold">
                          <span className="text-white">Total:</span>
                          <span className="text-emerald-400">₹{total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 sm:pt-4">
                      <button
                        onClick={handleGenerateBill}
                        className="px-6 sm:px-8 py-2 sm:py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg sm:rounded-xl transition-all duration-200 font-semibold flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
                      >
                        <DollarSign size={16} />
                        Generate Bill
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.section>
          </div>
        )}

        {/* Bill History */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 sm:mt-8 lg:mt-12 bg-gray-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700/50"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-1.5 sm:p-2 bg-emerald-500/20 rounded-lg">
              <Calendar className="text-emerald-400" size={16} />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-emerald-400">Bill History</h2>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-700/50">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="py-3 px-3 sm:px-4 text-left font-semibold text-gray-300 text-sm">Bill ID</th>
                  <th className="py-3 px-3 sm:px-4 text-left font-semibold text-gray-300 text-sm">Customer</th>
                  <th className="py-3 px-3 sm:px-4 text-right font-semibold text-gray-300 text-sm">Total</th>
                  <th className="py-3 px-3 sm:px-4 text-left font-semibold text-gray-300 text-sm">Date</th>
                  <th className="py-3 px-3 sm:px-4 text-center font-semibold text-gray-300 text-sm">Status</th>
                  <th className="py-3 px-3 sm:px-4 text-center font-semibold text-gray-300 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 px-3 sm:px-4 font-medium text-white text-sm">#{bill.id}</td>
                    <td className="py-3 px-3 sm:px-4 text-gray-300 text-sm">
                      {bill.customer_name || "Walk-in Customer"}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-right font-semibold text-white text-sm">
                      ₹{parseFloat(bill.total).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-gray-400 text-sm">
                      {new Date(bill.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex justify-center">
                        {bill.payment_status === "paid" ? (
                          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/30">
                            🟢 Paid
                          </span>
                        ) : bill.payment_status === "failed" ? (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium border border-red-500/30">
                            🔴 Failed
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium border border-yellow-500/30">
                            🟠 Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex justify-center gap-2">
                        {bill.payment_status === "paid" ? (
                          <button
                            onClick={() => handleDownloadInvoice(bill.id)}
                            disabled={downloadingId === bill.id}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-1 text-xs font-medium"
                          >
                            <Download size={12} />
                            {downloadingId === bill.id ? `${progress}%` : "Invoice"}
                          </button>
                        ) : bill.payment_status === "pending" ? (
                          <button
                            onClick={() => openPaymentModal(bill)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg transition-all duration-200 text-xs font-medium"
                          >
                            Pay Now
                          </button>
                        ) : (
                          <span className="text-red-400 text-xs">Payment Failed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3 sm:space-y-4">
            {bills.map((bill) => (
              <div key={bill.id} className="bg-gray-700/30 rounded-xl p-3 sm:p-4 border border-gray-600/50">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white text-sm sm:text-base">Bill #{bill.id}</h3>
                      <p className="text-gray-300 text-xs sm:text-sm mt-1">
                        {bill.customer_name || "Walk-in Customer"}
                      </p>
                    </div>
                    <div>
                      {bill.payment_status === "paid" ? (
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/30">
                          🟢 Paid
                        </span>
                      ) : bill.payment_status === "failed" ? (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium border border-red-500/30">
                          🔴 Failed
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium border border-yellow-500/30">
                          🟠 Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-400">Total Amount</p>
                      <p className="font-semibold text-white text-base sm:text-lg">
                        ₹{parseFloat(bill.total).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Date</p>
                      <p className="text-gray-300">
                        {new Date(bill.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    {bill.payment_status === "paid" ? (
                      <button
                        onClick={() => handleDownloadInvoice(bill.id)}
                        disabled={downloadingId === bill.id}
                        className="w-full px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
                      >
                        <Download size={14} />
                        {downloadingId === bill.id ? `Downloading ${progress}%` : "Download Invoice"}
                      </button>
                    ) : bill.payment_status === "pending" ? (
                      <button
                        onClick={() => openPaymentModal(bill)}
                        className="w-full px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium"
                      >
                        Proceed to Payment
                      </button>
                    ) : (
                      <div className="text-center py-2">
                        <span className="text-red-400 text-xs sm:text-sm">Payment Failed - Contact Support</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {bills.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <FileText className="mx-auto text-gray-500 mb-3 sm:mb-4" size={32} />
              <p className="text-gray-400 text-base sm:text-lg mb-2">No bills found</p>
              <p className="text-gray-500 text-sm">Bills will appear here once created</p>
            </div>
          )}
        </motion.section>
      </div>
    </PayPalScriptProvider>
  );
};

export default Billing;