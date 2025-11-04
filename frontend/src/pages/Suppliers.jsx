import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { PlusCircle, Edit2, Trash2, Users, Search } from "lucide-react";
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

  const userRole = localStorage.getItem("role"); // ✅ get user role

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/suppliers/", {
        headers: { Authorization: `Bearer ${token}` },
      });
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
  const token = localStorage.getItem("accessToken");
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await axios.put(
          `http://127.0.0.1:8000/api/suppliers/${editingSupplier.id}/`,
          formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
        
        toast.success("Supplier updated successfully");
      } else {
        await axios.post("http://127.0.0.1:8000/api/suppliers/", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
        await axios.delete(`http://127.0.0.1:8000/api/suppliers/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <ToastContainer position="top-right" theme="dark" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3 sm:gap-0"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            Supplier Management
          </h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">Manage your suppliers and vendor information</p>
        </div>

        {/* ✅ Only Managers can Add Suppliers */}
        {userRole === "manager" && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openAddModal}
            className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-emerald-900/20 text-sm sm:text-base"
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
          placeholder="Search suppliers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-200 placeholder-gray-400 text-sm sm:text-base"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-800/60 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-emerald-400 uppercase">Name</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-emerald-400 uppercase">Contact</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-emerald-400 uppercase">Phone</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-emerald-400 uppercase">Email</th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-emerald-400 uppercase">GST</th>
                {userRole === "manager" && (
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-emerald-400 uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-3 sm:py-4 text-gray-400 text-sm">
                    Loading suppliers...
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-3 sm:py-4 text-gray-400 text-sm">
                    No suppliers found
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-white">{supplier.name}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300">{supplier.contact_person}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300">{supplier.phone}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300">{supplier.email}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-300">{supplier.gst_number}</td>
                    {userRole === "manager" && (
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                        <button
                          onClick={() => openEditModal(supplier)}
                          className="text-emerald-400 hover:text-emerald-300 mr-2 sm:mr-3"
                        >
                          <Edit2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && userRole === "manager" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md"
          >
            <h2 className="text-lg sm:text-xl font-bold text-emerald-400 mb-3 sm:mb-4">
              {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
            </h2>

            <form onSubmit={handleSubmit}>
              {Object.keys(formData).map((key) => (
                <div key={key} className="mb-2 sm:mb-3">
                  <label className="block text-xs sm:text-sm text-gray-300 mb-1 capitalize">
                    {key.replace("_", " ")}
                  </label>
                  <input
                    type="text"
                    name={key}
                    value={formData[key]}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              ))}

              <div className="flex justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm"
                >
                  {editingSupplier ? "Update" : "Add"} Supplier
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