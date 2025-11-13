import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { FileText, Calendar, Filter, Download } from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import SectionLoader from "../../components/SectionLoader";

const API_STOCK_BILLS = "http://127.0.0.1:8000/api/reports/stock-bills/";

const StockBillsReport = () => {
  const [stockBills, setStockBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    fetchStockBills();
  }, []);

  const fetchStockBills = async () => {
    setLoading(true);

    try {
      let url = API_STOCK_BILLS;
      if (fromDate && toDate) {
        url += `?start_date=${fromDate}&end_date=${toDate}`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStockBills(res.data || []);
    } catch (err) {
      console.error("Error fetching stock bills:", err);
      setStockBills([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
  };

  /** ---------------- Chart Data ---------------- */
  const chartData = useMemo(() => {
    const productMap = {};

    stockBills.forEach((item) => {
      if (!productMap[item.product]) {
        productMap[item.product] = { product: item.product, totalSold: 0 };
      }
      productMap[item.product].totalSold += item.quantity_sold;
    });

    return Object.values(productMap).slice(0, 10);
  }, [stockBills]);

  /** ---------------- CSV Export ---------------- */
  const exportToCSV = () => {
    const headers = [
      "Bill ID",
      "Date",
      "Product",
      "Qty Sold",
      "Stock Before",
      "Stock After",
    ];

    const rows = stockBills.map((item) => [
      item.bill_id,
      new Date(item.bill_date).toLocaleDateString(),
      item.product,
      item.quantity_sold,
      item.stock_before,
      item.stock_after,
    ]);

    const csv = [
      `Date Range: ${fromDate || "All"} to ${toDate || "All"}`,
      "",
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "stock-bills-report.csv";
    link.click();
  };

  /** ---------------- PDF Export ---------------- */
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Stock Bills Reconciliation Report", 14, 16);

    doc.setFontSize(10);
    doc.text(`From: ${fromDate || "All"}`, 14, 26);
    doc.text(`To: ${toDate || "All"}`, 14, 31);
    doc.text(`Total Records: ${stockBills.length}`, 14, 36);

    const headers = [
      "Bill ID",
      "Date",
      "Product",
      "Qty Sold",
      "Stock Before",
      "Stock After",
    ];

    const rows = stockBills.map((item) => [
      item.bill_id,
      new Date(item.bill_date).toLocaleDateString(),
      item.product,
      item.quantity_sold,
      item.stock_before,
      item.stock_after,
    ]);

    autoTable(doc, {
      startY: 42,
      head: [headers],
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save("stock-bills-report.pdf");
  };

  /** ---------------- FULLSCREEN LOADER ---------------- */
  if (loading && !stockBills.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <SectionLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ---------------- HEADER ---------------- */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
              <FileText className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Stock Bills Reconciliation
              </h1>
              <p className="text-gray-600 text-sm">
                Track product sales & stock movement
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 shadow"
            >
              <Download className="w-4 h-4" /> CSV
            </button>

            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 shadow"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </motion.div>

        {/* ---------------- FILTER BLOCK ---------------- */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow border"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-blue-600 w-5 h-5" />
            <h2 className="text-lg font-semibold text-gray-900">
              Date Range Filter
            </h2>
          </div>

          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full border px-3 py-2 rounded-lg"
              />
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full border px-3 py-2 rounded-lg"
              />
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={fetchStockBills}
                className="flex-1 md:flex-none px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2"
              >
                <Filter className="w-4 h-4" /> Apply
              </button>

              <button
                onClick={clearFilters}
                className="flex-1 md:flex-none px-6 py-2 bg-gray-200 text-gray-700 rounded-lg"
              >
                Clear
              </button>
            </div>
          </div>
        </motion.div>

        {/* ---------------- CHART ---------------- */}
  {/* Chart */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
>
  <div className="flex items-center gap-3 mb-6">
    <FileText className="w-5 h-5 text-blue-600" />
    <h2 className="text-xl font-bold text-gray-900">
      Products Sold Quantity
    </h2>
  </div>

  <div className="h-72 sm:h-80 md:h-[350px] lg:h-[400px]">
    {loading ? (
      <SectionLoader />
    ) : chartData.length > 0 ? (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 40 }}
        >
          <CartesianGrid stroke="#E2E8F0" />

          <XAxis
            dataKey="product"
            fontSize={12}
            angle={-35}
            textAnchor="end"
            interval={0}
            height={65}
          />

          <YAxis fontSize={12} />

          <Tooltip 
            contentStyle={{
              background: "white",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
            }}
          />

          {/* 🔥 Stunning Gradient */}
          <defs>
            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
              <stop offset="50%" stopColor="#6366F1" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.4} />
            </linearGradient>
          </defs>

          <Bar
            dataKey="totalSold"
            fill="url(#blueGradient)"
            barSize={32}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div className="flex justify-center items-center text-gray-400 h-full">
        <p>No chart data available</p>
      </div>
    )}
  </div>
</motion.div>


        {/* ---------------- TABLE ---------------- */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow border"
        >
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Stock Reconciliation Details
            </h2>
          </div>

          {loading ? (
            <SectionLoader />
          ) : stockBills.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[750px] text-sm">
                <thead className="bg-blue-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Bill ID</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-right">Qty Sold</th>
                    <th className="px-4 py-3 text-right">Stock Before</th>
                    <th className="px-4 py-3 text-right">Stock After</th>
                  </tr>
                </thead>

                <tbody>
                  {stockBills.map((item, index) => (
                    <tr
                      key={index}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        #{item.bill_id}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(item.bill_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{item.product}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-semibold">
                        {item.quantity_sold}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.stock_before}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {item.stock_after}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No stock data available.
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default StockBillsReport;
