// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/register/", formData);
      setSuccess("Registration successful! Redirecting to login...");
      toast.success("🎉 Account created successfully!", { theme: "light" });
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError("Failed to register. Please try again.");
      toast.error("❌ Registration failed. Please try again.", { theme: "light" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-gradient-to-br from-white to-blue-50 backdrop-blur-xl shadow-2xl shadow-indigo-500/20 rounded-2xl w-full max-w-sm sm:max-w-md p-6 sm:p-8 border border-blue-200 relative z-10"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-2xl text-white">🧾</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
            SuperBill Register
          </h1>
          <p className="text-gray-600 text-sm mt-3">
            Create your account and start managing your business
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                placeholder="First name"
                className="w-full px-4 py-3.5 rounded-xl bg-white text-gray-800 border border-blue-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all duration-300 placeholder-gray-500 shadow-sm"
                required
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                placeholder="Last name"
                className="w-full px-4 py-3.5 rounded-xl bg-white text-gray-800 border border-blue-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all duration-300 placeholder-gray-500 shadow-sm"
                required
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3.5 rounded-xl bg-white text-gray-800 border border-blue-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all duration-300 placeholder-gray-500 shadow-sm"
                required
                onChange={handleChange}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <CheckCircle2 className="text-blue-500" size={18} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create a password"
                className="w-full px-4 py-3.5 rounded-xl bg-white text-gray-800 border border-blue-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all duration-300 placeholder-gray-500 shadow-sm pr-12"
                required
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3"
            >
              <AlertCircle className="text-rose-500 flex-shrink-0" size={18} />
              <p className="text-rose-700 text-sm font-medium">
                {error}
              </p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3"
            >
              <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={18} />
              <p className="text-emerald-700 text-sm font-medium">
                {success}
              </p>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 font-bold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </motion.button>
        </form>

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors duration-200 underline underline-offset-2"
            >
              Sign in here
            </a>
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 pt-6 border-t border-blue-200/50">
          <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
            <div className="text-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                <span className="text-white text-xs">📊</span>
              </div>
              <p className="font-medium">Analytics</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                <span className="text-white text-xs">💰</span>
              </div>
              <p className="font-medium">Billing</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                <span className="text-white text-xs">📦</span>
              </div>
              <p className="font-medium">Inventory</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;