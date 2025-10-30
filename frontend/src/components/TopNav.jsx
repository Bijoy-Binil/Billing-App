import React from "react";
import { Menu } from "lucide-react"; // or use any svg icon

const TopNav = ({ onMenu }) => {
  return (
    <header className="flex items-center justify-between px-4  border-b border-gray-700">
      <div className="flex items-center  gap-3">
        {/* hamburger only visible on small screens */}
        <button
          onClick={onMenu}
          aria-label="Toggle menu"
          className="p-2 md:hidden rounded-md hover:bg-gray-800/60 transition"
        >
          <Menu size={18} />
        </button>

        <div className="hidden md:block">
          <h2 className="text-xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-400 text-sm">Overview of sales, billing & stock</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-400 hidden sm:block">
          Welcome, {localStorage.getItem("username") || "Cashier"}
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00FF88]/30 to-[#00BFFF]/20 flex items-center justify-center font-bold text-black">
          U
        </div>
      </div>
    </header>
  );
};

export default TopNav;
