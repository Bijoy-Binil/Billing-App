import React from "react";

const BillsTable = ({ bills = [] }) => {
  return (
    <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-2xl">
      <div className="text-white font-semibold mb-3">Today's Bills</div>
      <div className="overflow-x-auto">
        <table className="min-w-[640px] text-left">
          <thead className="text-gray-400 text-sm">
            <tr>
              <th className="py-2">Bill ID</th>
              <th className="py-2">Cashier</th>
              <th className="py-2">Customer</th>
              <th className="py-2">Total</th>
              <th className="py-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-400">
                  No bills for today
                </td>
              </tr>
            )}
            {bills.map((b) => (
              <tr key={b.id} className="border-t border-gray-700">
                <td className="py-3 text-sm text-white">{b.bill_id}</td>
                <td className="py-3 text-sm text-gray-200">{b.cashier?.username || "—"}</td>
                <td className="py-3 text-sm text-gray-200">{b.customer?.name || "Walk-in"}</td>
                <td className="py-3 text-sm text-emerald-400">₹{Number(b.total).toFixed(2)}</td>
                <td className="py-3 text-sm text-gray-400">{new Date(b.created_at).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BillsTable;
