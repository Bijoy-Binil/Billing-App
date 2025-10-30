// src/pages/Billing.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const Billing = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const API_PRODUCTS =  "http://127.0.0.1:8000/api/products/";
  const API_BILLS ="http://127.0.0.1:8000/api/bills/";

  useEffect(() => {
    fetchProducts();
    fetchBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_PRODUCTS);
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async () => {
    try {
      const res = await axios.get(API_BILLS);
      setBills(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching bills:", err);
      setBills([]);
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const total = useMemo(() => cart.reduce((sum, i) => sum + Number(i.price || 0) * i.qty, 0), [cart]);
  const tax = useMemo(() => total * 0.05, [total]);
  const grandTotal = useMemo(() => total + tax, [total, tax]);

  const handleCheckout = async () => {
    if (!cart.length) return alert("Cart is empty!");
    try {
      await axios.post(API_BILLS, {
        items: cart.map((c) => ({ product_id: c.id, qty: c.qty })),
        total: Number(grandTotal.toFixed(2)),
      });
      alert("Bill generated successfully!");
      setCart([]);
      fetchBills();
      setMobileCartOpen(false);
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Checkout failed. See console for details.");
    }
  };

  return (
    <div className="min-h-screen p-6 text-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Products */}
          <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4 text-emerald-400">Products</h2>

            {/* responsive grid: 2 columns mobile -> 3 sm -> 4 md -> 3 lg (keeps your visual density) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3">
              {loading ? (
                // simple loading placeholders
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-gray-900/40 p-3 rounded-xl border border-gray-700 animate-pulse h-20" />
                ))
              ) : products.length === 0 ? (
                <div className="col-span-full text-gray-400">No products found</div>
              ) : (
                products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="bg-gray-900/60 p-3 rounded-xl border border-gray-700 hover:border-emerald-500 transition cursor-pointer text-left w-full"
                    aria-label={`Add ${p.name} to cart`}
                  >
                    <div className="font-medium text-gray-100 truncate">{p.name}</div>
                    <div className="text-sm text-gray-400">₹{p.price}</div>
                    <div className="text-xs text-gray-500">Qty: {p.quantity}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Cart + Bill - visible on md+ as the right column, on mobile it's accessible via bottom drawer */}
          <div className="hidden lg:block bg-gray-800/60 backdrop-blur-xl border border-gray-700 p-6 rounded-2xl space-y-4">
            <h2 className="text-xl font-semibold text-emerald-400">Cart</h2>

            <div className="space-y-3">
              {cart.length === 0 && <p className="text-gray-400">Cart is empty</p>}
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center bg-gray-900/40 border border-gray-700 rounded-lg p-2"
                >
                  <div>
                    <div className="text-gray-100">{item.name}</div>
                    <div className="text-xs text-gray-400">
                      ₹{item.price} × {item.qty}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                    aria-label={`Remove ${item.name}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t border-gray-700 pt-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span> ₹{total.toFixed(2)}
              </div>
              <div className="flex justify-between">
                <span>Tax (5%):</span> ₹{tax.toFixed(2)}
              </div>
              <div className="flex justify-between font-semibold text-emerald-400">
                <span>Total:</span> ₹{grandTotal.toFixed(2)}
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

        {/* Bill History */}
        <div className="mt-8 bg-gray-800/60 backdrop-blur-xl border border-gray-700 p-6 rounded-2xl">
          <h2 className="text-xl font-semibold text-emerald-400 mb-4">Recent Bills</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="text-left py-2">Bill ID</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                    <td className="py-2">{b.id}</td>
                    <td>₹{b.total}</td>
                    <td>{new Date(b.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile sticky cart button (visible on small screens) */}
        <div className="fixed inset-x-4 bottom-4 md:hidden z-50">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setMobileCartOpen((s) => !s)}
              className="bg-emerald-600/95 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-3 focus:outline-none"
              aria-expanded={mobileCartOpen}
              aria-controls="mobile-cart-drawer"
            >
              <span className="text-sm font-semibold">Cart</span>
              <span className="text-sm">({cart.length})</span>
              <span className="text-sm font-semibold">₹{grandTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>

        {/* Mobile cart drawer */}
        <div
          id="mobile-cart-drawer"
          className={`fixed inset-x-0 bottom-0 z-40 md:hidden transform transition-transform duration-300 ${
            mobileCartOpen ? "translate-y-0" : "translate-y-full"
          }`}
          role="dialog"
          aria-modal={mobileCartOpen}
          aria-hidden={!mobileCartOpen}
        >
          <div className="mx-4 mb-4 bg-gray-800/95 border border-gray-700 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold text-emerald-400">Cart</div>
              <button
                onClick={() => setMobileCartOpen(false)}
                aria-label="Close cart"
                className="text-gray-400 hover:text-gray-200"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-auto">
              {cart.length === 0 && <div className="text-gray-400">Cart is empty</div>}
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center bg-gray-900/40 border border-gray-700 rounded-lg p-2"
                >
                  <div>
                    <div className="text-gray-100">{item.name}</div>
                    <div className="text-xs text-gray-400">
                      ₹{item.price} × {item.qty}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                    aria-label={`Remove ${item.name}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-700 pt-3 text-sm mt-3">
              <div className="flex justify-between">
                <span>Subtotal:</span> ₹{total.toFixed(2)}
              </div>
              <div className="flex justify-between">
                <span>Tax (5%):</span> ₹{tax.toFixed(2)}
              </div>
              <div className="flex justify-between font-semibold text-emerald-400">
                <span>Total:</span> ₹{grandTotal.toFixed(2)}
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-semibold transition"
            >
              Generate Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
