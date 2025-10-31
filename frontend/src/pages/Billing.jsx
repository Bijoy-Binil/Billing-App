import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

const Billing = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: "", contact_number: "" });
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [bills, setBills] = useState([]);
  const [message, setMessage] = useState("");
  const API_BILLS = "http://127.0.0.1:8000/api/billings/";
  // ✅ Token
  const token = localStorage.getItem("accessToken");

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

  // --- Load products and bills ---
  useEffect(() => {
    if (!token) {
      console.warn("⚠️ No token found in localStorage");
      return;
    }
    fetchBills();
    axios
      .get("http://127.0.0.1:8000/api/products/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProducts(res.data.results || res.data || []))
      .catch((err) => console.error("Error loading products:", err));
  }, [token]);

  // --- Download PDF from backend ---
  const handleDownloadInvoice = async (billId) => {
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/api/billing/${billId}/invoice/`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob", // important for binary data
        }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      // create temporary link to trigger download
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

  // --- Add to cart ---
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

  // --- Remove from cart ---
  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // --- Totals (with rounding for financial precision) ---
  const roundToCents = (value) => Math.round(value * 100) / 100;

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

  // --- Search customer (using dedicated search endpoint for efficiency) ---
  const handleSearchCustomer = async () => {
    if (!customer.contact_number.trim()) return;
    setLoadingCustomer(true);
    setMessage("");
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/api/customers/search/?contact=${customer.contact_number}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const found = res.data; // Single object or error

      if (found && found.id) { // Success: found customer
        setFoundCustomer(found);
        setCustomer({ name: found.name, contact_number: found.contact_number });
        setMessage(`Customer found: ${found.name}`);
      } else {
        setFoundCustomer(null);
        setMessage("New customer — please enter name to add.");
      }
    } catch (err) {
      console.error(err);
      // Handle 404 or other errors
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

  // --- Generate bill ---
  const handleGenerateBill = async () => {
    if (!cart.length) {
      alert("Cart is empty!");
      return;
    }
    if (!token) {
      alert("Please log in to generate a bill.");
      return;
    }

    try {
      let customerId = foundCustomer?.id;

      // Create new customer if not exists (validate name for new)
      if (!customerId) {
        if (!customer.name.trim()) {
          alert("Please enter customer name for new customer.");
          return;
        }
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
        items: cart.map((item) => ({
          product: item.id,
          quantity: item.qty,
          price: roundToCents(item.price), // Ensure rounded price per item
        })),
      };

      console.log("Sending payload:", payload); // Debug: Check values before send

      const billRes = await axios.post(
        "http://127.0.0.1:8000/api/billings/",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`✅ Bill generated successfully: ${billRes.data.bill_id}`);
      setCart([]);
      setCustomer({ name: "", contact_number: "" });
      setFoundCustomer(null);
      setMessage("");
      fetchBills(); // Refresh bills list
    } catch (err) {
      console.error("Full error:", err.response?.data || err);
      const errorDetail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      alert(`❌ Error generating bill: ${errorDetail}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">🧾 Billing Section</h1>

      {/* Customer Search */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-medium mb-2">Customer Details</h2>
        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="Contact Number"
            value={customer.contact_number}
            onChange={(e) =>
              setCustomer({ ...customer, contact_number: e.target.value })
            }
            className="px-3 py-2 rounded bg-gray-700 text-white w-48"
          />
          <button
            onClick={handleSearchCustomer}
            disabled={loadingCustomer}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded disabled:opacity-50"
          >
            {loadingCustomer ? "Searching..." : "Search"}
          </button>
          {message && <p className="text-sm text-green-400 mt-2">{message}</p>}
        </div>

        {!foundCustomer && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="Customer Name (for new)"
              value={customer.name}
              onChange={(e) =>
                setCustomer({ ...customer, name: e.target.value })
              }
              className="px-3 py-2 rounded bg-gray-700 text-white w-64"
            />
          </div>
        )}

        {foundCustomer && (
          <p className="mt-2 text-gray-300">
            Found: <strong>{foundCustomer.name}</strong> ({foundCustomer.contact_number})
          </p>
        )}
      </div>

      {/* Product List */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {products.length === 0 ? (
          <p className="col-span-3 text-gray-400 italic">Loading products...</p>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={() => addToCart(product)}
            >
              <h3 className="text-lg font-medium">{product.name}</h3>
              <p className="text-gray-400">₹{parseFloat(product.price).toFixed(2)}</p>
            </div>
          ))
        )}
      </div>

      {/* Cart Section */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-xl font-medium mb-3">Cart ({cart.length} items)</h2>

        {cart.length === 0 ? (
          <p className="text-gray-400 italic py-4">Cart is empty. Click on products above to add items.</p>
        ) : (
          <>
            <table className="w-full text-left mb-4">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="py-2">Product</th>
                  <th className="py-2 w-16">Qty</th>
                  <th className="py-2 w-24">Price</th>
                  <th className="py-2 w-24">Total</th>
                  <th className="py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id} className="border-b border-gray-700/50">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2">{item.qty}</td>
                    <td className="py-2">₹{parseFloat(item.price).toFixed(2)}</td>
                    <td className="py-2">₹{roundToCents(item.qty * item.price).toFixed(2)}</td>
                    <td>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-600 text-lg"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div className="text-right space-y-1 pt-4 border-t border-gray-600">
              <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
              <p>Tax (5%): +₹{tax.toFixed(2)}</p>
              <p>Discount (10%): -₹{discount.toFixed(2)}</p>
              <hr className="my-1" />
              <p className="font-semibold text-lg">
                Total: ₹{total.toFixed(2)}
              </p>
              <button
                onClick={handleGenerateBill}
                disabled={!token || loadingCustomer}
                className="bg-green-600 hover:bg-green-700 mt-4 px-6 py-2 rounded disabled:opacity-50"
              >
                Generate Bill
              </button>
            </div>
          </>
        )}
      </div>

      {/* Bill History */}
      <div className="max-w-6xl mx-auto mt-8 bg-gray-800/60 backdrop-blur-xl border border-gray-700 p-6 rounded-2xl">
        <h2 className="text-xl font-semibold text-emerald-400 mb-4">Recent Bills</h2>
        {bills.length === 0 ? (
          <p className="text-gray-400 italic">No bills yet. Generate your first bill above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="text-left py-2">Bill ID</th>
                  <th className="py-2 w-24">Total</th>
                  <th className="py-2 w-32">Date</th>
                  <th className="py-2 w-32">Customer</th>
                  <th className="py-2 w-24">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-2 font-mono text-sm">{b.bill_id}</td>
                    <td className="py-2">₹{parseFloat(b.total || 0).toFixed(2)}</td>
                    <td className="py-2">{new Date(b.created_at).toLocaleString('en-IN')}</td>
                    <td className="py-2">{b.customer_name || 'Walk-in'}</td>
                    <td>
                      <button
                        onClick={() => handleDownloadInvoice(b.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Billing;