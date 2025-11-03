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

/**
 * Billing.jsx
 *
 * - Shows product list (click to add to cart)
 * - Cart -> PayPal payment -> generate bill (cashier flow)
 * - Bill history: if paid === "paid" show Invoice download; if not, show PayPal button to pay that bill
 *
 * Notes:
 * - Expects env vars:
 *   VITE_API_BASE_URL (e.g. http://127.0.0.1:8000)
 *   VITE_PAYPAL_CLIENT_ID (for PayPalScriptProvider)
 *   VITE_PAYPAL_CURRENCY (optional; defaults to "USD")
 *
 * - Make sure you wrap your app or index with <PayPalScriptProvider> OR this component will provide one.
 */

const Billing = () => {
  const API_BASE =  "http://127.0.0.1:8000";
  const API_BILLS = `${API_BASE}/api/billings/`;
  const API_PAYMENTS = `${API_BASE}/api/payments/`;
  const API_PRODUCTS = `${API_BASE}/api/products/`;
  const API_CUSTOMERS_SEARCH = `${API_BASE}/api/customers/search/`;
  const API_CUSTOMERS = `${API_BASE}/api/customers/`;

  const token = localStorage.getItem("accessToken");
  const role = localStorage.getItem("role"); // "manager" or "cashier"
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
  const [showPayPal, setShowPayPal] = useState(false); // cart payment
  const [progress, setProgress] = useState(0);
  const [downloadingId, setDownloadingId] = useState(null);
  const [isPaid, setIsPaid] = useState(false); // cart-level payment success
  const [paypalOrderId, setPaypalOrderId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);

  // axios default headers convenience
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // Fetch products (cashier) and bills
  const fetchProducts = async () => {
    try {
      const res = await axios.get(API_PRODUCTS, { headers: authHeaders });
      setProducts(res.data.results || res.data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Error loading products ❌");
    }
  };

  // Reset payment state function for error recovery
  const resetPaymentState = () => {
    setIsPaid(false);
    setPaypalOrderId(null);
    setShowPayPal(false);
    toast.info("Payment state reset");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Add/remove cart
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

  const roundToCents = (v) => Math.round(Number(v) * 100) / 100;
  const subtotal = useMemo(
    () => roundToCents(cart.reduce((s, i) => s + roundToCents(Number(i.price) * Number(i.qty)), 0)),
    [cart]
  );
  const tax = useMemo(() => roundToCents(subtotal * 0.05), [subtotal]);
  const discount = useMemo(() => roundToCents(subtotal * 0.1), [subtotal]);
  const total = useMemo(() => roundToCents(subtotal + tax - discount), [subtotal, tax, discount]);

  // Speak total (Indian English)
  const speakTotal = (amount) => {
    if ("speechSynthesis" in window) {
      const utt = new SpeechSynthesisUtterance(`Your total is rupees ${amount}`);
      utt.lang = "en-IN";
      utt.rate = 0.95;
      utt.pitch = 1;
      speechSynthesis.speak(utt);
    }
  };

  // Customer search by contact
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
      // simulate generation progress
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

  // Create bill (cashier) — now creates bill with pending status, payment comes later
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

      // create bill with pending status
      const billRes = await axios.post(API_BILLS, payload, { headers: authHeaders });
      const billId = billRes.data.id;

      // Bill created successfully with pending status
      toast.success("Bill created successfully with Pending Payment status ✅");
      
      // Reset cart and customer data
      setCart([]);
      setCustomer({ name: "", contact_number: "" });
      setFoundCustomer(null);
      
      // Reset payment state for next transaction
      setIsPaid(false);
      setPaypalOrderId(null);
      setShowPayPal(false);
      
      // Refresh bills to show the new pending bill
      fetchBills();
      fetchRecentBills();

      // Reset cart and payment state
      setCart([]);
      setCustomer({ name: "", contact_number: "" });
      setFoundCustomer(null);
      setIsPaid(false);
      setPaypalOrderId(null);
      fetchBills();
    } catch (err) {
      console.error("Bill creation error:", err);
      toast.error("Failed to generate bill ❌");
      // Reset payment state on failure
      setIsPaid(false);
      setPaypalOrderId(null);
    }
  };

  // Open payment modal for pending bill
  const openPaymentModal = (bill) => {
    setSelectedBillForPayment(bill);
    setShowPaymentModal(true);
  };

  // Close payment modal
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedBillForPayment(null);
  };

  // Process payment for existing bill
  const processBillPayment = async (bill, transactionId, paymentMethod = 'paypal') => {
    try {
      // Mark bill as paid with transaction details
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

  // Pay existing bill (bill-level PayPal button handler)
  const handlePayExistingBill = (bill) => {
    // returns PayPalButtons element configured for bill
    return (
      <PayPalButtons
        style={{
          layout: "horizontal",
          color: "gold",
          shape: "rect",
          label: "paypal",
          height: 36,
        }}
        createOrder={(data, actions) =>
          actions.order.create({
            purchase_units: [
              {
                description: `Bill #${bill.id}`,
                amount: { currency_code: paypalCurrency, value: String(Number(bill.total).toFixed(2) || "0.01") },
              },
            ],
          })
        }
        onApprove={async (data, actions) => {
          try {
            const order = await actions.order.capture();
            
            // Validate payment amount matches bill total
            const paymentAmount = parseFloat(order.purchase_units[0].amount.value);
            const billTotal = parseFloat(bill.total);
            
            if (Math.abs(paymentAmount - billTotal) > 0.01) {
              toast.error(`Payment amount mismatch: ₹${paymentAmount} vs ₹${billTotal}`);
              return;
            }
            
            // Check if payment already exists for this bill
            try {
              const existingPaymentCheck = await axios.get(
                `${API_PAYMENTS}?bill=${bill.id}`,
                { headers: authHeaders }
              );
              
              if (existingPaymentCheck.data && existingPaymentCheck.data.length > 0) {
                toast.warn("Payment already exists for this bill");
                // Mark bill as paid if not already marked
                if (bill.payment_status !== "paid") {
                  await axios.patch(`${API_BILLS}${bill.id}/mark_paid/`, {}, { headers: authHeaders });
                }
                toast.success(`Bill #${bill.id} marked as paid ✅`);
                fetchBills();
                return;
              }
            } catch (checkErr) {
              // If check fails, continue with payment creation
              console.warn("Payment check failed, proceeding with creation:", checkErr);
            }
            
            // Process payment using the new function
            await processBillPayment(bill, order.id, 'paypal');
          } catch (err) {
            console.error("Pay existing bill error:", err);
            const errorMessage = err.response?.data?.detail || "Failed to complete payment";
            toast.error(`❌ ${errorMessage}`);
            
            // Check if error is due to duplicate payment
            if (errorMessage.toLowerCase().includes("payment with this bill already exists")) {
              toast.info("Bill payment already exists, marking as paid...");
              try {
                await axios.patch(`${API_BILLS}${bill.id}/mark_paid/`, {}, { headers: authHeaders });
                toast.success(`Bill #${bill.id} marked as paid ✅`);
                fetchBills();
              } catch (markErr) {
                console.error("Failed to mark bill as paid:", markErr);
              }
            }
          }
        }}
        onCancel={() => {
          toast.info("Payment cancelled");
          // Reset payment state on cancellation
          setIsPaid(false);
          setPaypalOrderId(null);
        }}
        onError={(err) => {
          console.error("PayPal error:", err);
          toast.error("PayPal error occurred");
          // Reset payment state on error
          setIsPaid(false);
          setPaypalOrderId(null);
        }}
      />
    );
  };

  // Cart-level PayPal Buttons for paying cart before bill generation
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
            
            // Validate payment amount matches cart total
            const paymentAmount = parseFloat(order.purchase_units[0].amount.value);
            const cartTotal = parseFloat(total);
            
            if (Math.abs(paymentAmount - cartTotal) > 0.01) {
              toast.error(`Payment amount mismatch: ₹${paymentAmount} vs ₹${cartTotal}`);
              return;
            }
            
            // record payment without bill (we will link the bill after bill creation)
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
            
            // Only set payment state if payment was successfully recorded
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
            // Reset payment state on failure
            setIsPaid(false);
            setPaypalOrderId(null);
            setShowPayPal(false);
          }
        }}
        onCancel={() => {
          setShowPayPal(false);
          toast.info("Payment cancelled");
          // Reset payment state on cancellation
          setIsPaid(false);
          setPaypalOrderId(null);
        }}
        onError={(err) => {
          console.error("PayPal error:", err);
          toast.error("PayPal error occurred");
          // Reset payment state on error
          setShowPayPal(false);
          setIsPaid(false);
          setPaypalOrderId(null);
        }}
      />
    );
  };

  // Payment Modal Component
  const PaymentModal = () => {
    if (!showPaymentModal || !selectedBillForPayment) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-emerald-400">Process Payment</h3>
            <button
              onClick={closePaymentModal}
              className="text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-300 mb-2">
              <strong>Bill ID:</strong> {selectedBillForPayment.bill_id}
            </p>
            <p className="text-gray-300 mb-2">
              <strong>Customer:</strong> {selectedBillForPayment.customer_name || "Walk-in Customer"}
            </p>
            <p className="text-gray-300 mb-4">
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
              className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render
  // Provide PayPalScriptProvider if no global wrapper exists (safe to include even if wrapped)
  return (
    <PayPalScriptProvider options={{ "client-id": paypalClientId, currency: paypalCurrency }}>
      <div className="min-h-screen bg-gradient-to-br text-gray-100 p-3 sm:p-4 md:p-6 relative">
        <PaymentModal />
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="text-2xl sm:text-3xl font-bold text-emerald-400 drop-shadow-lg mb-6">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2"
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
              {/* Customer Section */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 sm:p-6 mb-6"
              >
                <h2 className="text-lg sm:text-xl font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                  <User2 size={20} /> Customer Details
                </h2>

                <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center mb-3">
                  <input
                    type="text"
                    placeholder="Contact Number"
                    value={customer.contact_number}
                    onChange={(e) => setCustomer({ ...customer, contact_number: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-gray-900 text-white w-full sm:w-48 border border-gray-700"
                  />
                  <button
                    onClick={handleSearchCustomer}
                    disabled={loadingCustomer}
                    className="bg-emerald-600 hover:bg-emerald-500 px-3 sm:px-4 py-2 rounded-lg transition-all disabled:opacity-50 text-sm sm:text-base"
                  >
                    {loadingCustomer ? "Searching..." : "Search"}
                  </button>

                  {foundCustomer && <p className="text-emerald-400 text-sm">Found: {foundCustomer.name}</p>}
                </div>

                {!foundCustomer && (
                  <input
                    type="text"
                    placeholder="Customer Name (for new)"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-gray-900 text-white w-full sm:w-64 border border-gray-700"
                  />
                )}
              </motion.section>

              {/* Product Search */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
                <input
                  type="text"
                  placeholder="Search by category or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-gray-900 text-white border border-gray-700 w-full sm:w-64"
                />
                <button
                  onClick={handleSearch}
                  className="bg-emerald-600 hover:bg-emerald-500 px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base"
                >
                  <Search size={18} /> Search
                </button>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    fetchProducts();
                  }}
                  className="bg-gray-700 hover:bg-gray-600 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base"
                >
                  Reset
                </button>
              </div>

              {/* Products grid */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 mb-10"
              >
                {products.length === 0 ? (
                  <p className="text-gray-400 italic col-span-full">Loading products...</p>
                ) : (
                  products.map((p) => (
                    <motion.div
                      key={p.id}
                      whileHover={{ scale: 1.03 }}
                      className="p-3 sm:p-4 md:p-5 bg-gray-800/70 rounded-xl border border-gray-700 shadow-md hover:shadow-emerald-500/20 cursor-pointer transition-all"
                      onClick={() => addToCart(p)}
                    >
                      <h3 className="text-sm sm:text-base font-medium">{p.name}</h3>
                      <p className="text-gray-400 text-xs sm:text-sm mt-1">₹{parseFloat(p.price).toFixed(2)}</p>
                    </motion.div>
                  ))
                )}
              </motion.section>

              {/* Cart */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 sm:p-6"
              >
                <h2 className="text-lg sm:text-xl font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                  <ShoppingCart size={20} /> Cart ({cart.length})
                </h2>

                {cart.length === 0 ? (
                  <p className="text-gray-400 italic">No items in cart</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-gray-300 mb-4 min-w-[500px]">
                        <thead className="border-b border-gray-700 text-gray-400 text-sm">
                          <tr>
                            <th className="py-2 px-2 sm:px-3">Product</th>
                            <th className="py-2 px-2 sm:px-3">Qty</th>
                            <th className="py-2 px-2 sm:px-3">Price</th>
                            <th className="py-2 px-2 sm:px-3">Total</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {cart.map((i) => (
                            <tr key={i.id} className="border-b border-gray-700/50 hover:bg-gray-700/40">
                              <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm">{i.name}</td>
                              <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm">{i.qty}</td>
                              <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm">₹{parseFloat(i.price).toFixed(2)}</td>
                              <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm">₹{(i.price * i.qty).toFixed(2)}</td>
                              <td>
                                <button onClick={() => removeFromCart(i.id)} className="text-red-400 hover:text-red-600 text-xs sm:text-sm">
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="text-right text-gray-300 space-y-1 border-t border-gray-700 pt-4">
                      <p className="text-sm sm:text-base">Subtotal: ₹{subtotal.toFixed(2)}</p>
                      <p className="text-sm sm:text-base">Tax (5%): +₹{tax.toFixed(2)}</p>
                      <p className="text-sm sm:text-base">Discount (10%): -₹{discount.toFixed(2)}</p>
                      <hr className="my-1 border-gray-700" />
                      <p className="font-semibold text-lg text-white">Total: ₹{total.toFixed(2)}</p>

                      {/* Generate Bill button - no payment required upfront */}
                      <div className="flex gap-2 justify-end items-center">
                        <button
                          onClick={handleGenerateBill}
                          className="bg-emerald-600 hover:bg-emerald-500 mt-4 px-4 sm:px-6 py-2 rounded-lg transition-all text-sm sm:text-base"
                        >
                          <DollarSign size={14} className="inline-block mr-2" />
                          Generate Bill
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </motion.section>
            </>
          )}

          {/* Bill History */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-gray-800/70 border border-gray-700 rounded-xl p-4 sm:p-6"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-emerald-400 mb-4 flex items-center gap-2">
              <Calendar size={20} /> Bill History
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-300 min-w-[700px]">
                <thead className="border-b border-gray-700 text-gray-400 text-sm">
                  <tr>
                    <th className="py-2 px-2 sm:px-3">ID</th>
                    <th className="py-2 px-2 sm:px-3">Customer</th>
                    <th className="py-2 px-2 sm:px-3">Total</th>
                    <th className="py-2 px-2 sm:px-3">Date</th>
                    <th className="py-2 px-2 sm:px-3">Status</th>
                    <th className="py-2 px-2 sm:px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill.id} className="border-b border-gray-700/50 hover:bg-gray-700/40">
                      <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm">{bill.id}</td>
                      <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm">{bill.customer_name || "—"}</td>
                      <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm">₹{parseFloat(bill.total).toFixed(2)}</td>
                      <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm">
                        {new Date(bill.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm">
                        {bill.payment_status === "paid" ? (
                          <span className="px-2 py-1 rounded bg-emerald-700 text-white text-xs">🟢 Paid</span>
                        ) : bill.payment_status === "failed" ? (
                          <span className="px-2 py-1 rounded bg-red-700 text-white text-xs">🔴 Failed</span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-yellow-700 text-white text-xs">🟠 Pending Payment</span>
                        )}
                      </td>

                      <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          {bill.payment_status === "paid" ? (
                            <button
                              onClick={() => handleDownloadInvoice(bill.id)}
                              disabled={downloadingId === bill.id}
                              className="bg-emerald-600 hover:bg-emerald-500 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition-all disabled:opacity-50 flex items-center gap-1"
                            >
                              <Download size={14} />
                              {downloadingId === bill.id ? `${Math.round(progress)}%` : "Invoice"}
                            </button>
                          ) : bill.payment_status === "pending" ? (
                            <button
                              onClick={() => openPaymentModal(bill)}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs transition-all"
                            >
                              Proceed to Payment
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
          </motion.section>
        </div>
      </div>
    </PayPalScriptProvider>
  );
};

export default Billing;