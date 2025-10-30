import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const Billing = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const API_PRODUCTS = "http://127.0.0.1:8000/api/products/";
  const API_BILLS = "http://127.0.0.1:8000/api/billings/";
  const API_CUSTOMERS = "http://127.0.0.1:8000/api/customers/";

  useEffect(() => {
    fetchProducts();
    fetchBills();
  }, []);

  const fetchProducts = async (query = "") => {
    setLoading(true);
    const token = localStorage.getItem("accessToken");
    try {
      const res = await axios.get(API_PRODUCTS + (query ? `?search=${query}` : ""), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.results || res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await axios.get(API_BILLS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBills(res.data.results || res.data);
      console.log("customername==>",res.data.results)
    } catch (err) {
      console.error("Error fetching bills:", err);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find((i) => i.product_id === product.id);
    if (existing) {
      setCart(cart.map((i) => i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { product_id: product.id, name: product.name, price: product.price, qty: 1 }]);
    }
  };

  const removeFromCart = (product_id) => {
    setCart(cart.filter((i) => i.product_id !== product_id));
  };

  const subtotal = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.qty, 0), [cart]);
  const tax = useMemo(() => subtotal * 0.05, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const handleCheckout = async () => {
    const token = localStorage.getItem("accessToken");
    if (!cart.length) return alert("Cart is empty!");
    if (!customerName.trim()) return alert("Enter customer name");

    try {
      // Create or get customer
      const customerRes = await axios.post(
        API_CUSTOMERS,
        { name: customerName.trim(), contact_number: customerPhone.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const customerId = customerRes.data.id;
      
      await axios.post(
        API_BILLS,
        {
          customer: customerId,
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          total: total.toFixed(2),
          items: cart.map((c) => ({ product: c.product_id, qty: c.qty, price: c.price })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Bill created successfully!");
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      fetchBills();
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Checkout failed. Check console.");
    }
  };

  return (
    <div className="min-h-screen p-6 text-gray-100 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full sm:w-1/3 p-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-emerald-500"
          />
          <input
            type="text"
            placeholder="Phone number"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full sm:w-1/3 p-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-emerald-500"
          />
        </div>

        {/* Products & Cart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Products */}
          <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 p-6 rounded-2xl">
            <h2 className="text-xl font-semibold text-emerald-400 mb-4">Products</h2>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                fetchProducts(e.target.value);
              }}
              className="w-full mb-4 p-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-emerald-500"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="bg-gray-900/60 p-3 rounded-xl border border-gray-700 hover:border-emerald-500 transition text-left"
                >
                  <div className="text-gray-100 font-medium">{p.name}</div>
                  <div className="text-sm text-gray-400">₹{p.price}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 p-6 rounded-2xl space-y-4">
            <h2 className="text-xl font-semibold text-emerald-400">Cart</h2>
            {cart.map((item) => (
              <div
                key={item.product_id}
                className="flex justify-between items-center bg-gray-900/40 border border-gray-700 rounded-lg p-2"
              >
                <div>
                  <div className="text-gray-100">{item.name}</div>
                  <div className="text-xs text-gray-400">
                    ₹{item.price} × {item.qty}
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.product_id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}

            <div className="border-t border-gray-700 pt-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span> ₹{subtotal.toFixed(2)}
              </div>
              <div className="flex justify-between">
                <span>Tax (5%):</span> ₹{tax.toFixed(2)}
              </div>
              <div className="flex justify-between font-semibold text-emerald-400">
                <span>Total:</span> ₹{total.toFixed(2)}
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-semibold transition"
            >
              Generate Bill
            </button>
          </div>
        </div>

        {/* 🧾 Recent Bills Section */}
        <div className="mt-8 bg-gray-800/60 backdrop-blur-xl border border-gray-700 p-6 rounded-2xl">
          <h2 className="text-xl font-semibold text-emerald-400 mb-4">Recent Bills</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="text-left py-2">Bill ID</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-gray-400 py-3">
                      No bills found
                    </td>
                  </tr>
                ) : (
                  bills.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-gray-700 hover:bg-gray-700/30"
                    >
                      <td className="py-2">{b.bill_id}</td>
                      <td>{b.customer.name}</td>
                      <td>{b.customer.contact_number || "-"}</td>
                      <td>₹{b.total}</td>
                      <td>{new Date(b.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
