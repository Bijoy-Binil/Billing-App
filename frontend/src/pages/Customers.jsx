import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { PlusCircle, Edit2, Trash2, Users, Search, Eye, X } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerLoyalty, setCustomerLoyalty] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const token = localStorage.getItem("accessToken");
  const userRole = localStorage.getItem("role");

  const [formData, setFormData] = useState({
    name: "",
    contact_number: "",
    email: "",
    address: "",
    date_of_birth: "",
  });

  const baseUrl = "http://127.0.0.1:8000/api/";

  useEffect(() => {
    fetchCustomers();
  }, []);

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

  const fetchCustomerDetails = async (id) => {
    try {
      const [loyaltyRes, historyRes] = await Promise.all([
        axios.get(`${baseUrl}customer-loyalty/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${baseUrl}customer-analytics/${id}/purchase-history/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setCustomerLoyalty(loyaltyRes.data);
      setPurchaseHistory(historyRes.data);
    } catch {
      toast.error("Failed to fetch customer details");
    }
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: "",
      contact_number: "",
      email: "",
      address: "",
      date_of_birth: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await axios.put(`${baseUrl}customer/${editingCustomer.id}/`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Customer updated successfully");
      } else {
        await axios.post(`${baseUrl}customer/`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Customer added successfully");
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error("Failed to save customer");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this customer?")) {
      try {
        await axios.delete(`${baseUrl}customer/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Customer deleted");
        fetchCustomers();
      } catch {
        toast.error("Failed to delete customer");
      }
    }
  };

  const handleView = async (customer) => {
    setSelectedCustomer(customer);
    setDetailsOpen(true);
    await fetchCustomerDetails(customer.id);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contact_number?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-3 sm:p-4 lg:p-6">
      <ToastContainer position="top-right" theme="dark" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 lg:mb-8 gap-3 sm:gap-4"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400">
              Customer Management
            </h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">
              Manage customer profiles, loyalty, and analytics
            </p>
          </div>
        </div>

        {userRole === "manager" && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openAddModal}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-emerald-900/20 text-sm sm:text-base font-medium"
          >
            <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            Add Customer
          </motion.button>
        )}
      </motion.div>

      {/* Search */}
      <div className="relative mb-4 sm:mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search customers by name or contact..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 bg-gray-800/60 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-200 placeholder-gray-400 text-sm sm:text-base transition-all duration-200"
        />
      </div>

      {/* Customers Table/Cards */}
      <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700/50">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Address
                </th>
                {userRole === "manager" && (
                  <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-emerald-400 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {loading ? (
                <tr>
                  <td colSpan={userRole === "manager" ? 5 : 4} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                    </div>
                    <p className="text-gray-400 mt-2 text-sm">Loading customers...</p>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={userRole === "manager" ? 5 : 4} className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-500 mb-3" />
                    <p className="text-gray-400 text-base">No customers found</p>
                    <p className="text-gray-500 text-sm mt-1">
                      {searchTerm ? "Try adjusting your search terms" : "Add your first customer to get started"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-700/30 transition-colors duration-200"
                  >
                    <td className="px-4 lg:px-6 py-4 text-sm font-medium text-white">
                      {c.name}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-300">
                      {c.contact_number}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-300">
                      {c.email || "—"}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-300">
                      {c.address ? (
                        <span className="max-w-xs truncate block">{c.address}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    {userRole === "manager" && (
                      <td className="px-4 lg:px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleView(c)}
                            className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-all duration-200"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-all duration-200"
                            title="Edit Customer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                            title="Delete Customer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3 p-3 sm:p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto"></div>
              <p className="text-gray-400 mt-2 text-sm">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-500 mb-3" />
              <p className="text-gray-400 text-base">No customers found</p>
              <p className="text-gray-500 text-sm mt-1">
                {searchTerm ? "Try adjusting your search terms" : "Add your first customer to get started"}
              </p>
            </div>
          ) : (
            filteredCustomers.map((c) => (
              <div
                key={c.id}
                className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-base mb-1">{c.name}</h3>
                    <p className="text-gray-300 text-sm">📞 {c.contact_number}</p>
                    {c.email && (
                      <p className="text-gray-400 text-sm mt-1">📧 {c.email}</p>
                    )}
                  </div>
                  {userRole === "manager" && (
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => handleView(c)}
                        className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-all duration-200"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-all duration-200"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                {c.address && (
                  <p className="text-gray-400 text-sm mt-2">
                    📍 {c.address}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-emerald-400">
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {Object.keys(formData).map((key) => (
                <div key={key}>
                  <label className="block text-sm text-gray-300 mb-2 capitalize font-medium">
                    {key.replace("_", " ")}
                  </label>
                  <input
                    type={key === "date_of_birth" ? "date" : "text"}
                    name={key}
                    value={formData[key] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all duration-200"
                    placeholder={`Enter ${key.replace("_", " ")}`}
                  />
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all duration-200"
                >
                  {editingCustomer ? "Update Customer" : "Create Customer"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Details Drawer */}
      {detailsOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div 
            className="fixed inset-0"
            onClick={() => setDetailsOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            className="bg-gray-800 border-l border-gray-700 w-full max-w-xs sm:max-w-md lg:max-w-lg h-full p-4 sm:p-6 overflow-y-auto relative z-10"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-emerald-400">
                Customer Details
              </h2>
              <button
                onClick={() => setDetailsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-700/40 p-4 rounded-lg mb-4">
              <h3 className="text-base sm:text-lg text-white font-semibold mb-2">
                {selectedCustomer.name}
              </h3>
              <div className="space-y-2 text-sm sm:text-base">
                <p className="text-gray-300 flex items-center gap-2">
                  <span>📧</span>
                  {selectedCustomer.email || "No email"}
                </p>
                <p className="text-gray-300 flex items-center gap-2">
                  <span>📞</span>
                  {selectedCustomer.contact_number}
                </p>
                {selectedCustomer.address && (
                  <p className="text-gray-300 flex items-center gap-2">
                    <span>📍</span>
                    {selectedCustomer.address}
                  </p>
                )}
                {selectedCustomer.date_of_birth && (
                  <p className="text-gray-300 flex items-center gap-2">
                    <span>🎂</span>
                    {new Date(selectedCustomer.date_of_birth).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Loyalty Info */}
            <div className="bg-gray-700/40 p-4 rounded-lg mb-4">
              <h4 className="text-gray-400 text-sm font-medium mb-2">Loyalty Status</h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg sm:text-xl text-emerald-400 font-semibold">
                    {customerLoyalty?.tier || "Bronze"}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {customerLoyalty?.available_points || 0} points
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Tier Level</p>
                  <div className="w-3 h-3 bg-emerald-400 rounded-full mt-1"></div>
                </div>
              </div>
            </div>

            {/* Purchase History */}
            <div className="bg-gray-700/40 p-4 rounded-lg">
              <h4 className="text-gray-400 text-sm font-medium mb-2">Purchase Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Total Spent</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    ₹{purchaseHistory?.total_spent || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Bills</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {purchaseHistory?.total_bills || 0}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Customers;