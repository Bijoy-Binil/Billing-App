import React, { useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  LogOut,
} from "lucide-react";
import { AuthContext } from "../../AuthProvider";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Inventory", icon: Package, path: "/inventory" },
  { name: "Billing", icon: ShoppingCart, path: "/billing" },
  { name: "Reports", icon: BarChart3, path: "/reports" },
];

const Sidebar = ({ open = false, onClose = () => {} }) => {
  const { handleLogout } = useContext(AuthContext);
  const location = useLocation();

  // Auto-close mobile menu on route change
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700 flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-4 text-center border-b border-gray-700">
          <h1 className="text-2xl font-bold text-emerald-400 tracking-wide drop-shadow-lg">
            🧾 SuperBill
          </h1>
          <p className="text-xs text-gray-400 mt-1">Smart Billing System</p>
        </div>

        {/* Menu */}
        <div className="flex-1 py-6 space-y-2 overflow-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${
                  active
                    ? "bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 shadow-[0_0_8px_#34d399]"
                    : "text-gray-300 hover:text-emerald-400 hover:bg-gray-800/60 hover:shadow-[0_0_6px_#34d399]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className="px-6 py-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full text-gray-400 hover:text-red-400 transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out`}
        role="dialog"
        aria-modal={open ? "true" : "false"}
      >
        {/* Background */}
        <div
          className={`absolute inset-0 bg-black/50 ${
            open ? "opacity-100" : "opacity-0"
          } transition-opacity`}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Sidebar Panel */}
        <nav className="relative w-64 h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700 p-4 flex flex-col">
          <div className="px-2 py-4 text-center border-b border-gray-700 mb-4">
            <h2 className="text-xl font-bold text-emerald-400">🧾 SuperBill</h2>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-md ${
                    active
                      ? "bg-emerald-600/30 text-emerald-400"
                      : "text-gray-300 hover:bg-gray-800/60 hover:text-emerald-400"
                  }`}
                >
                  <Icon size={16} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-gray-700 pt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-gray-400 hover:text-red-400"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
