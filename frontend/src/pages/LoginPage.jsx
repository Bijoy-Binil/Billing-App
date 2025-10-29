import React, { useState } from "react";
import axios from "axios";

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

      // second login call to your custom endpoint
      const loginRes = await axios.post("http://127.0.0.1:8000/api/login/", {
        email,
        password,
      });

      localStorage.setItem("userId", loginRes.data.userId);
      localStorage.setItem("username", loginRes.data.username);
      localStorage.setItem("userEmail", loginRes.data.email);
      localStorage.setItem("userJoined", loginRes.data.joined);
      localStorage.setItem("isLoggedIn", loginRes.data.user_login);

      // Redirect after successful login
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      setError("Invalid credentials. Try again!");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
      }}
    >
      <div className="bg-gray-900/70 backdrop-blur-xl shadow-2xl rounded-2xl w-full max-w-md p-8 border border-gray-800">
        <h1 className="text-3xl font-bold text-center mb-6 text-white tracking-wide">
          SuperMarket Billing
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full p-3 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:ring-2 focus:ring-[#00FF88] outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full p-3 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:ring-2 focus:ring-[#00FF88] outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 text-black font-semibold rounded-lg bg-gradient-to-r from-[#00FF88] to-[#00BFFF] hover:from-[#00BFFF] hover:to-[#00FF88] transition-all duration-300 shadow-lg shadow-[#00FF8833]"
          >
            Login
          </button>
        </form>

        <p className="mt-5 text-center text-gray-400 text-sm">
          Don’t have an account?{" "}
          <a
            href="/register"
            className="text-[#00BFFF] hover:text-[#00FF88] font-medium transition"
          >
            Register here
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
