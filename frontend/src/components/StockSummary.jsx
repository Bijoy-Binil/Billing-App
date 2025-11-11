// src/components/StockSummary.jsx
import React from "react";

const StockSummary = ({ products = [] }) => {
  return (
    <div>
      {/* Empty State */}
      {products.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-gray-600 font-medium">All products are sufficiently stocked.</p>
          <p className="text-gray-400 text-sm mt-1">No low-quantity warnings.</p>
        </div>
      )}

      {/* Product List */}
      <div className="space-y-3">
        {products.slice(0, 8).map((p, i) => (
          <div
            key={p.id || i}
            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 hover:shadow-md transition-all"
          >
            {/* Left */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-sm font-bold">
                {i + 1}
              </div>

              <div>
                <div className="font-semibold text-gray-800">{p.name}</div>
                <div className="text-xs text-gray-500">
                  {p.category_detail?.name || p.category || "—"}
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="text-right">
              <div
                className={`font-bold text-lg ${
                  p.quantity <= 2 ? "text-rose-600" : 
                  p.quantity <= 5 ? "text-amber-600" : "text-gray-700"
                }`}
              >
                {p.quantity} pcs
              </div>
              <div className="text-xs text-gray-500">
                Stock value:  ₹{(Number(p.price) * Number(p.quantity)).toLocaleString()}
              </div>
            </div>
          </div>
        ))}

        {products.length > 8 && (
          <div className="text-center text-sm text-gray-500 py-3 bg-gray-50 rounded-xl">
            +{products.length - 8} more items need attention
          </div>
        )}
      </div>
    </div>
  );
};

export default StockSummary;