import React, { forwardRef } from "react";

const InvoicePrint = forwardRef(({ billData }, ref) => (
  <div ref={ref} className="p-6 bg-white text-black w-[210mm] min-h-[297mm]">
    <h1 className="text-2xl font-bold mb-2 text-center">🧾 Invoice</h1>
    <p><strong>Bill ID:</strong> {billData.bill_id}</p>
    <p><strong>Date:</strong> {new Date().toLocaleString()}</p>

    <hr className="my-3" />

    <div>
      <p><strong>Customer:</strong> {billData.customer?.name}</p>
      <p><strong>Contact:</strong> {billData.customer?.contact_number}</p>
    </div>

    <table className="w-full mt-4 border border-gray-300">
      <thead className="bg-gray-100">
        <tr>
          <th className="border p-2 text-left">Product</th>
          <th className="border p-2 text-right">Qty</th>
          <th className="border p-2 text-right">Price</th>
          <th className="border p-2 text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        {billData.items.map((item, idx) => (
          <tr key={idx}>
            <td className="border p-2">{item.name}</td>
            <td className="border p-2 text-right">{item.qty}</td>
            <td className="border p-2 text-right">₹{item.price}</td>
            <td className="border p-2 text-right">₹{item.qty * item.price}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="mt-6 text-right space-y-1">
      <p>Subtotal: ₹{billData.subtotal.toFixed(2)}</p>
      <p>Tax (5%): ₹{billData.tax.toFixed(2)}</p>
      <p>Discount (10%): ₹{billData.discount.toFixed(2)}</p>
      <h2 className="text-lg font-bold">Total: ₹{billData.total.toFixed(2)}</h2>
    </div>

    <div className="text-center mt-10">
      <p>Thank you for shopping with us 🛒</p>
    </div>
  </div>
));

export default InvoicePrint;
