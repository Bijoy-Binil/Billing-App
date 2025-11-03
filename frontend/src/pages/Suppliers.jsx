import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { PlusCircle, Edit2, Trash2, Users, Search, X } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    gst_number: "",
  });

  const userRole = localStorage.getItem("role");

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/suppliers/");
      const supplierList = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      setSuppliers(supplierList);
    } catch (error) {
      toast.error("Failed to fetch suppliers");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      gst_number: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      gst_number: supplier.gst_number,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await axios.put(
          `http://127.0.0.1:8000/api/suppliers/${editingSupplier.id}/`,
          formData
        );
        toast.success("Supplier updated successfully");
      } else {
        await axios.post("http://127.0.0.1:8000/api/suppliers/", formData);
        toast.success("Supplier added successfully");
      }
      setModalOpen(false);
      fetchSuppliers();
    } catch (error) {
      toast.error("Error saving supplier");
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/suppliers/${id}/`);
        toast.success("Supplier deleted successfully");
        fetchSuppliers();
      } catch (error) {
        toast.error("Failed to delete supplier");
        console.error(error);
      }
    }
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.gst_number?.toLowerCase().includes(searchTerm.toLowerCase())
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
              Supplier Management
            </h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">
              Manage your suppliers and vendor information
            </p>
          </div>
        </div>

        {/* ✅ Only Managers can Add Suppliers */}
        {userRole === "manager" && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openAddModal}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-emerald-900/20 text-sm sm:text-base font-medium"
          >
            <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            Add Supplier
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
          placeholder="Search suppliers by name, contact, email, or GST..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 bg-gray-800/60 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-200 placeholder-gray-400 text-sm sm:text-base transition-all duration-200"
        />
      </div>

      {/* Suppliers Table/Cards */}
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
                  Contact Person
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  GST Number
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
                  <td colSpan={userRole === "manager" ? 6 : 5} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                    </div>
                    <p className="text-gray-400 mt-2 text-sm">Loading suppliers...</p>
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={userRole === "manager" ? 6 : 5} className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-500 mb-3" />
                    <p className="text-gray-400 text-base">No suppliers found</p>
                    <p className="text-gray-500 text-sm mt-1">
                      {searchTerm ? "Try adjusting your search terms" : "Add your first supplier to get started"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="hover:bg-gray-700/30 transition-colors duration-200"
                  >
                    <td className="px-4 lg:px-6 py-4 text-sm font-medium text-white">
                      {supplier.name}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-300">
                      {supplier.contact_person}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-300">
                      {supplier.phone}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-300">
                      {supplier.email || "—"}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-300">
                      {supplier.gst_number || "—"}
                    </td>
                    {userRole === "manager" && (
                      <td className="px-4 lg:px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(supplier)}
                            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-all duration-200"
                            title="Edit Supplier"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                            title="Delete Supplier"
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
              <p className="text-gray-400 mt-2 text-sm">Loading suppliers...</p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-500 mb-3" />
              <p className="text-gray-400 text-base">No suppliers found</p>
              <p className="text-gray-500 text-sm mt-1">
                {searchTerm ? "Try adjusting your search terms" : "Add your first supplier to get started"}
              </p>
            </div>
          ) : (
            filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-base mb-1">{supplier.name}</h3>
                    <p className="text-gray-300 text-sm">👤 {supplier.contact_person}</p>
                    {supplier.phone && (
                      <p className="text-gray-300 text-sm mt-1">📞 {supplier.phone}</p>
                    )}
                  </div>
                  {userRole === "manager" && (
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => openEditModal(supplier)}
                        className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-all duration-200"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1 text-sm">
                  {supplier.email && (
                    <p className="text-gray-400">📧 {supplier.email}</p>
                  )}
                  {supplier.gst_number && (
                    <p className="text-gray-400">🏢 GST: {supplier.gst_number}</p>
                  )}
                  {supplier.address && (
                    <p className="text-gray-400 text-xs mt-2">📍 {supplier.address}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && userRole === "manager" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-emerald-400">
                {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
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
                    type="text"
                    name={key}
                    value={formData[key]}
                    onChange={handleChange}
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
                  {editingSupplier ? "Update Supplier" : "Add Supplier"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;