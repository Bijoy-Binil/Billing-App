import React, { useContext } from "react";
import { Menu } from "lucide-react";
import { AuthContext } from "../AuthProvider";
import { Link } from "react-router-dom";

const TopNav = ({ onMenu }) => {
  const { userName } = useContext(AuthContext);

  return (
    <header className="flex items-center justify-between px-6 md:px-20 py-5.5 border-b border-gray-700 bg-gradient-to-r from-gray-900/95 via-gray-800/80 to-gray-900/95 backdrop-blur-xl shadow-[0_0_10px_rgba(16,185,129,0.1)] transition-all duration-300">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenu}
          aria-label="Toggle menu"
          className="p-2 md:hidden rounded-md hover:bg-gray-800/60 hover:shadow-[0_0_10px_#34d399] text-emerald-400 transition"
        >
          <Menu size={20} />
        </button>

        {/* Dashboard Title */}
        <div className="hidden md:block">
          <h2 className="text-xl font-semibold text-emerald-400 tracking-wide drop-shadow-sm">
            Dashboard
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Overview of sales, billing & stock
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {userName ? (
          <>
            {/* Welcome Text */}
            <div className="text-sm text-gray-300">
              Welcome,{" "}
              <span className="font-semibold text-emerald-400 drop-shadow-[0_0_4px_#34d399]">
                {userName}
              </span>
            </div>

            {/* Avatar */}
            <div className="relative group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:scale-105 transition-transform duration-300">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -inset-[2px] rounded-full bg-gradient-to-tr from-emerald-400/40 to-cyan-400/40 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
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
    </header>
  );
};

export default TopNav;
