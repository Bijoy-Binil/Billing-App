import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:8000/api/register/", formData);
      setSuccess("✅ Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError("❌ Failed to register. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        whileHover={{ scale: 1.01, boxShadow: "0 0 35px rgba(16,185,129,0.2)" }}
        className="bg-gray-900/70 backdrop-blur-xl shadow-[0_0_25px_rgba(16,185,129,0.25)] rounded-2xl w-full max-w-md p-8 border border-gray-800"
      >
        {/* Title */}
        <h1 className="text-3xl font-extrabold text-center mb-6 bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent tracking-wide">
          🧾 SuperBill Register
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              First Name
            </label>
            <input
              type="text"
              name="first_name"
              placeholder="Enter your first name"
              className="w-full p-3 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 
                         focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none 
                         transition-all duration-200"
              required
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="last_name"
              placeholder="Enter your last name"
              className="w-full p-3 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 
                         focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none 
                         transition-all duration-200"
              required
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              className="w-full p-3 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 
                         focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none 
                         transition-all duration-200"
              required
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              className="w-full p-3 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 
                         focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none 
                         transition-all duration-200"
              required
              onChange={handleChange}
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm text-center font-medium"
            >
              {error}
            </motion.p>
          )}
          {success && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-emerald-400 text-sm text-center font-medium"
            >
              {success}
            </motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 0 30px rgba(0,255,136,0.3)",
            }}
            type="submit"
            className="w-full py-3 text-black font-semibold rounded-lg 
                       bg-gradient-to-r from-[#00FF88] to-[#00BFFF] 
                       hover:from-[#00BFFF] hover:to-[#00FF88] 
                       transition-all duration-300 shadow-lg shadow-[#00FF8833]"
          >
            Register
          </motion.button>
        </form>

        <p className="mt-5 text-center text-gray-400 text-sm">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-[#00BFFF] hover:text-[#00FF88] font-medium transition"
          >
            Login here
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
