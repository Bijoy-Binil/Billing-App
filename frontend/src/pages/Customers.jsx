import React, { useState, useEffect } from "react";
import axios from "axios";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerLoyalty, setCustomerLoyalty] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    contact_number: "",
    email: "",
    address: "",
    date_of_birth: "",
  });

  const baseUrl = "http://127.0.0.1:8000/api/";
  const token = localStorage.getItem("accessToken");

  // 🔹 Fetch all customers
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}customers/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (error) {
      alert("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // 🔹 Fetch loyalty & purchase history
  const fetchCustomerSpentDetails = async (id) => {
    if (!id) return;
    setDetailsLoading(true);
    try {
      const [loyaltyRes, historyRes] = await Promise.all([
        axios.get(`${baseUrl}customer-loyalty/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${baseUrl}customer-analytics/${id}/purchase-history/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setCustomerLoyalty(loyaltyRes.data || {});
      setPurchaseHistory(historyRes.data || {});
    } catch (err) {
      alert("Failed to fetch customer details");
    } finally {
      setDetailsLoading(false);
    }
  };

  // 🔹 Handle Form Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔹 Add or Edit Customer
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomerId) {
        await axios.put(`${baseUrl}customer/${editingCustomerId}/`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Customer updated successfully");
      } else {
        await axios.post(`${baseUrl}customer/`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Customer added successfully");
      }
      setFormData({
        name: "",
        contact_number: "",
        email: "",
        address: "",
        date_of_birth: "",
      });
      setIsFormVisible(false);
      setEditingCustomerId(null);
      fetchCustomers();
    } catch {
      alert("Failed to save customer");
    }
  };

  // 🔹 Delete Customer
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await axios.delete(`${baseUrl}customer/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCustomers();
    } catch {
      alert("Failed to delete customer");
    }
  };

  // 🔹 View Details Drawer
  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setDetailsVisible(true);
    fetchCustomerSpentDetails(customer.id);
  };

  // 🔹 Filter Customers
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchText.toLowerCase()) ||
      c.contact_number.includes(searchText)
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-emerald-400">Customer Management</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search..."
            className="px-3 py-2 rounded bg-gray-800 border border-gray-700"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button
            onClick={() => {
              setIsFormVisible(true);
              setEditingCustomerId(null);
              setFormData({
                name: "",
                contact_number: "",
                email: "",
                address: "",
                date_of_birth: "",
              });
            }}
            className="bg-emerald-600 px-4 py-2 rounded hover:bg-emerald-500"
          >
            + Add Customer
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading customers...</p>
      ) : (
        <table className="min-w-full border border-gray-700 bg-gray-800 rounded-lg">
          <thead>
            <tr className="bg-gray-700">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Contact</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-700/60">
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2">{c.contact_number}</td>
                <td className="px-4 py-2">{c.email || "N/A"}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(c)}
                      className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-500"
                    >
                      View
                    </button>
                    <button
                      onClick={() => {
                        setEditingCustomerId(c.id);
                        setFormData(c);
                        setIsFormVisible(true);
                      }}
                      className="bg-yellow-600 px-3 py-1 rounded hover:bg-yellow-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="bg-red-600 px-3 py-1 rounded hover:bg-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-400">
                  No customers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* 🔹 Add/Edit Modal */}
      {isFormVisible && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h2 className="text-lg font-semibold mb-4">
              {editingCustomerId ? "Edit Customer" : "Add Customer"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600"
                required
              />
              <input
                name="contact_number"
                placeholder="Contact Number"
                value={formData.contact_number}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600"
                required
              />
              <input
                name="email"
                placeholder="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600"
              />
              <textarea
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600"
              />
              <input
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsFormVisible(false)}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 rounded hover:bg-emerald-500"
                >
                  {editingCustomerId ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔹 Customer Details Drawer */}
      {detailsVisible && selectedCustomer && (
        <div className="fixed inset-0 bg-black/70 flex justify-end z-50">
          <div className="w-96 bg-gray-800 p-6 overflow-y-auto">
            <button
              onClick={() => setDetailsVisible(false)}
              className="text-gray-400 hover:text-white mb-4"
            >
              ✕ Close
            </button>
            {detailsLoading ? (
              <p>Loading details...</p>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-2">
                  {selectedCustomer.name}
                </h2>
                <p>Contact: {selectedCustomer.contact_number}</p>
                <p>Email: {selectedCustomer.email || "N/A"}</p>
                <p>Address: {selectedCustomer.address || "N/A"}</p>
                <p>DOB: {selectedCustomer.date_of_birth || "N/A"}</p>
                <hr className="my-4 border-gray-700" />
                <h3 className="text-lg font-semibold">Loyalty</h3>
                <p>Tier: {customerLoyalty?.tier || "Bronze"}</p>
                <p>Available Points: {customerLoyalty?.available_points || 0}</p>
                <p>Lifetime Points: {customerLoyalty?.lifetime_points || 0}</p>
                <hr className="my-4 border-gray-700" />
                <h3 className="text-lg font-semibold">Purchase History</h3>
                <p>Total Spent: ₹{purchaseHistory?.total_spent || 0}</p>
                <p>Total Bills: {purchaseHistory?.total_bills || 0}</p>
                <p>
                  Avg Bill Value: ₹
                  {purchaseHistory?.average_bill_value?.toFixed(2) || 0}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
