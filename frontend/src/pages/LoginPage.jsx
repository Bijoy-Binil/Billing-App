import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import api from "../api";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

      window.location.href = "/";
    } catch (err) {
      console.error(err);
      setError("Invalid credentials. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 lg:p-6 bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gray-900/80 backdrop-blur-xl shadow-2xl shadow-emerald-500/10 rounded-2xl w-full max-w-sm sm:max-w-md p-6 sm:p-8 border border-gray-800/50 relative z-10"
      >
        {/* Logo/Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-r from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🧾</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent tracking-tight">
            SuperBill Login
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            Access your dashboard and manage your business
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-lg bg-gray-800/60 text-gray-100 border border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-300 placeholder-gray-500 text-sm sm:text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-lg bg-gray-800/60 text-gray-100 border border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-300 placeholder-gray-500 text-sm sm:text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

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

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 sm:py-4 font-semibold rounded-lg bg-linear-to-r from-emerald-500 to-teal-400 hover:from-teal-400 hover:to-emerald-500 text-gray-900 shadow-lg shadow-emerald-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                Signing In...
              </>
            ) : (
              "Sign In to Dashboard"
            )}
          </motion.button>
        </form>

        {/* Register Link */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors duration-200 underline underline-offset-2"
            >
              Create one here
            </a>
          </p>
        </div>

        {/* Additional Info */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-800/50">
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div className="text-center">
              <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center mx-auto mb-1">
                <span className="text-emerald-400">📊</span>
              </div>
              <p>Analytics</p>
            </div>
            <div className="text-center">
              <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center mx-auto mb-1">
                <span className="text-emerald-400">💰</span>
              </div>
              <p>Billing</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Optimized Background */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-linear-to-t from-gray-900 to-transparent pointer-events-none sm:hidden"></div>
    </div>
  );
};

export default LoginPage;