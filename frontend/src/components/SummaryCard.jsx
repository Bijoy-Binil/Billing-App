// src/components/SummaryCard.jsx
import React from "react";

const SummaryCard = ({ title, value, sub, icon }) => {
  return (
    <div className="flex-1 min-w-[200px] bg-gray-800/60 border border-gray-700 backdrop-blur p-5 rounded-2xl shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-gray-400">{title}</div>
          <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
          {sub && <div className="mt-1 text-sm text-gray-400">{sub}</div>}
        </div>
        <div className="ml-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#00FF88]/30 to-[#00BFFF]/20">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
