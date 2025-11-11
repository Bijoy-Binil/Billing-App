// src/pages/LoginPage.jsx
import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, AlertCircle, CheckCircle2 } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/token/", {
        email,
        password,
      });

      localStorage.setItem("accessToken", res.data.access);
      localStorage.setItem("refreshToken", res.data.refresh);

      const loginRes = await api.post("/login/", {
        email,
        password,
      });

      localStorage.setItem("userId", loginRes.data.userId);
      localStorage.setItem("role", loginRes.data.role);
      localStorage.setItem("username", loginRes.data.username);
      localStorage.setItem("userEmail", loginRes.data.email);
      localStorage.setItem("userJoined", loginRes.data.joined);
      localStorage.setItem("isLoggedIn", loginRes.data.user_login);

      toast.success("🎉 Login successful! Redirecting...", { theme: "light" });
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Invalid credentials. Please try again!");
      toast.error("❌ Login failed. Please check your credentials.", { theme: "light" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-gradient-to-br from-white to-blue-50 backdrop-blur-xl shadow-2xl shadow-blue-500/20 rounded-2xl w-full max-w-sm sm:max-w-md p-6 sm:p-8 border border-blue-200 relative z-10"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-2xl text-white">🧾</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
            SuperBill Login
          </h1>
          <p className="text-gray-600 text-sm mt-3">
            Access your dashboard and manage your business
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3.5 rounded-xl bg-white text-gray-800 border border-blue-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all duration-300 placeholder-gray-500 shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                placeholder="Enter your password"
                className="w-full px-4 py-3.5 rounded-xl bg-white text-gray-800 border border-blue-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all duration-300 placeholder-gray-500 shadow-sm pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 font-bold rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Signing In...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Sign In to Dashboard
              </>
            )}
          </motion.button>
        </form>

        {/* Register Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 underline underline-offset-2"
            >
              Create one here
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

export default LoginPage;