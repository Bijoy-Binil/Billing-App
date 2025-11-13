// src/pages/Customers.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Edit2, Trash2, Users, Search, Eye } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api";
import SectionLoader from "../components/SectionLoader";

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
  const userRole = localStorage.getItem("role"); // "manager" or "cashier"

  const [formData, setFormData] = useState({
    name: "",
    contact_number: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);
const fetchCustomers = async () => {
  setLoading(true);
  try {
    const res = await api.get(`/customers/`);
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
        api.get(`/customer-loyalty/${id}/`),
        api.get(`/customer-analytics/${id}/purchase-history/`),
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
    });
    setModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || "",
      contact_number: customer.contact_number || "",
      email: customer.email || "",
      address: customer.address || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customer/${editingCustomer.id}/`, formData);
        toast.success("Customer updated successfully");
      } else {
        await api.post(`/customers/`, formData);
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
        await api.delete(`/customer/${id}/`, {
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
    (c) => c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.contact_number?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800 p-3 sm:p-4 md:p-6">
      <ToastContainer position="top-right" theme="light" autoClose={3000} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8"
      >
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <div className="p-3 bg-gradient-to-r from-emerald-400 to-green-400 rounded-2xl shadow-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage customer profiles, loyalty, and analytics</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          onClick={openAddModal}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg font-semibold"
        >
          <PlusCircle className="h-5 w-5" />
          Add Customer
        </motion.button>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 sm:mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search customers by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 sm:pl-12 pr-4 py-3 bg-white border border-blue-300 rounded-2xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-gray-800 placeholder-gray-400 text-sm sm:text-base shadow-sm transition-all"
        />
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-white to-blue-50 rounded-2xl border border-blue-200 shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-blue-100 text-sm">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left font-bold text-gray-700 uppercase text-xs tracking-wide">
                  Name
                </th>
                <th className="px-4 sm:px-6 py-4 text-left font-bold text-gray-700 uppercase text-xs tracking-wide">
                  Contact
                </th>
                <th className="px-4 sm:px-6 py-4 text-left font-bold text-gray-700 uppercase text-xs tracking-wide">
                  Email
                </th>
                <th className="px-4 sm:px-6 py-4 text-right font-bold text-gray-700 uppercase text-xs tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {loading ? (
                <tr>
                  <td colSpan="4">
                    <SectionLoader />
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-gray-500 text-lg font-medium">No customers found</p>
                      <p className="text-gray-400 text-sm mt-1">Add customers to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-blue-50 transition-colors duration-200">
                    <td className="px-4 sm:px-6 py-4 font-semibold text-gray-900">{c.name}</td>
                    <td className="px-4 sm:px-6 py-4 text-gray-700">{c.contact_number}</td>
                    <td className="px-4 sm:px-6 py-4 text-gray-700">
                      {c.email || <span className="text-gray-400 italic">—</span>}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(c)}
                          className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all shadow-sm"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-2 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl transition-all shadow-sm"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl transition-all shadow-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl shadow-sm">
                {editingCustomer ? <Edit2 className="h-5 w-5 text-white" /> : <PlusCircle className="h-5 w-5 text-white" />}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{editingCustomer ? "Edit Customer" : "Add New Customer"}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {Object.keys(formData).map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">{key.replace("_", " ")}</label>
                  <input
                    type="text"
                    name={key}
                    value={formData[key] || ""}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm shadow-sm transition-all"
                    placeholder={`Enter ${key.replace("_", " ")}`}
                  />
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl text-sm font-medium border border-gray-300 shadow-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl text-sm font-semibold shadow-lg transition-all"
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
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 70, damping: 18 }}
            className="bg-gradient-to-b from-white to-blue-50 border-l border-blue-200 w-full max-w-xs sm:max-w-md h-full p-6 overflow-y-auto shadow-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Customer Details</h2>
              <button
                onClick={() => setDetailsOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            {/* Profile Card */}
            <div className="bg-gradient-to-r from-white to-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl flex items-center justify-center shadow-sm">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedCustomer.name}</h3>
                  <p className="text-gray-600 text-sm">{selectedCustomer.email || "No email provided"}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700 flex items-center gap-2">
                  <span className="text-lg">📞</span>
                  {selectedCustomer.contact_number}
                </p>
                <p className="text-gray-700 flex items-start gap-2">
                  <span className="text-lg">🏠</span>
                  <span>{selectedCustomer.address || "No address provided"}</span>
                </p>
              </div>
            </div>

            {/* Loyalty Card */}
            <div className="bg-gradient-to-r from-amber-400 to-orange-400 border border-amber-300 rounded-2xl p-5 mb-5 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-800 text-sm font-medium">Loyalty Tier</p>
                  <p className="text-xl font-bold text-amber-900">{customerLoyalty?.tier || "Bronze"}</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-800 text-sm font-medium">Points</p>
                  <p className="text-xl font-bold text-amber-900">{customerLoyalty?.available_points || 0}</p>
                </div>
              </div>
            </div>

            {/* Spend Card */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 border border-blue-400 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Spent</p>
                  <p className="text-2xl font-bold text-white">₹{purchaseHistory?.total_spent || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Total Bills</p>
                  <p className="text-2xl font-bold text-white">{purchaseHistory?.total_bills || 0}</p>
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
