import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Edit2, Trash2, Users, Search } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api";

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
  const token = localStorage.getItem("accessToken");

  // Fetch all suppliers
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/suppliers/");
      const supplierList = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      setSuppliers(supplierList);
    } catch (error) {
      toast.error("Failed to fetch suppliers");
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

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
    setFormData({ ...supplier });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}/`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Supplier updated successfully");
      } else {
        await api.post("/suppliers/", formData);
        toast.success("Supplier added successfully");
      }
      setModalOpen(false);
      fetchSuppliers();
    } catch (error) {
      toast.error("Error saving supplier");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this supplier?")) return;
    try {
      await api.delete(`/suppliers/${id}/`);
      toast.success("Supplier deleted");
      fetchSuppliers();
    } catch {
      toast.error("Failed to delete supplier");
    }
  };

  const filteredSuppliers = suppliers.filter((s) =>
    `${s.name} ${s.contact_person} ${s.email} ${s.gst_number}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800 p-4 sm:p-6">
      <ToastContainer position="top-right" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8"
      >
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <div className="p-3 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Supplier Management
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Manage supplier details & vendor information
            </p>
          </div>
        </div>

        {userRole === "manager" && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openAddModal}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl shadow-lg flex items-center justify-center gap-2 font-semibold transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            Add Supplier
          </motion.button>
        )}
      </motion.div>

      {/* Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-6 sm:mb-8"
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-gray-400 w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Search suppliers by name, contact, email, or GST..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 sm:pl-12 pr-4 py-3 bg-white border border-blue-300 rounded-2xl text-gray-700 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 shadow-sm transition-all placeholder-gray-400"
        />
      </motion.div>

      {/* Table */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-2xl shadow-lg overflow-hidden"
>
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-blue-100">
      <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <tr>
          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Name</th>
          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Contact</th>
          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Phone</th>
          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Email</th>
          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">GST</th>
          {userRole === "manager" && (
            <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">
              Actions
            </th>
          )}
        </tr>
      </thead>

      <tbody className="divide-y divide-blue-100">
        {loading ? (
          <tr>
            <td colSpan={userRole === "manager" ? "6" : "5"} className="text-center py-8">
              <div className="flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2"></div>
                <p className="text-gray-500 text-sm">Loading suppliers...</p>
              </div>
            </td>
          </tr>
        ) : filteredSuppliers.length === 0 ? (
          <tr>
            <td colSpan={userRole === "manager" ? "6" : "5"} className="text-center py-12">
              <div className="flex flex-col items-center justify-center">
                <Users className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-500 text-lg font-medium">No suppliers found</p>
                <p className="text-gray-400 text-sm mt-1">Add suppliers to get started</p>
              </div>
            </td>
          </tr>
        ) : (
          filteredSuppliers.map((supplier) => (
            <tr
              key={supplier.id}
              className="hover:bg-blue-50 transition-colors duration-200"
            >
              <td className="px-4 sm:px-6 py-4 font-semibold text-gray-900">
                {supplier.name}
              </td>
              <td className="px-4 sm:px-6 py-4 text-gray-700">
                {supplier.contact_person}
              </td>
              <td className="px-4 sm:px-6 py-4 text-gray-700">
                {supplier.phone}
              </td>
              <td className="px-4 sm:px-6 py-4 text-gray-700">
                {supplier.email || (
                  <span className="text-gray-400 italic">—</span>
                )}
              </td>
              <td className="px-4 sm:px-6 py-4">
                <span className="bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-200">
                  {supplier.gst_number || "—"}
                </span>
              </td>

              {userRole === "manager" && (
                <td className="px-4 sm:px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(supplier)}
                      className="p-2 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl transition-all shadow-sm"
                      title="Edit supplier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
                      className="p-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl transition-all shadow-sm"
                      title="Delete supplier"
                    >
                      <Trash2 className="w-4 h-4" />
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
</motion.div>


      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-white to-blue-50 w-full max-w-md rounded-2xl shadow-xl border border-blue-200 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl shadow-sm">
                {editingSupplier ? (
                  <Edit2 className="w-5 h-5 text-white" />
                ) : (
                  <PlusCircle className="w-5 h-5 text-white" />
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {Object.keys(formData).map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {key.replace("_", " ")}
                  </label>
                  <input
                    type="text"
                    name={key}
                    value={formData[key]}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 shadow-sm transition-all placeholder-gray-400"
                    placeholder={`Enter ${key.replace("_", " ")}`}
                  />
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl font-medium border border-gray-300 shadow-sm transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl font-semibold shadow-lg transition-all"
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