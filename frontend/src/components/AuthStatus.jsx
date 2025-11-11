import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthContext } from "../AuthProvider";

const AuthStatus = () => {
  const { userName, handleLogout, isLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const onLogout = () => {
    handleLogout();
    navigate("/login");
  };

  const formattedName =
    userName?.replace(/([A-Z])/g, " $1").trim() || "User";

  return (
    <div className="flex items-center gap-4">
      {isLoggedIn && userName ? (
        <>
          {/* Username + Role */}
          <div className="text-sm font-medium text-gray-800">
            <span className="text-blue-600 lineartext-lg font-semibold">
              {formattedName.toUpperCase()}
            </span>{" "}
            <span className="text-purple-600 lineartext-lg font-semibold">
              ({role?.toUpperCase()})
            </span>
          </div>

          {/* Avatar */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="relative group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-linear-to-br lineartext-lg from-blue-500/30 to-purple-500/30 flex items-center justify-center text-white font-bold  shadow-[0_0_10px_rgba(59,130,246,0.4)] transition">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="absolute -inset-[3px] rounded-full bg-linear-to-tr from-blue-400/40 to-purple-400/40 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </motion.div>

          {/* Logout Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
            className="px-3 py-1.5 lineartext-lg bg-blue-500/10 text-blue-600  rounded-lg border border-blue-400/40 hover:bg-blue-500/20 transition-all duration-300 font-medium"
          >
            Logout
          </motion.button>
        </>
      ) : (
        <>
          <Link
            to="/login"
            className="text-sm text-blue-600 hover:underline transition duration-300"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="text-sm text-blue-600 hover:underline transition duration-300"
          >
            Register
          </Link>
        </>
      )}
    </div>
  );
};

export default AuthStatus;
