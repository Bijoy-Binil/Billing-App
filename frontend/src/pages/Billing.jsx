// src/pages/Billing.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, FileText, ShoppingCart, User2, Download, Calendar, DollarSign, Volume2 } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import api from "../api";

const Billing = () => {
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
  const [searchTerm, setSearchTerm] = useState("");
  const [showPayPal, setShowPayPal] = useState(false);
  const [recentBills, setRecentBills] = useState([]);
  const [progress, setProgress] = useState(0);
  const [downloadingId, setDownloadingId] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [paypalOrderId, setPaypalOrderId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // Voice confirmation function
  const speakAmount = (amount, billId = null) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();

      const speech = new SpeechSynthesisUtterance();
      const message = billId
        ? `Payment initiated for Bill ${billId}. Total amount is ${amount} rupees.`
        : `Total amount to pay is ${amount} rupees.`;

      speech.text = message;
      speech.volume = 1;
      speech.rate = 0.9;
      speech.pitch = 1;

      speech.onstart = () => setIsSpeaking(true);
      speech.onend = () => setIsSpeaking(false);
      speech.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(speech);
    }
  };

  // Fetch functions
  const fetchProducts = async () => {
    try {
      const res = await api.get("/products/");
      setProducts(res.data.results || res.data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Error loading products ❌");
    }
  };

  const fetchBills = async () => {
    try {
      const res = await api.get("/billings/");
      setBills(res.data.results || res.data || []);
    } catch (err) {
      console.error("Error fetching bills:", err);
      toast.error("Failed to fetch bills ❌");
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchBills();

    if (role === "cashier") fetchProducts();
  }, [token, role]);

  // Product search
  const handleSearch = async () => {
    try {
      const res = await api.get(`/products/?search=${encodeURIComponent(searchTerm)}`);
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
      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category_detail?.name || "",
          qty: 1,
        },
      ]);
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
      const res = await api.get(`/customers/search/?contact=${encodeURIComponent(customer.contact_number)}`);
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
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 8 + 4;
          setProgress(Math.min(Math.floor(progress), 75));

          if (progress >= 75) {
            clearInterval(interval);
            resolve();
          }
        }, 120);
      });

      const res = await api.get(`/billings/${billId}/invoice/`, {
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const loaded = progressEvent.loaded;
            const total = progressEvent.total;
            const downloadProgress = 75 + Math.floor((loaded * 25) / total);
            setProgress(Math.min(downloadProgress, 100));
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

      toast.success("Invoice downloaded successfully! 📄");
      await fetchBills();
    } catch (err) {
      console.error("Invoice download error:", err);

      if (err.response?.status === 404) {
        toast.error("Invoice not found for this bill");
      } else if (err.response?.status === 500) {
        toast.error("Server error while generating invoice");
      } else {
        toast.error("Failed to download invoice");
      }
    } finally {
      if (progress === 100) {
        setTimeout(() => {
          setProgress(0);
          setDownloadingId(null);
        }, 600);
      } else {
        setProgress(0);
        setDownloadingId(null);
      }
    }
  };

  const fetchRecentBills = async () => {
    try {
      const res = await api.get(`/billings/?recent=5`);
      setRecentBills(res.data.results || res.data || []);
    } catch (err) {
      console.error("Error fetching recent bills:", err);
      toast.error("Failed to fetch recent bills ❌");
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

        try {
          const newCust = await api.post("/customers/", customer);
          customerId = newCust.data.id;
        } catch (customerError) {
          if (customerError.response?.data?.contact_number) {
            toast.error(`Customer with contact number ${customer.contact_number} already exists`);
            return;
          }
          throw customerError;
        }
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

      const billRes = await api.post("/billings/", payload);
      const billId = billRes.data.id;

      const pendingPaymentId = localStorage.getItem("pendingPaymentId");
      if (pendingPaymentId && paypalOrderId) {
        try {
          await api.patch(`/payments/${paypalOrderId}/link_bill/`, { bill_id: billId });
          await api.patch(`/billings/${billId}/mark_paid/`, {
            transaction_id: paypalOrderId,
            payment_method: "paypal",
          });

          toast.success("Bill created and payment linked successfully! ✅");
          localStorage.removeItem("pendingPaymentId");
        } catch (linkError) {
          console.error("Error linking payment to bill:", linkError);
          toast.warning("Bill created but payment linking failed. Please link manually. ⚠️");
        }
      } else {
        toast.success("Bill created successfully with Pending Payment status ✅");
      }

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

      if (err.response?.data?.contact_number) {
        toast.error(`Customer with contact number ${customer.contact_number} already exists`);
      } else if (err.response?.data?.customer) {
        toast.error("Customer validation failed. Please check customer details.");
      } else if (err.response?.data?.items) {
        toast.error("Invalid items in cart. Please refresh and try again.");
      } else {
        toast.error("Failed to generate bill. Please try again.");
      }

      setIsPaid(false);
      setPaypalOrderId(null);
    }
  };

  // Payment modal functions
  const openPaymentModal = (bill) => {
    setSelectedBillForPayment(bill);
    setShowPaymentModal(true);
    const amount = parseFloat(bill.total).toFixed(2);
    speakAmount(amount);
  };

  const closePaymentModal = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setShowPaymentModal(false);
    setSelectedBillForPayment(null);
  };

  const processBillPayment = async (bill, transactionId, paymentMethod = "paypal") => {
    try {
      const paymentResponse = await api.post("/payments/", {
        bill: bill.id,
        transaction_id: transactionId,
        amount: bill.total,
        status: "succeeded",
      });

      if (paymentResponse.data?.id) {
        await api.patch(`/billings/${bill.id}/mark_paid/`, {
          transaction_id: transactionId,
          payment_method: paymentMethod,
        });

        toast.success("✅ Payment successful! Invoice unlocked.");
        fetchBills();
        fetchRecentBills();
        closePaymentModal();
      } else {
        throw new Error("Payment record creation failed");
      }
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

            const paymentResponse = await api.post(
              "/payments/",
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
              localStorage.setItem("pendingPaymentId", paymentResponse.data.id);
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
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-4 sm:p-6 max-w-md w-full mx-auto border border-blue-200 shadow-xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-emerald-600 flex items-center gap-2">
              <Volume2 className={`h-5 w-5 ${isSpeaking ? "text-green-500 animate-pulse" : "text-emerald-600"}`} />
              Process Payment
            </h3>

            <button onClick={closePaymentModal} className="text-gray-500 hover:text-gray-700 text-xl">
              ✕
            </button>
          </div>

          {/* Details */}
          <div className="mb-4 sm:mb-6 text-gray-700">
            <p className="mb-2 text-sm sm:text-base">
              <strong className="text-gray-900">Bill ID:</strong> {selectedBillForPayment.bill_id}
            </p>
            <p className="mb-2 text-sm sm:text-base">
              <strong className="text-gray-900">Customer:</strong>{" "}
              {selectedBillForPayment.customer_name || "Walk-in Customer"}
            </p>
            <p className="mb-4 text-sm sm:text-base">
              <strong className="text-gray-900">Total Amount:</strong>{" "}
              <span className="text-emerald-600 font-bold"> ₹{parseFloat(selectedBillForPayment.total).toFixed(2)}</span>
            </p>

            {/* Voice replay */}
            <div className="flex justify-center mb-2">
              <button
                onClick={() => {
                  const amount = parseFloat(selectedBillForPayment.total).toFixed(2);
                  speakAmount(amount);
                }}
                className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all text-xs font-medium"
              >
                <Volume2 size={12} />
                Replay Voice
              </button>
            </div>
          </div>

          {/* PayPal + Cancel */}
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
                        value: String(Number(selectedBillForPayment.total).toFixed(2) || "0.01"),
                      },
                    },
                  ],
                })
              }
              onApprove={async (data, actions) => {
                try {
                  const order = await actions.order.capture();
                  await processBillPayment(selectedBillForPayment, order.id, "paypal");
                } catch (err) {
                  console.error("PayPal payment error:", err);
                  toast.error("Payment failed ❌");
                }
              }}
              onCancel={() => toast.info("Payment cancelled")}
              onError={(err) => {
                console.error("PayPal error:", err);
                toast.error("PayPal error occurred");
              }}
            />

            <button
              onClick={closePaymentModal}
              className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 py-2 px-4 rounded-lg transition-all text-sm sm:text-base font-medium"
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800 p-3 sm:p-4 lg:p-6">
        <PaymentModal />
        <ToastContainer position="top-right" autoClose={3000} />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl shadow-lg">
              {role === "cashier" ? (
                <ShoppingCart className="text-white" size={20} />
              ) : (
                <FileText className="text-white" size={20} />
              )}
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              {role === "cashier" ? "Billing System" : "Bill Management Dashboard"}
            </h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">
            {role === "cashier" ? "Process customer orders and payments" : "View and manage billing history"}
          </p>
        </motion.div>

        {role === "cashier" && (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Customer Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 sm:p-6 border border-amber-200 shadow-lg"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-1.5 sm:p-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-lg shadow-sm">
                  <User2 className="text-white" size={16} />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Customer Details</h2>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Contact Number"
                    value={customer.contact_number}
                    onChange={(e) => setCustomer({ ...customer, contact_number: e.target.value })}
                    className="w-62 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-white 
             border border-amber-300 text-gray-800 placeholder-gray-400 
             focus:outline-none focus:ring-2 focus:ring-amber-200 
             focus:border-amber-500 text-sm sm:text-base shadow-sm"
                  />

                  <button
                    onClick={handleSearchCustomer}
                    disabled={loadingCustomer}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg sm:rounded-xl transition-all duration-200 disabled:opacity-50 font-medium text-sm sm:text-base w-full sm:w-auto shadow-lg"
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
                    className="w-62 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-white border border-amber-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-500 text-sm sm:text-base shadow-sm"
                  />
                )}

                {foundCustomer && (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
                    <p className="text-emerald-700 font-medium text-sm sm:text-base">Customer Found</p>
                    <p className="text-gray-800 text-sm sm:text-base font-semibold">{foundCustomer.name}</p>
                    <p className="text-gray-500 text-xs sm:text-sm">{foundCustomer.contact_number}</p>
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
                    className="flex-1 w-62 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-white border border-blue-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm sm:text-base shadow-sm"
                  />
                  <button
                    onClick={handleSearch}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm sm:text-base w-full sm:w-auto shadow-lg"
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
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-sm sm:text-base w-full sm:w-auto shadow-sm"
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
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-br from-white to-blue-50 rounded-xl p-3 sm:p-4 border border-blue-200 hover:shadow-lg cursor-pointer transition-all duration-200 group"
                    onClick={() => addToCart(product)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-sm sm:text-base line-clamp-2">
                          {product.name}
                        </h3>
                        {product.image ? (
                          <img width={70} className="rounded-lg object-cover shadow-sm" src={product.image} alt={product.name} />
                        ) : null}
                      </div>
                      <p className="text-gray-500 text-xs sm:text-sm">{product?.category_detail?.name || ""}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-base sm:text-lg font-bold text-emerald-700">
                           ₹{parseFloat(product.price).toFixed(2)}
                        </span>
                        <div className="px-2 py-1 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 rounded-lg shadow-sm transition-all">
                          <span className="text-white text-xs sm:text-sm font-medium">Add +</span>
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
              className="bg-gradient-to-r from-white to-emerald-50 rounded-2xl p-4 sm:p-6 border border-emerald-200 shadow-lg"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-1.5 sm:p-2 bg-gradient-to-r from-emerald-400 to-green-400 rounded-lg shadow-sm">
                  <ShoppingCart className="text-white" size={16} />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Shopping Cart ({cart.length} {cart.length === 1 ? "item" : "items"})
                </h2>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <ShoppingCart className="mx-auto text-gray-400 mb-3 sm:mb-4" size={40} />
                  <p className="text-gray-600 text-base sm:text-lg mb-2">Your cart is empty</p>
                  <p className="text-gray-500 text-sm">Add products from above to get started</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {/* Desktop Table */}
                  <div className="hidden sm:block overflow-hidden rounded-xl border border-emerald-200 shadow-sm">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-emerald-50 to-green-50">
                        <tr>
                          <th className="py-3 px-3 sm:px-4 text-left font-semibold text-gray-600 text-sm">Product</th>
                          <th className="py-3 px-3 sm:px-4 text-center font-semibold text-gray-600 text-sm">Qty</th>
                          <th className="py-3 px-3 sm:px-4 text-right font-semibold text-gray-600 text-sm">Price</th>
                          <th className="py-3 px-3 sm:px-4 text-right font-semibold text-gray-600 text-sm">Total</th>
                          <th className="py-3 px-3 sm:px-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100">
                        {cart.map((item) => (
                          <tr key={item.id} className="hover:bg-emerald-50 transition-colors">
                            <td className="py-3 px-3 sm:px-4">
                              <div className="flex items-start gap-3">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-14 h-14 object-cover rounded-lg border border-emerald-200 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded-lg bg-emerald-100 border border-emerald-200" />
                                )}
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                                  <p className="text-xs text-gray-500">{item.category}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-center">
                              <span className="bg-gradient-to-r from-amber-100 to-orange-100 px-2 py-1 rounded-lg font-medium text-sm text-gray-800 border border-amber-200 shadow-sm">
                                {item.qty}
                              </span>
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-right text-gray-700 text-sm">
                               ₹{parseFloat(item.price).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-right font-semibold text-gray-900 text-sm">
                               ₹{(item.price * item.qty).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 sm:px-4">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all shadow-sm"
                                title="Remove"
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
                      <div key={item.id} className="bg-gradient-to-r from-white to-emerald-50 rounded-xl p-3 border border-emerald-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-start gap-3">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded-lg border border-emerald-200 shadow-sm"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-emerald-100 border border-emerald-200" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.category}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all shadow-sm"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-4">
                            <span className="bg-gradient-to-r from-amber-100 to-orange-100 px-2 py-1 rounded-lg font-medium border border-amber-200 shadow-sm">
                              Qty: {item.qty}
                            </span>
                            <span className="text-gray-700"> ₹{parseFloat(item.price).toFixed(2)} each</span>
                          </div>
                          <span className="font-semibold text-gray-900"> ₹{(item.price * item.qty).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cart Summary */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4 border border-amber-200 shadow-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="text-gray-900 font-semibold"> ₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax (5%):</span>
                          <span className="text-rose-600 font-semibold">+ ₹{tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Discount (10%):</span>
                          <span className="text-emerald-700 font-semibold">- ₹{discount.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-white to-emerald-50 rounded-lg p-3 sm:p-4 border border-emerald-200 shadow-sm">
                        <div className="flex justify-between items-center text-base sm:text-lg font-bold">
                          <span className="text-gray-900">Total:</span>
                          <span className="text-emerald-700"> ₹{total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 sm:pt-4">
                      <button
                        onClick={handleGenerateBill}
                        className="px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white rounded-lg sm:rounded-xl transition-all duration-200 font-semibold flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center shadow-lg"
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
          className="mt-6 sm:mt-8 lg:mt-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl p-4 sm:p-6 border border-blue-200 shadow-lg"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm">
              <Calendar className="text-white" size={16} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Bill History</h2>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-hidden rounded-xl border border-blue-200 shadow-sm">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="py-3 px-3 sm:px-4 text-left font-semibold text-gray-600 text-sm">Bill ID</th>
                  <th className="py-3 px-3 sm:px-4 text-left font-semibold text-gray-600 text-sm">Customer</th>
                  <th className="py-3 px-3 sm:px-4 text-right font-semibold text-gray-600 text-sm">Total</th>
                  <th className="py-3 px-3 sm:px-4 text-left font-semibold text-gray-600 text-sm">Date</th>
                  <th className="py-3 px-3 sm:px-4 text-center font-semibold text-gray-600 text-sm">Status</th>
                  <th className="py-3 px-3 sm:px-4 text-center font-semibold text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-blue-50 transition-colors">
                    <td className="py-3 px-3 sm:px-4 font-medium text-gray-900 text-sm">{bill.bill_id}</td>
                    <td className="py-3 px-3 sm:px-4 text-gray-700 text-sm">{bill.customer_name || "Walk-in Customer"}</td>
                    <td className="py-3 px-3 sm:px-4 text-right font-semibold text-gray-900 text-sm">
                       ₹{parseFloat(bill.total).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-gray-600 text-sm">
                      {new Date(bill.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex justify-center">
                        {bill.payment_status === "paid" ? (
                          <span className="px-2 py-1 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200 shadow-sm">
                            🟢 Paid
                          </span>
                        ) : bill.payment_status === "failed" ? (
                          <span className="px-2 py-1 bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 rounded-full text-xs font-medium border border-rose-200 shadow-sm">
                            🔴 Failed
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 rounded-full text-xs font-medium border border-amber-200 shadow-sm">
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
                            className="px-3 py-1 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 cursor-pointer text-white rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-1 text-xs font-medium shadow-sm"
                          >
                            <Download size={12} />
                            {downloadingId === bill.id ? `${progress}%` : "Invoice"}
                          </button>
                        ) : bill.payment_status === "pending" ? (
                          <button
                            onClick={() => openPaymentModal(bill)}
                            className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 cursor-pointer text-white rounded-lg transition-all duration-200 text-xs font-medium flex items-center gap-1 shadow-sm"
                          >
                            <Volume2 size={12} />
                            Pay Now
                          </button>
                        ) : (
                          <span className="text-rose-600 text-xs">Payment Failed</span>
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
              <div key={bill.id} className="bg-gradient-to-r from-white to-blue-50 rounded-xl p-3 sm:p-4 border border-blue-200 shadow-sm">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Bill #{bill.id}</h3>
                      <p className="text-gray-700 text-xs sm:text-sm mt-1">{bill.customer_name || "Walk-in Customer"}</p>
                    </div>
                    <div>
                      {bill.payment_status === "paid" ? (
                        <span className="px-2 py-1 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200 shadow-sm">
                          🟢 Paid
                        </span>
                      ) : bill.payment_status === "failed" ? (
                        <span className="px-2 py-1 bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 rounded-full text-xs font-medium border border-rose-200 shadow-sm">
                          🔴 Failed
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 rounded-full text-xs font-medium border border-amber-200 shadow-sm">
                          🟠 Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-600">Total Amount</p>
                      <p className="font-semibold text-gray-900 text-base sm:text-lg">
                         ₹{parseFloat(bill.total).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Date</p>
                      <p className="text-gray-700">{new Date(bill.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    {bill.payment_status === "paid" ? (
                      <button
                        onClick={() => handleDownloadInvoice(bill.id)}
                        disabled={downloadingId === bill.id}
                        className="w-full px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium shadow-sm"
                      >
                        <Download size={14} />
                        {downloadingId === bill.id ? `Downloading ${progress}%` : "Download Invoice"}
                      </button>
                    ) : bill.payment_status === "pending" ? (
                      <button
                        onClick={() => openPaymentModal(bill)}
                        className="w-full px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Volume2 size={14} />
                        Proceed to Payment
                      </button>
                    ) : (
                      <div className="text-center py-2">
                        <span className="text-rose-600 text-xs sm:text-sm">Payment Failed - Contact Support</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {bills.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <FileText className="mx-auto text-gray-400 mb-3 sm:mb-4" size={32} />
              <p className="text-gray-700 text-base sm:text-lg mb-2">No bills found</p>
              <p className="text-gray-500 text-sm">Bills will appear here once created</p>
            </div>
          )}
        </motion.section>
      </div>
    </PayPalScriptProvider>
  );
};

export default Billing;