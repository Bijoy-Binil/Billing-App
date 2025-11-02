import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Users, PlusCircle, Edit2, Trash2, Search, Eye } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
console.log("purchaseHistory==>",purchaseHistory)
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
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();

  }, []);

useEffect(() => {
  if (selectedCustomer?.id) {
    fetchCustomerSpentDetails(selectedCustomer.id); // ✅ only fetch when a customer is selected
  }
}, [selectedCustomer]);
  // 🔹 Fetch loyalty & purchase history
  const fetchCustomerSpentDetails = async (id) => {
    if (!id) return;

    try {
      const [loyaltyRes, historyRes] = await Promise.all([
        axios.get(`${baseUrl}customer-loyalty/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${baseUrl}customer-analytics/${id}/purchase-history/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      console.log("loyalty==>", loyaltyRes.data);
      console.log("historyRes==>", historyRes.data);
      setLoyaltyData(loyaltyRes.data || {});
      setPurchaseHistory(historyRes.data || {});
    } catch (err) {
      alert("Failed to fetch customer details");
    } finally {
    }
  };

  // 🔹 Open Add Modal (for future)
  const openAddModal = () => {
    toast.info("Add Customer form coming soon!");
  };

  // 🔹 Open Edit Modal (for future)
  const openEditModal = (customer) => {
    toast.info(`Edit form for ${customer.name} coming soon!`);
  };

  // 🔹 Open Customer Details Drawer
  const openDetails = (customer) => {
    setSelectedCustomer(customer);
    setDetailsOpen(true);
    fetchCustomerSpentDetails(customer.id);
  };

  // 🔹 Delete Customer
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await axios.delete(`${baseUrl}customer/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Customer deleted successfully");
      fetchCustomers();
    } catch {
      toast.error("Failed to delete customer");
    }
  };

  // 🔹 Filter customers by name/contact
  const filteredCustomers = customers.filter(
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.contact_number.includes(searchTerm)
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" theme="dark" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Customer Management
          </h1>
          <p className="text-gray-400 mt-1">Manage your customer records and details</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openAddModal}
          className="mt-4 md:mt-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-emerald-900/20"
        >
          <PlusCircle className="h-5 w-5" />
          Add Customer
        </motion.button>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-200 placeholder-gray-400"
        />
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-400">
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-400">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 text-white">{c.name}</td>
                    <td className="px-6 py-4 text-gray-300">{c.contact_number}</td>
                    <td className="px-6 py-4 text-gray-300">{c.email}</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button onClick={() => openDetails(c)} className="text-blue-400 hover:text-blue-300">
                        <Eye className="h-5 w-5 inline" />
                      </button>
                      <button onClick={() => openEditModal(c)} className="text-yellow-400 hover:text-yellow-300">
                        <Edit2 className="h-5 w-5 inline" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Details Drawer */}
      {detailsOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-800 p-6 border-l border-gray-700 overflow-y-auto">
            <button onClick={() => setDetailsOpen(false)} className="text-gray-400 hover:text-white mb-4">
              ✕ Close
            </button>

            <h2 className="text-xl font-bold text-emerald-400 mb-3">{selectedCustomer.name}</h2>
            <p>📞 {selectedCustomer.contact_number}</p>
            <p>📧 {selectedCustomer.email || "N/A"}</p>
            <p>🏠 {selectedCustomer.address || "N/A"}</p>
            <p>🎂 {selectedCustomer.date_of_birth || "N/A"}</p>

            {/* Loyalty Info */}
            {loyaltyData && (
              <div className="mt-6 p-4 bg-gray-900/40 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-emerald-400 mb-2">Loyalty Info</h3>
                <p>
                  🏆 Points: <span className="text-white">{loyaltyData.available_points ?? 0}</span>
                </p>
                <p>
                  🎁 Tier: <span className="text-white">{loyaltyData.tier ?? "N/A"}</span>
                </p>
                <p>
                  💫 Lifetime Points: <span className="text-white">{loyaltyData.lifetime_points ?? 0}</span>
                </p>
                <p>
                  ⏰ Last Updated:{" "}
                  <span className="text-white">
                    {loyaltyData.updated_at ? new Date(loyaltyData.updated_at).toLocaleString() : "N/A"}
                  </span>
                </p>
              </div>
            )}

            {/* Purchase History Summary */}
            {purchaseHistory && (
              <div className="mt-6 p-4 bg-gray-900/40 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-emerald-400 mb-2">Purchase History</h3>
                <p>
                  💰 Total Spent: <span className="text-white">₹{purchaseHistory.total_spent ?? 0}</span>
                </p>
                <p>
                  🧾 Total Bills: <span className="text-white">{purchaseHistory.total_bills ?? 0}</span>
                </p>
                <p>
                  📊 Avg Bill Value:{" "}
                  <span className="text-white">
                    ₹{purchaseHistory.average_bill_value ? purchaseHistory.average_bill_value.toFixed(2) : 0}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
