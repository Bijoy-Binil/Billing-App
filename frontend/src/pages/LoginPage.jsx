import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/token/", {
        email,
        password,
      });

      localStorage.setItem("accessToken", res.data.access);
      localStorage.setItem("refreshToken", res.data.refresh);

      const loginRes = await axios.post("http://127.0.0.1:8000/api/login/", {
        email,
        password,
      });

      localStorage.setItem("userId", loginRes.data.userId);
      localStorage.setItem("username", loginRes.data.username);
      localStorage.setItem("userEmail", loginRes.data.email);
      localStorage.setItem("userJoined", loginRes.data.joined);
      localStorage.setItem("isLoggedIn", loginRes.data.user_login);

      window.location.href = "/";
    } catch (err) {
      console.error(err);
      setError("Invalid credentials. Try again!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gray-900/70 backdrop-blur-xl shadow-[0_0_25px_rgba(16,185,129,0.25)] rounded-2xl w-full max-w-md p-8 border border-gray-800"
      >
        {/* Title */}
        <h1 className="text-3xl font-extrabold text-center mb-6 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent tracking-wide">
          🧾 SuperBill Login
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full p-3 rounded-lg bg-gray-800/80 text-gray-100 border border-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all duration-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full p-3 rounded-lg bg-gray-800/80 text-gray-100 border border-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all duration-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm text-center font-medium"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300 }}
            type="submit"
            className="w-full py-3 font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-teal-400 hover:to-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all duration-300"
          >
            Login
          </motion.button>
        </form>

        {/* Register link */}
        <p className="mt-5 text-center text-gray-400 text-sm">
          Don’t have an account?{" "}
          <a
            href="/register"
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors duration-200"
          >
            Register here
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
