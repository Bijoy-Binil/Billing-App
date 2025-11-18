import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthContext } from "../AuthProvider";
import { ThemeContext } from "../pages/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

const AuthStatus = () => {
  const { userName, handleLogout, isLoggedIn } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === "dark";
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
      {/* <button
        onClick={toggleTheme}
        className="px-3 py-1.5 rounded-lg border transition-colors duration-200 flex items-center gap-2
                   bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200
                   dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
        aria-label="Toggle theme"
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}<span className="text-sm font-medium">{isDark ? "Light" : "Dark"}</span>
      </button> */}

    </div>
  );
};

export default AuthStatus;
