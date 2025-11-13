import React from "react";

const BeastLoader = () => {
  return (
    <div className="flex items-center justify-center py-10 select-none pointer-events-none">
      <div className="relative w-16 h-16">
        {/* Outer Ripple */}
        <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>

        {/* Middle Glow */}
        <div className="absolute inset-2 rounded-full bg-blue-600/30 blur-md animate-pulse"></div>

        {/* Inner Core */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 shadow-xl animate-spin-slow"></div>
      </div>
    </div>
  );
};

export default BeastLoader;
