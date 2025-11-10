import React, { useState, useEffect } from "react";

import { motion } from "framer-motion";
import { PlusCircle, Edit2, Trash2, Users, Search, Eye } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api";

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
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contact_number?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen  text-gray-100 p-3 sm:p-4 md:p-6">
      <ToastContainer position="top-right" theme="dark" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8"
      >
        <div className="mb-4 sm:mb-0">
          <h1 className="text-xl sm:text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <Users className="h-5 w-5 sm:h-6 sm:w-6" /> Customer Management
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Manage customer profiles, loyalty, and analytics
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openAddModal}
          className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/20 text-sm sm:text-base"
        >
          <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5" /> Add Customer
        </motion.button>
      </motion.div>

      {/* Search */}
      <div className="relative mb-4 sm:mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 sm:pl-10 pr-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-200 placeholder-gray-400 text-sm sm:text-base"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase">
                  Name
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase">
                  Contact
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase">
                  Email
                </th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-emerald-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-400 text-sm">
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-400 text-sm">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium text-white">
                      {c.name}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-300">
                      {c.contact_number}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-300">
                      {c.email || "—"}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                      <button
                        onClick={() => handleView(c)}
                        className="text-cyan-400 hover:text-cyan-300 mr-2 sm:mr-3"
                      >
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button
                        onClick={() => openEditModal(c)}
                        className="text-emerald-400 hover:text-emerald-300 mr-2 sm:mr-3"
                      >
                        <Edit2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
            <h2 className="text-lg sm:text-xl font-bold text-emerald-400 mb-4">
              {editingCustomer ? "Edit Customer" : "Add New Customer"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              {Object.keys(formData).map((key) => (
                <div key={key}>
                  <label className="block text-sm text-gray-300 mb-1 capitalize">
                    {key.replace("_", " ")}
                  </label>
                  <input
                    type="text"
                    name={key}
                    value={formData[key] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder={`Enter ${key.replace("_", " ")}`}
                  />
                </div>
              ))}
              <div className="flex justify-end mt-4 gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 sm:px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm"
                >
                  {editingCustomer ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Details Drawer */}
      {detailsOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 70 }}
            className="bg-gray-800 border-l border-gray-700 w-full max-w-xs sm:max-w-md h-full p-4 sm:p-6 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-emerald-400">
                Customer Details
              </h2>
              <button
                onClick={() => setDetailsOpen(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-700/40 p-3 sm:p-4 rounded-lg mb-4">
              <h3 className="text-base sm:text-lg text-white font-semibold">
                {selectedCustomer.name}
              </h3>
              <p className="text-gray-400 text-sm sm:text-base">{selectedCustomer.email}</p>
              <p className="text-gray-400 text-sm sm:text-base">
                📞 {selectedCustomer.contact_number}
              </p>
              <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
                {selectedCustomer.address || "No address"}
              </p>
            </div>

            <div className="bg-gray-700/40 p-3 sm:p-4 rounded-lg mb-4">
              <p className="text-gray-400 text-sm">Tier</p>
              <p className="text-base sm:text-lg text-emerald-400 font-semibold">
                {customerLoyalty?.tier || "Bronze"}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Points: {customerLoyalty?.available_points || 0}
              </p>
            </div>

            <div className="bg-gray-700/40 p-3 sm:p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Total Spent</p>
              <p className="text-xl sm:text-2xl font-bold text-white">
                ₹{purchaseHistory?.total_spent || 0}
              </p>
              <p className="text-gray-400 text-sm">
                Total Bills: {purchaseHistory?.total_bills || 0}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Customers;
