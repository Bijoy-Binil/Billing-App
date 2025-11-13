// src/components/BillsTable.jsx
import React, { useMemo } from "react";
import ClipLoader from "react-spinners/ClipLoader";

const BillsTable = ({ bills = [], loading = false }) => {

  if (loading) {
    return (
      <div className="py-10 w-full flex justify-center">
        <ClipLoader size={32} color="#2563EB" />
      </div>
    );
  }

  const todayBills = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return bills.filter((bill) => bill.created_at.startsWith(today));
  }, [bills]);

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-left">
        <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-600 text-sm">
          <tr>
            <th className="py-4 px-4 font-semibold">Bill ID</th>
            <th className="py-4 px-4 font-semibold">Cashier</th>
            <th className="py-4 px-4 font-semibold">Customer</th>
            <th className="py-4 px-4 font-semibold text-right">Total</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {todayBills.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-8 text-center text-gray-500 text-sm">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl">📄</span>
                  </div>
                  No bills for today
                </div>
              </td>
            </tr>
          ) : (
            todayBills.slice(0, 10).map((b, index) => (
              <tr key={index} className="hover:bg-blue-50 transition-colors group">
                <td className="py-4 px-4 font-medium text-gray-900 group-hover:text-blue-600">
                  {b.bill_id}
                </td>
                <td className="py-4 px-4 text-gray-700">
                  {b.cashier?.first_name ? `${b.cashier.first_name} ` : "—"}
                </td>
                <td className="py-4 px-4 text-gray-700">
                  {b.customer_name || "Walk-in"}
                </td>
                <td className="py-4 px-4 text-right font-bold text-emerald-600">
                  ₹{Number(b.total).toLocaleString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BillsTable;
