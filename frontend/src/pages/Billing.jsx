// src/pages/Billing.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  FileText,
  ShoppingCart,
  User2,
  Download,
  Calendar,
  DollarSign,
  Volume2,
  ChevronRight,
  Filter,
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import api from "../api";
import SectionLoader from "../components/SectionLoader";

const Billing = () => {
  const token = localStorage.getItem("accessToken");
  const role = localStorage.getItem("role");
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "";
  const paypalCurrency = import.meta.env.VITE_PAYPAL_CURRENCY || "USD";

  // Primary state
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
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingBills, setLoadingBills] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  console.log("products==>", products);
  // Enhanced Bill History state
  const [billFilter, setBillFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedBill, setExpandedBill] = useState(null);

  // Wizard state
  const [step, setStep] = useState(1);
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);

  const isMounted = useRef(true);
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // Utility: currency format
  const formatINR = useCallback((v) => {
    try {
      const n = Number(v);
      if (Number.isNaN(n)) return `₹0.00`;
      return `₹${n.toFixed(2)}`;
    } catch {
      return `₹0.00`;
    }
  }, []);

  // Voice synthesis
  const speakAmount = (amount, billId = null) => {
    if ("speechSynthesis" in window) {
      try {
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
      } catch (err) {
        console.error("Speech error:", err);
      }
    }
  };

  // -------------------------
  // Safe fetches
  // -------------------------
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchProducts = useCallback(async (signal) => {
    try {
      setLoadingProducts(true);
      const res = await api.get("/products/", { signal });
      if (!isMounted.current) return;
      setProducts(res.data.results || res.data || []);
    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError") return;
      console.error(err);
      toast.error("Error loading products ❌");
    } finally {
      if (isMounted.current) setLoadingProducts(false);
    }
  }, []);

  const fetchBills = useCallback(async (signal) => {
    try {
      setLoadingBills(true);
      const res = await api.get("/billings/", { signal });
      if (!isMounted.current) return;
      setBills(res.data.results || res.data || []);
    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError") return;
      console.error(err);
      toast.error("Failed to fetch bills ❌");
    } finally {
      if (isMounted.current) setLoadingBills(false);
    }
  }, []);

  const fetchRecentBills = useCallback(async (signal) => {
    try {
      const res = await api.get(`/billings/?recent=5`, { signal });
      if (!isMounted.current) return;
      setRecentBills(res.data.results || res.data || []);
    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError") return;
      console.error("Error fetching recent bills:", err);
      toast.error("Failed to fetch recent bills ❌");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    fetchBills(controller.signal);

    if (role === "cashier") {
      fetchProducts(controller.signal);
    }

    fetchRecentBills(controller.signal);

    return () => controller.abort();
  }, [token, role, fetchProducts, fetchBills, fetchRecentBills]);

  // -------------------------
  // Enhanced Bill History Functions
  // -------------------------
  const getStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredAndSortedBills = useMemo(() => {
    let filtered = bills;

    // Filter by status
    if (billFilter !== "all") {
      filtered = filtered.filter((bill) => bill.payment_status === billFilter);
    }

    // Sort bills
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at || b.id) - new Date(a.created_at || a.id);
        case "oldest":
          return new Date(a.created_at || a.id) - new Date(b.created_at || b.id);
        case "amount-high":
          return parseFloat(b.total) - parseFloat(a.total);
        case "amount-low":
          return parseFloat(a.total) - parseFloat(b.total);
        default:
          return 0;
      }
    });

    return filtered;
  }, [bills, billFilter, sortBy]);

  // -------------------------
  // Product search
  // -------------------------
  const handleSearch = async () => {
    try {
      setLoadingProducts(true);
      const res = await api.get(`/products/?search=${encodeURIComponent(searchTerm)}`);
      setProducts(res.data.results || res.data || []);
      toast.success("Products filtered ✅");
    } catch (err) {
      console.error("Product search error:", err);
      toast.error("Failed to search products ❌");
    } finally {
      setLoadingProducts(false);
    }
  };

  // -------------------------
  // Cart functions
  // -------------------------
  const addToCart = (product) => {
    const exists = cart.find((c) => c.id === product.id);

    if (exists) {
      setCart((prev) => prev.map((c) => (c.id === product.id ? { ...c, qty: c.qty + 1 } : c)));
    } else {
      setCart((prev) => [
        ...prev,
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

    toast.success(`${product.name} added to cart`);
  };

  const removeFromCart = (id) => {
    const removed = cart.find((c) => c.id === id);
    if (!window.confirm(`Remove ${removed?.name || "item"} from cart?`)) return;
    setCart((prev) => prev.filter((c) => c.id !== id));
    toast.info(`${removed?.name || "Item"} removed from cart`);
  };

  const updateQty = (id, newQty) => {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty: newQty } : c)));
  };

  // -------------------------
  // Calculations
  // -------------------------
  const roundToCents = (v) => Math.round(Number(v) * 100) / 100;
  const subtotal = useMemo(
    () => roundToCents(cart.reduce((s, i) => s + roundToCents(Number(i.price) * Number(i.qty)), 0)),
    [cart]
  );
  const tax = useMemo(() => roundToCents(subtotal * 0.05), [subtotal]);
  const discount = useMemo(() => roundToCents(subtotal * 0.1), [subtotal]);
  const total = useMemo(() => roundToCents(subtotal + tax - discount), [subtotal, tax, discount]);

  // -------------------------
  // Customer search
  // -------------------------
  const validateContact = (c) => {
    const trimmed = String(c || "").trim();
    if (!trimmed) return false;
    const digits = trimmed.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  };

  const handleSearchCustomer = async () => {
    if (!customer.contact_number?.trim()) {
      toast.warn("Enter contact number to search");
      return;
    }
    setLoadingCustomer(true);
    const controller = new AbortController();
    try {
      const res = await api.get(`/customers/search/?contact=${encodeURIComponent(customer.contact_number)}`, {
        signal: controller.signal,
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
      if (err.name === "CanceledError" || err.name === "AbortError") return;
      if (err?.response?.status === 404) {
        setFoundCustomer(null);
        toast.info("New customer — please enter name to add");
      } else {
        console.error("Customer search error:", err);
        toast.error("Error searching customer ❌");
      }
    } finally {
      if (isMounted.current) setLoadingCustomer(false);
    }
  };

  // -------------------------
  // Invoice download
  // -------------------------
  // Invoice download (simple, no progress or percentages)
  const handleDownloadInvoice = async (billId) => {
    setDownloadingId(billId); // to disable button during the request

    try {
      toast.info("Preparing invoice...");

      const res = await api.get(`/billings/${billId}/invoice/`, {
        responseType: "blob",
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

      toast.success("Invoice downloaded!");
    } catch (err) {
      console.error("Invoice download error:", err);

      if (err.response?.status === 404) {
        toast.error("Invoice not found for this bill");
      } else {
        toast.error("Failed to download invoice");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  // -------------------------
  // Create bill
  // -------------------------
  const handleGenerateBill = async () => {
    if (role !== "cashier") {
      return toast.error("Only cashiers can generate bills.");
    }
    if (!cart.length) return toast.warn("Cart is empty");
    if (!token) return toast.error("Please log in");

    if (isGeneratingBill) {
      return toast.info("Bill generation in progress...");
    }

    setIsGeneratingBill(true);
    const controller = new AbortController();

    try {
      let customerId = foundCustomer?.id;
      if (!customerId) {
        if (!customer.name?.trim()) return toast.warn("Enter new customer name");
        if (!validateContact(customer.contact_number)) {
          toast.warn("Please enter a valid contact number for the new customer");
          return;
        }

        try {
          const newCust = await api.post("/customers/", customer, { signal: controller.signal });
          customerId = newCust.data.id;
        } catch (customerError) {
          if (customerError.response?.data?.contact_number) {
            toast.error(`Customer with contact number ${customer.contact_number} already exists`);
            setIsGeneratingBill(false);
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

      const billRes = await api.post("/billings/", payload, { signal: controller.signal });
      const billId = billRes.data.id;

      const pendingPaymentId = localStorage.getItem("pendingPaymentId");
      if (pendingPaymentId && paypalOrderId) {
        try {
          await api.patch(`/payments/${paypalOrderId}/link_bill/`, { bill_id: billId });
          await api.patch(
            `/billings/${billId}/mark_paid/`,
            {
              transaction_id: paypalOrderId,
              payment_method: "paypal",
            },
            { headers: authHeaders }
          );

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

      await fetchBills();
      await fetchRecentBills();

      setStep(3);
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
    } finally {
      if (isMounted.current) setIsGeneratingBill(false);
    }
  };

  // -------------------------
  // Payment modal functions & PayPal components
  // -------------------------
  const openPaymentModal = (bill) => {
    setSelectedBillForPayment(bill);
    setShowPaymentModal(true);
    const amount = parseFloat(bill.total).toFixed(2);
    speakAmount(amount, bill.bill_id || bill.id);
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
        await api.patch(
          `/billings/${bill.id}/mark_paid/`,
          {
            transaction_id: transactionId,
            payment_method: paymentMethod,
          },
          { headers: authHeaders }
        );

        toast.success("✅ Payment successful! Invoice unlocked.");
        await fetchBills();
        await fetchRecentBills();
        closePaymentModal();
      } else {
        throw new Error("Payment record creation failed");
      }
    } catch (err) {
      console.error("Bill payment error:", err);
      toast.error("Failed to process payment ❌");
    }
  };

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

            <button onClick={closePaymentModal} className="text-gray-500 hover:text-gray-700 text-xl" title="Close">
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
              <span className="text-emerald-600 font-bold">
                {formatINR(parseFloat(selectedBillForPayment.total).toFixed(2))}
              </span>
            </p>

            {/* Voice replay */}
            <div className="flex justify-center mb-2">
              <button
                onClick={() => {
                  const amount = parseFloat(selectedBillForPayment.total).toFixed(2);
                  speakAmount(amount, selectedBillForPayment.bill_id || selectedBillForPayment.id);
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

  // -------------------------
  // Wizard helpers: navigation & validation
  // -------------------------
  const goNext = () => {
    if (step === 1) {
      if (!foundCustomer && !customer.name.trim()) {
        toast.warn("Please search for an existing customer or enter a name");
        return;
      }
      if (!validateContact(customer.contact_number)) {
        toast.warn("Please provide a valid contact number (7-15 digits)");
        return;
      }
    }

    if (step === 2) {
      if (cart.length === 0) {
        toast.warn("Cart is empty — add items before proceeding");
        return;
      }
    }

    setStep((s) => Math.min(3, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const jumpTo = (s) => {
    if (s > 1 && step === 1) {
      toast.info("Please complete customer step first");
      return;
    }
    setStep(s);
  };

  // -------------------------
  // Enhanced Cart Display Component
  // -------------------------
  const CartDisplay = () => (
    <div className="bg-gradient-to-r from-white to-emerald-50 rounded-2xl p-4 border border-emerald-200 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-emerald-600" />
          Cart ({cart.length})
        </h3>
        <div className="text-lg font-bold text-emerald-700">{formatINR(total.toFixed(2))}</div>
      </div>

      {cart.length === 0 ? (
        <div className="text-center text-gray-500 py-6">
          <ShoppingCart className="mx-auto mb-2 text-gray-300" size={32} />
          <p>Cart is empty</p>
          <p className="text-sm">Add items from the products list</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {cart.map((item) => (
            <div
              key={item.id}
              className="bg-white p-3 rounded-lg border border-gray-100 hover:border-emerald-200 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                    <span>{item.category}</span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-600">{formatINR(item.price)} each</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
                    >
                      -
                    </button>
                    <span className="font-medium w-8 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right min-w-20">
                    <div className="font-semibold text-gray-900">{formatINR((item.price * item.qty).toFixed(2))}</div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // -------------------------
  // Enhanced Bill History Component
  // -------------------------
  const BillHistorySection = () => (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm">
            <FileText className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bill History</h2>
            <p className="text-sm text-gray-600">Manage and track all your bills</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={billFilter}
            onChange={(e) => setBillFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount-high">Amount: High to Low</option>
            <option value="amount-low">Amount: Low to High</option>
          </select>

          <button
            onClick={() => fetchBills()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {loadingBills ? (
        <div className="flex justify-center py-12">
          <SectionLoader />
        </div>
      ) : filteredAndSortedBills.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto mb-4 text-gray-300" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No bills found</h3>
          <p className="text-gray-500 mb-4">
            {billFilter === "all" ? "No bills have been created yet." : `No ${billFilter} bills found.`}
          </p>
          {billFilter !== "all" && (
            <button
              onClick={() => setBillFilter("all")}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              Show All Bills
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedBills.map((bill) => (
            <div
              key={bill.id}
              className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200"
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border ${getStatusColor(bill.payment_status)}`}>
                        {getStatusIcon(bill.payment_status)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Bill #{bill.bill_id}</h3>
                        <p className="text-sm text-gray-600">
                          {bill.customer_name || "Walk-in Customer"} • {formatDate(bill.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{formatINR(parseFloat(bill.total).toFixed(2))}</div>
                      <div className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(bill.payment_status)}`}>
                        {bill.payment_status?.charAt(0).toUpperCase() + bill.payment_status?.slice(1)}
                      </div>
                    </div>
<div className="flex items-center gap-2">
  {bill.payment_status === 'paid' ? (
    <button
      onClick={() => handleDownloadInvoice(bill.id)}
      disabled={downloadingId === bill.id}
      className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {downloadingId === bill.id ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Invoice
        </>
      )}
    </button>
  ) : bill.payment_status === 'pending' ? (
    <button
      onClick={() => openPaymentModal(bill)}
      className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
    >
      <DollarSign className="h-4 w-4" />
      Pay Now
    </button>
  ) : (
    <button
      onClick={() => openPaymentModal(bill)}
      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
    >
      <DollarSign className="h-4 w-4" />
      Retry Payment
    </button>
  )}

  <button
    onClick={() => setExpandedBill(expandedBill === bill.id ? null : bill.id)}
    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
  >
    <ChevronRight
      className={`h-4 w-4 transition-transform ${expandedBill === bill.id ? 'rotate-90' : ''}`}
    />
  </button>
</div>

                  </div>
                </div>

                {expandedBill === bill.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Bill Details</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatINR(bill.subtotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax (5%):</span>
                            <span>{formatINR(bill.tax)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Discount (10%):</span>
                            <span>-{formatINR(bill.discount)}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t pt-1">
                            <span>Total:</span>
                            <span>{formatINR(bill.total)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Payment Info</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Method:</span>
                            <span>{bill.payment_method || "Not specified"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Transaction ID:</span>
                            <span className="font-mono text-xs">{bill.transaction_id || "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Actions</h4>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleDownloadInvoice(bill.id)}
                            disabled={downloadingId === bill.id || bill.payment_status !== "paid"}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {downloadingId === bill.id ? "Downloading..." : "Download PDF"}
                          </button>

                          <button
                            onClick={() => openPaymentModal(bill)}
                            disabled={bill.payment_status === "paid"}
                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Make Payment
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {filteredAndSortedBills.length} of {bills.length} bills
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Paid</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Failed</span>
          </div>
        </div>
      </div>
    </motion.section>
  );

  // -------------------------
  // Render
  // -------------------------
  return (
    <PayPalScriptProvider options={{ "client-id": paypalClientId, currency: paypalCurrency }}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800 p-4 lg:p-6">
        <PaymentModal />
        <ToastContainer position="top-right" autoClose={3000} />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl shadow-lg">
              {role === "cashier" ? (
                <ShoppingCart className="text-white" size={24} />
              ) : (
                <FileText className="text-white" size={24} />
              )}
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {role === "cashier" ? "Billing System" : "Bill Management Dashboard"}
              </h1>
              <p className="text-gray-600">
                {role === "cashier" ? "Process customer orders and payments" : "View and manage billing history"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Wizard top bar */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => jumpTo(1)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    step === 1
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  1. Customer
                </button>
                <div className={`h-1 flex-1 rounded-full ${step > 1 ? "bg-emerald-300" : "bg-gray-200"}`} />
                <button
                  onClick={() => jumpTo(2)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    step === 2
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                      : step > 2
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  2. Items
                </button>
                <div className={`h-1 flex-1 rounded-full ${step > 2 ? "bg-emerald-300" : "bg-gray-200"}`} />
                <button
                  onClick={() => jumpTo(3)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    step === 3
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                      : step > 2
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  3. Review & Payment
                </button>
              </div>

              <div className="text-sm text-gray-600 font-medium">Step {step} of 3</div>
            </div>
          </div>
        </div>

        {/* Main container */}
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Wizard steps */}
          <div className="grid grid-cols- lg:grid-cols-3 gap-8">
            {/* Left: Main wizard content */}
            <div className="lg:col-span-4 space-y-6">
              {/* Step 1: Customer */}
              {step === 1 && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-lg shadow-sm">
                      <User2 className="text-white" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">1 — Customer Information</h2>
                      <p className="text-gray-600 text-sm">Search existing customer or add new customer details</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white rounded-xl p-4 border border-amber-100">
                      <label className="block text-sm font-medium text-gray-700 mb-3">Contact Number</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          placeholder="Enter contact number..."
                          value={customer.contact_number}
                          onChange={(e) => setCustomer((p) => ({ ...p, contact_number: e.target.value }))}
                          className="flex-1 px-4 py-3 rounded-xl bg-white border border-amber-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-500 text-base shadow-sm"
                        />
                        <button
                          onClick={handleSearchCustomer}
                          disabled={loadingCustomer}
                          className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl transition-all duration-200 disabled:opacity-50 font-medium text-base shadow-lg flex items-center gap-2"
                        >
                          {loadingCustomer ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Searching...
                            </>
                          ) : (
                            <>
                              <Search className="h-4 w-4" />
                              Search
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {!foundCustomer && (
                      <div className="bg-white rounded-xl p-4 border border-amber-100">
                        <label className="block text-sm font-medium text-gray-700 mb-3">New Customer Name</label>
                        <input
                          type="text"
                          placeholder="Enter customer name..."
                          value={customer.name}
                          onChange={(e) => setCustomer((p) => ({ ...p, name: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-amber-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-500 text-base shadow-sm"
                        />
                      </div>
                    )}

                    {foundCustomer && (
                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 rounded-lg">
                            <User2 className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-emerald-700 font-semibold">Customer Found</p>
                            <p className="text-gray-800 font-bold text-lg">{foundCustomer.name}</p>
                            <p className="text-gray-500">{foundCustomer.contact_number}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between gap-3 pt-4">
                      <div />
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setCustomer({ name: "", contact_number: "" });
                            setFoundCustomer(null);
                          }}
                          className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                        >
                          Clear
                        </button>
                        <button
                          onClick={goNext}
                          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors flex items-center gap-2"
                        >
                          Continue
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* Step 2: Items */}
              {step === 2 && (
                <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="bg-gradient-to-r from-white to-blue-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm">
                        <Search className="text-white" size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">2 — Add Products</h2>
                        <p className="text-gray-600 text-sm">Search and add products to the cart</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-start mb-6">
                      <div className="flex-1 flex gap-3">
                        <input
                          type="text"
                          placeholder="Search products by name or category..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="flex-1 px-4 py-3 rounded-xl bg-white border border-blue-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-base shadow-sm"
                        />
                        <button
                          onClick={handleSearch}
                          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                        >
                          <Search className="h-4 w-4" />
                          Search
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          fetchProducts();
                        }}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                      >
                        Reset
                      </button>
                    </div>

                    {loadingProducts ? (
                      <div className="flex justify-center py-8">
                        <SectionLoader />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map((product) => (
                          <div
                            key={product.id}
                            className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-200 group"
                            onClick={() => addToCart(product)}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {product.name}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  {product?.category_detail?.name || "Uncategorized"}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-emerald-700 font-bold text-lg">
                                  ₹{parseFloat(product.price).toFixed(2)}
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-xs text-gray-400">
                                Stock: {product.quantity || "N/A"}
                                <div className="flex justify-center rounded-3xl mt-2">
                                  <img className="rounded-xl" width={70} src={product.image} alt="" />
                                </div>
                              </div>
                              <div className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-sm font-medium group-hover:bg-emerald-600 transition-colors flex items-center gap-1">
                                <Plus className="h-3 w-3" />
                                Add to Cart
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {products.length === 0 && !loadingProducts && (
                      <div className="text-center py-8 text-gray-500">
                        <Search className="mx-auto mb-3 text-gray-300" size={32} />
                        <p>No products found</p>
                        <p className="text-sm">Try adjusting your search terms</p>
                      </div>
                    )}

                    <div className="flex justify-between pt-6">
                      <button
                        onClick={goBack}
                        className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={goNext}
                        className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors flex items-center gap-2"
                      >
                        Review Order
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Cart summary */}
                  <CartDisplay />
                </motion.section>
              )}

              {/* Step 3: Review & Payment */}
              {step === 3 && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-white to-emerald-50 rounded-2xl p-6 border border-emerald-200 shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-r from-emerald-400 to-green-400 rounded-lg shadow-sm">
                      <DollarSign className="text-white" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">3 — Review & Payment</h2>
                      <p className="text-gray-600 text-sm">Verify details and complete payment</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl p-5 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-4 text-lg">Customer Details</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm text-gray-500">Name</label>
                            <p className="font-medium">
                              {foundCustomer ? foundCustomer.name : customer.name || "Walk-in Customer"}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500">Contact</label>
                            <p className="font-medium">{customer.contact_number}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500">Customer Type</label>
                            <p className="font-medium">{foundCustomer ? "Existing Customer" : "New Customer"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-5 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-4 text-lg">Order Summary</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">{formatINR(subtotal.toFixed(2))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tax (5%):</span>
                            <span className="font-medium">{formatINR(tax.toFixed(2))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Discount (10%):</span>
                            <span className="font-medium text-emerald-600">-{formatINR(discount.toFixed(2))}</span>
                          </div>
                          <hr className="my-3" />
                          <div className="flex justify-between text-lg font-bold">
                            <span className="text-gray-900">Total Amount:</span>
                            <span className="text-emerald-600">{formatINR(total.toFixed(2))}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <CartDisplay />

                    <div className="bg-white rounded-xl p-5 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4 text-lg">Payment Options</h4>
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                          <button
                            onClick={handleGenerateBill}
                            disabled={isGeneratingBill}
                            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {isGeneratingBill ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Generating Bill...
                              </>
                            ) : (
                              <>
                                <FileText className="h-4 w-4" />
                                Generate Bill Only
                              </>
                            )}
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowPayPal((s) => !s)}
                              className="px-6 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium transition-colors flex items-center gap-2"
                            >
                              <DollarSign className="h-4 w-4" />
                              {showPayPal ? "Hide PayPal" : "Pay with PayPal"}
                            </button>
                          </div>
                        </div>

                        {showPayPal && (
                          <div className="bg-gray-50 rounded-xl p-4 border">
                            <CartPaypalButtons />
                          </div>
                        )}

                        <div className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <strong>Tip:</strong> You can complete PayPal payment first — then click "Generate Bill" to link
                          the payment automatically.
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        onClick={goBack}
                        className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                      >
                        Back to Items
                      </button>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setCart([]);
                            setCustomer({ name: "", contact_number: "" });
                            setFoundCustomer(null);
                            setStep(1);
                          }}
                          className="px-6 py-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-medium transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Start Over
                        </button>
                        <button
                          onClick={() => {
                            setStep(3);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
                        >
                          Complete Order
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}
            </div>

            {/* Right: Quick actions and stats */}
          </div>

          {/* Enhanced Bill History Section */}
          <BillHistorySection />
        </div>
      </div>
    </PayPalScriptProvider>
  );
};

// Add missing RefreshCw icon component
const RefreshCw = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

export default Billing;
