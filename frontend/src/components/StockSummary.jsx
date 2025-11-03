// src/components/StockSummary.jsx
import React from "react";

const StockSummary = ({ products = [] }) => {
  console.log("Low stock products =>", products);

  return (
    <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <div className="text-white font-semibold">Stock Summary</div>
        <div className="text-sm text-gray-400">{products.length} items</div>
      </div>

      {/* If no low-stock products */}
      {products.length === 0 && (
        <div className="text-gray-400 text-sm text-center py-4">
          ✅ All products are sufficiently stocked.
        </div>
      )}

      {/* Show low-stock products */}
      <div className="grid grid-cols-1 gap-2">
        {products.slice(0, 8).map((p, i) => (
          <div
            key={p.id || i}
            className="flex items-center justify-between p-3 bg-gray-900/40 rounded-lg border border-gray-700 hover:border-emerald-600/40 hover:bg-gray-800/50 transition"
          >
            <div>
              <div className="text-sm text-gray-200 font-medium">{p.name}</div>
              <div className="text-xs text-gray-400">
                {p.category_detail?.name || p.category || "—"}
              </div>
            </div>

            <div className="text-right">
              <div
                className={`text-sm font-semibold ${
                  p.quantity <= 5 ? "text-yellow-400" : "text-gray-200"
                }`}
              >
                {p.quantity} pcs
              </div>
              <div className="text-xs text-gray-400">
                ₹{(Number(p.quantity || 0) * Number(p.price || 0)).toFixed(2)}
              </div>
            </div>
          </div>
        ))}

        {products.length > 8 && (
          <div className="text-sm text-gray-400 text-center p-2">
            +{products.length - 8} more items
          </div>
        )}
      </div>
    </div>
  );
};

export default StockSummary;
