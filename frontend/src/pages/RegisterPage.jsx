import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
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
      setSuccess("✅ Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError("❌ Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 lg:p-6 bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-gray-900/80 backdrop-blur-xl shadow-2xl shadow-emerald-500/10 rounded-2xl w-full max-w-sm sm:max-w-md p-6 sm:p-8 border border-gray-800/50 relative z-10"
      >
        {/* Logo/Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-r from-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🧾</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold bg-linear-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
            SuperBill Register
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            Create your account and start managing your business
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Name Fields - Stack on mobile, side by side on larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                placeholder="First name"
                className="w-full px-4 py-3 rounded-lg bg-gray-800/60 text-gray-100 border border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-300 placeholder-gray-500 text-sm sm:text-base"
                required
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                placeholder="Last name"
                className="w-full px-4 py-3 rounded-lg bg-gray-800/60 text-gray-100 border border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-300 placeholder-gray-500 text-sm sm:text-base"
                required
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-lg bg-gray-800/60 text-gray-100 border border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-300 placeholder-gray-500 text-sm sm:text-base"
              required
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Create a password"
              className="w-full px-4 py-3 rounded-lg bg-gray-800/60 text-gray-100 border border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-300 placeholder-gray-500 text-sm sm:text-base"
              required
              onChange={handleChange}
            />
          </div>

          {/* Status Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
            >
              <p className="text-red-400 text-sm text-center font-medium">
                ⚠️ {error}
              </p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3"
            >
              <p className="text-emerald-400 text-sm text-center font-medium">
                ✅ {success}
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
            className="w-full py-3 sm:py-4 font-semibold rounded-lg bg-linear-to-r from-emerald-500 to-cyan-400 hover:from-cyan-400 hover:to-emerald-500 text-gray-900 shadow-lg shadow-emerald-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </motion.button>
        </form>

        {/* Login Link */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-200 underline underline-offset-2"
            >
              Sign in here
            </a>
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-800/50">
          <div className="grid grid-cols-3 gap-3 text-xs text-gray-500">
            <div className="text-center">
              <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center mx-auto mb-1">
                <span className="text-emerald-400">📊</span>
              </div>
              <p>Analytics</p>
            </div>
            <div className="text-center">
              <div className="w-6 h-6 bg-cyan-500/20 rounded-lg flex items-center justify-center mx-auto mb-1">
                <span className="text-cyan-400">💰</span>
              </div>
              <p>Billing</p>
            </div>
            <div className="text-center">
              <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center mx-auto mb-1">
                <span className="text-emerald-400">📦</span>
              </div>
              <p>Inventory</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Optimized Background */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-linear-to-t from-gray-900 to-transparent pointer-events-none sm:hidden"></div>
    </div>
  );
};

export default RegisterPage;