import React, { useContext } from "react";
import { Menu } from "lucide-react";
import { AuthContext } from "../AuthProvider";
import { Link } from "react-router-dom";

const TopNav = ({ onMenu }) => {
  const { userName } = useContext(AuthContext);

  return (
    <header className="flex items-center justify-between px-6 md:px-20 py-4 
      bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">

      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenu}
          aria-label="Toggle menu"
          className="p-2 md:hidden rounded-md border border-gray-300 bg-white
          hover:bg-gray-100 hover:border-emerald-400 hover:text-emerald-500 
          transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Dashboard Title */}
        <div className="hidden md:block">
          <h2 className="text-xl font-semibold text-gray-800 tracking-wide">
            Dashboard
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            Overview of sales, billing & stock
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {userName ? (
          <>
            {/* Welcome Text */}
            <div className="text-sm text-gray-600">
              Welcome,{" "}
              <span className="font-semibold text-emerald-600">
                {userName}
              </span>
            </div>

            {/* Avatar */}
            <div className="relative group">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 
                flex items-center justify-center font-bold text-lg
                border border-emerald-200
                group-hover:bg-emerald-200 transition">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
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
