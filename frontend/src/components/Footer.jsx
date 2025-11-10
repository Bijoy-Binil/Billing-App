import React from "react";

const Footer = () => {
  return (
    <footer className="w-full bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700 text-gray-400 text-sm">
      {/* Top Section */}
      <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        {/* Brand */}
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-emerald-400 tracking-wide">
            SuperBill
          </h2>
          <p className="text-xs text-gray-500">
            Smart billing system for modern businesses.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6">
          <a href="/billing" className="hover:text-emerald-400 transition">Billing</a>
          <a href="/products" className="hover:text-emerald-400 transition">Products</a>
          <a href="/reports" className="hover:text-emerald-400 transition">Reports</a>
          <a href="/dashboard" className="hover:text-emerald-400 transition">Dashboard</a>
          <a href="/contact" className="hover:text-emerald-400 transition">Contact</a>
        </div>

        {/* Social Icons */}
        <div className="flex justify-center gap-3">
          <a
            href="https://github.com"
            aria-label="GitHub"
            className="p-1.5 rounded-lg bg-gray-800/60 hover:text-emerald-400 hover:shadow-[0_0_6px_#34d399] transition"
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 .5C5.7.5.9 5.3.9 11.6c0 4.7 3 8.7 7.2 10.1.5.1.7-.2.7-.5v-1.8c-2.9.6-3.6-1.4-3.6-1.4-.5-1.3-1.2-1.7-1.2-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1 1.6-.6 2-.9.1-.7.4-1.1.7-1.4-2.3-.3-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.7-.1-.3-.5-1.4.1-2.9 0 0 .8-.3 2.8 1 .8-.2 1.7-.4 2.6-.4.9 0 1.8.1 2.6.4 2-.1 2.8-1 2.8-1 .6 1.5.2 2.6.1 2.9.6.7 1 1.6 1 2.7 0 3.9-2.4 4.6-4.7 4.9.4.3.8.9.8 1.8v2.6c0 .3.2.6.7.5 4.2-1.4 7.2-5.4 7.2-10.1C23 5.3 18.2.5 12 .5z" />
            </svg>
          </a>

          <a
            href="https://twitter.com"
            aria-label="Twitter"
            className="p-1.5 rounded-lg bg-gray-800/60 hover:text-emerald-400 hover:shadow-[0_0_6px_#34d399] transition"
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 7.5c-.6.3-1.3.6-2 .7.7-.4 1.3-1 1.6-1.8-.6.3-1.4.6-2.1.8C16.8 6 15.9 5.5 15 5.5c-1.6 0-2.9 1.4-2.9 3.2 0 .2 0 .4.1.6C9.6 9.1 7.1 7.9 5.4 6c-.3.6-.5 1.3-.5 2 0 1.3.7 2.4 1.8 3-.5 0-1-.2-1.4-.4v.1c0 1.9 1.3 3.5 3 3.8-.3.1-.6.1-.9.1-.2 0-.4 0-.6-.1.4 1.5 1.9 2.6 3.6 2.6-1.3 1-3 1.6-4.7 1.6-.3 0-.6 0-.8 0 1.8 1.2 3.9 1.9 6.2 1.9 7.5 0 11.6-6.6 11.6-12.3v-.6c.8-.6 1.5-1.2 2-1.9-.7.4-1.4.7-2.2.8.8-.5 1.4-1.3 1.7-2.2-.8.5-1.6.9-2.6 1.1z" />
            </svg>
          </a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 py-2 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} SuperBill — All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
