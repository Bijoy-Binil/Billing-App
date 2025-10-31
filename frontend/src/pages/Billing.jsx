import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

const Billing = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: "", contact_number: "" });
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ Use same key that your login API stores, usually "access" or "access_token"
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token");

  // ✅ Axios instance with token preconfigured
  const axiosAuth = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  // --- Load all products initially ---
  useEffect(() => {
    if (!token) {
      console.warn("⚠️ No token found in localStorage");
      return;
    }

    axiosAuth
      .get("products/")
      .then((res) => setProducts(res.data.results))
      .catch((err) => console.error("Error loading products:", err));
  }, [token]);

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

  // --- Totals ---
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  );
  const tax = useMemo(() => subtotal * 0.05, [subtotal]);
  const discount = useMemo(() => subtotal * 0.1, [subtotal]);
  const total = useMemo(
    () => subtotal + tax - discount,
    [subtotal, tax, discount]
  );

  // --- Search customer by contact number ---
  const handleSearchCustomer = async () => {
    if (!customer.contact_number.trim()) return;
    setLoadingCustomer(true);
    setMessage("");

    try {
      const res = await axiosAuth.get("customers/");
      const found = res.data.results.find(
        (c) => c.contact_number === customer.contact_number
      );

      if (found) {
        setFoundCustomer(found);
        setCustomer({ name: found.name, contact_number: found.contact_number });
        setMessage(`Customer found: ${found.name}`);
      } else {
        setFoundCustomer(null);
        setMessage("New customer — please enter name to add.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error searching customer");
    } finally {
      setLoadingCustomer(false);
    }
  };

  // --- Save bill ---
  const handleGenerateBill = async () => {
    if (!cart.length) {
      alert("Cart is empty!");
      return;
    }

    try {
      let customerId = foundCustomer?.id;

      // If new customer -> create
      if (!customerId) {
        const newCust = await axiosAuth.post("customers/", customer);
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
          qty: item.qty,
          price: item.price,
        })),
      };

      const billRes = await axiosAuth.post("billings/", payload);

      alert(`✅ Bill generated successfully: ${billRes.data.bill_id}`);
      setCart([]);
      setCustomer({ name: "", contact_number: "" });
      setFoundCustomer(null);
      setMessage("");
    } catch (err) {
      console.error(err.response?.data || err);
      alert("❌ Error generating bill");
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
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded"
          >
            {loadingCustomer ? "Searching..." : "Search"}
          </button>
          {message && <p className="text-sm text-green-400">{message}</p>}
        </div>

        {!foundCustomer && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="Customer Name"
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
            Found: <strong>{foundCustomer.name}</strong>
          </p>
        )}
      </div>

      {/* Product List */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {products.map((product) => (
          <div
            key={product.id}
            className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer"
            onClick={() => addToCart(product)}
          >
            <h3 className="text-lg font-medium">{product.name}</h3>
            <p className="text-gray-400">₹{product.price}</p>
          </div>
        ))}
      </div>

      {/* Cart Section */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-xl font-medium mb-3">Cart</h2>
        {cart.length === 0 ? (
             <>
            <table className="w-full text-left mb-4">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="py-2">Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.qty}</td>
                    <td>₹{item.price}</td>
                    <td>₹{item.qty * item.price}</td>
                    <td>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div className="text-right space-y-1">
              <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
              <p>Tax (5%): ₹{tax.toFixed(2)}</p>
              <p>Discount (10%): ₹{discount.toFixed(2)}</p>
              <p className="font-semibold text-lg">
                Total: ₹{total.toFixed(2)}
              </p>
              <button
                onClick={handleGenerateBill}
                className="bg-green-600 hover:bg-green-700 mt-4 px-6 py-2 rounded"
              >
                Generate Bill
              </button>
            </div>
          </>
        ) : (
          <>
            <table className="w-full text-left mb-4">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="py-2">Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.qty}</td>
                    <td>₹{item.price}</td>
                    <td>₹{item.qty * item.price}</td>
                    <td>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div className="text-right space-y-1">
              <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
              <p>Tax (5%): ₹{tax.toFixed(2)}</p>
              <p>Discount (10%): ₹{discount.toFixed(2)}</p>
              <p className="font-semibold text-lg">
                Total: ₹{total.toFixed(2)}
              </p>
              <button
                onClick={handleGenerateBill}
                className="bg-green-600 hover:bg-green-700 mt-4 px-6 py-2 rounded"
              >
                Generate Bill
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Billing;
