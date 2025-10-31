import React, { useContext } from "react";
import {  Menu } from "lucide-react";
import { AuthContext } from "../AuthProvider";
import { Link } from "react-router-dom";


const TopNav = ({ onMenu }) => {
  const { userName } = useContext(AuthContext);
console.log("userName==>",userName)
  return (
    <header className="flex items-center justify-between px-6 md:px-20 border-b border-gray-700 py-3">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          aria-label="Toggle menu"
          className="p-2 md:hidden rounded-md hover:bg-gray-800/60 transition"
        >
          <Menu size={18} />
        </button>

        <div className="hidden md:block">
          <h2 className="text-xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-400 text-sm">
            Overview of sales, billing & stock
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {userName ? (
          <>
            <div className="text-sm text-gray-400">
              Welcome,{" "}
              <span className="text-sm text-red-400">
                {userName}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#00FF88]/30 to-[#00BFFF]/20 flex items-center justify-center font-bold text-black">

            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm text-blue-400 hover:underline">
              Login
            </Link>
            <Link to="/register" className="text-sm text-blue-400 hover:underline">
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default TopNav;
