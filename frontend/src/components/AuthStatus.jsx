import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthContext } from "../AuthProvider";

const AuthStatus = () => {
  const { userName, handleLogout, isLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();
const role = localStorage.getItem("role"); // "manager" or "cashier"
  const onLogout = () => {
    handleLogout();
    navigate("/login");
  };

  return (
    <div className="flex items-center gap-4">
      {isLoggedIn && userName ? (
        <>
          <div className="text-sm text-gray-300">
         
            <span className="font-semibold text-emerald-400 drop-shadow-[0_0_4px_#34d399]">
             {userName.replace(/([A-Z])/g, ' $1') + ' (' + role.toUpperCase() + ')'}


            </span>
          </div>

          <motion.div
            whileHover={{ scale: 1.1 }}
            className="relative group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-transform duration-300">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -inset-[2px] rounded-full bg-gradient-to-tr from-emerald-400/40 to-cyan-400/40 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
            className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 text-sm rounded-lg border border-emerald-400/40 hover:bg-emerald-500/30 transition-all duration-300"
          >
            Logout
          </motion.button>
        </>
      ) : (
        <>
          <Link
            to="/login"
            className="text-sm text-emerald-400 hover:underline transition-all duration-300"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="text-sm text-emerald-400 hover:underline transition-all duration-300"
          >
            Register
          </Link>
        </>
      )}
    </div>
  );
};

export default AuthStatus;
