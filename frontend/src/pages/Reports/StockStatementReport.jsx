import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Package,
  Download,
  RefreshCw,
  FileText,
  TrendingUp,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api/reports/stock-statement/";

const StockStatementReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStockStatement();
  }, []);

  const fetchStockStatement = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setData(res.data);
    } catch (err) {
      console.error("Error fetching stock statement:", err);
      setError("Unable to load stock statement data");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------
     ✅ CSV Export
  --------------------------------------------------- */
  const exportCSV = () => {
    if (!data.length) return;

    const header = ["Product", "Opening", "Sold", "Closing"];
    const rows = data.map((r) => [
      r.product,
      r.opening_stock,
      r.total_sold,
      r.closing_stock,
    ]);

    const csv =
      header.join(",") +
      "\n" +
      rows.map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "stock_statement.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------------------------------------------------
     ✅ PDF Export
  --------------------------------------------------- */
  const exportPDF = useCallback(async () => {
    if (!data.length) return;

    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");

    doc.setFontSize(18);
    doc.text("Stock Statement Report", 14, 18);

    const table = data.map((r) => [
      r.product,
      r.opening_stock,
      r.total_sold,
      r.closing_stock,
    ]);

    autoTable(doc, {
      startY: 26,
      head: [["Product", "Opening", "Sold", "Closing"]],
      body: table,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] }, // Indigo/Blue
    });

    doc.save("stock_statement.pdf");
  }, [data]);

  /* ---------------------------------------------------
     ✅ UI
  --------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-5"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl shadow-lg">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Stock Statement
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm">
                Track total inventory movement and closing stock
              </p>
            </div>
          </div>

          {/* EXPORT BUTTONS */}
          <div className="flex gap-2 sm:gap-3">
            <button
              disabled={!data.length}
              onClick={exportCSV}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl shadow flex items-center justify-center gap-2 font-semibold disabled:opacity-50 text-xs sm:text-sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              CSV
            </button>

            <button
              disabled={!data.length}
              onClick={exportPDF}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg sm:rounded-xl shadow flex items-center justify-center gap-2 font-semibold disabled:opacity-50 text-xs sm:text-sm"
            >
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              PDF
            </button>

            <button
              onClick={fetchStockStatement}
              disabled={loading}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 hover:bg-gray-300 rounded-lg sm:rounded-xl border border-gray-300 shadow flex items-center justify-center gap-2 text-gray-700 text-xs sm:text-sm"
            >
              <RefreshCw
                className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* KPI CARDS */}
        {data.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <KpiCard
              title="Total Products"
              value={data.length}
              gradient="from-blue-500 to-blue-600"
              icon="📦"
            />

            <KpiCard
              title="Total Sold"
              value={data.reduce((s, r) => s + (r.total_sold || 0), 0)}
              gradient="from-amber-400 to-orange-500"
              icon="📉"
            />

            <KpiCard
              title="Avg Opening"
              value={Math.round(
                data.reduce((s, r) => s + (r.opening_stock || 0), 0) /
                  data.length
              )}
              gradient="from-indigo-500 to-indigo-600"
              icon="📊"
            />

            <KpiCard
              title="Avg Closing"
              value={Math.round(
                data.reduce((s, r) => s + (r.closing_stock || 0), 0) /
                  data.length
              )}
              gradient="from-purple-500 to-purple-600"
              icon="📈"
            />
          </div>
        )}

        {/* MAIN TABLE WITH MOBILE CARDS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-blue-200 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6"
        >
          {loading ? (
            <LoadingView />
          ) : error ? (
            <ErrorView message={error} retry={fetchStockStatement} />
          ) : data.length === 0 ? (
            <EmptyView />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto rounded-lg sm:rounded-xl border border-blue-200 shadow-sm">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="py-3 px-3 sm:py-3 sm:px-4 text-left text-xs font-bold text-gray-700">
                        #
                      </th>
                      <th className="py-3 px-3 sm:py-3 sm:px-4 text-left text-xs font-bold text-gray-700">
                        Product
                      </th>
                      <th className="py-3 px-3 sm:py-3 sm:px-4 text-center text-xs font-bold text-gray-700">
                        Opening
                      </th>
                      <th className="py-3 px-3 sm:py-3 sm:px-4 text-center text-xs font-bold text-gray-700">
                        Sold
                      </th>
                      <th className="py-3 px-3 sm:py-3 sm:px-4 text-center text-xs font-bold text-gray-700">
                        Closing
                      </th>
                      <th className="py-3 px-3 sm:py-3 sm:px-4 text-center text-xs font-bold text-gray-700">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-blue-100">
                    {data.map((r, i) => (
                      <tr key={i} className="hover:bg-blue-50">
                        <td className="py-3 px-3 sm:py-4 sm:px-4">{i + 1}</td>
                        <td className="py-3 px-3 sm:py-4 sm:px-4 font-semibold text-gray-900">
                          {r.product}
                        </td>
                        <td className="py-3 px-3 sm:py-4 sm:px-4 text-center text-gray-700">
                          {r.opening_stock}
                        </td>
                        <td className="py-3 px-3 sm:py-4 sm:px-4 text-center text-blue-700 font-semibold">
                          {r.total_sold}
                        </td>
                        <td className="py-3 px-3 sm:py-4 sm:px-4 text-center text-emerald-700 font-semibold">
                          {r.closing_stock}
                        </td>
                        <td className="py-3 px-3 sm:py-4 sm:px-4 text-center">
                          <StatusChip value={r.closing_stock} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="lg:hidden space-y-3 sm:space-y-4">
                {data.map((row, i) => (
                  <MobileCard key={i} row={row} index={i} />
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------
   COMPONENTS
--------------------------------------------------- */

const KpiCard = ({ title, value, gradient, icon }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg bg-gradient-to-r ${gradient} text-white`}
  >
    <div className="flex justify-between items-center">
      <div>
        <p className="text-xs sm:text-sm opacity-90">{title}</p>
        <h2 className="text-xl sm:text-2xl font-bold mt-1">{value}</h2>
      </div>
      <span className="text-xl sm:text-3xl">{icon}</span>
    </div>
  </motion.div>
);

const StatusChip = ({ value }) => {
  if (value == 0)
    return (
      <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-rose-500 to-pink-500 text-white">
        Out
      </span>
    );

  if (value <= 10)
    return (
      <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-400 to-orange-400 text-white">
        Low
      </span>
    );

  return (
    <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white">
      Good
    </span>
  );
};

const LoadingView = () => (
  <div className="flex flex-col items-center py-8 sm:py-10">
    <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent animate-spin rounded-full"></div>
    <p className="mt-2 sm:mt-3 text-gray-600 text-xs sm:text-sm">Loading stock statement...</p>
  </div>
);

const EmptyView = () => (
  <div className="text-center py-8 sm:py-10">
    <Package className="w-10 h-10 sm:w-14 sm:h-14 text-gray-400 mx-auto mb-2 sm:mb-3" />
    <p className="text-gray-600 font-medium text-sm sm:text-base">No data available</p>
    <p className="text-gray-500 text-xs sm:text-sm">Stock data will appear when sales occur</p>
  </div>
);

const ErrorView = ({ message, retry }) => (
  <div className="text-center py-8 sm:py-10">
    <p className="text-red-600 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">{message}</p>
    <button
      onClick={retry}
      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl shadow text-sm sm:text-base"
    >
      Retry
    </button>
  </div>
);

const MobileCard = ({ row, index }) => (
  <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow border border-blue-200 space-y-2 sm:space-y-3">
    <div className="flex justify-between">
      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
        {index + 1}. {row.product}
      </h3>
      <StatusChip value={row.closing_stock} />
    </div>

    <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center text-xs sm:text-sm">
      <div>
        <p className="text-gray-500 text-xs">Open</p>
        <p className="font-bold">{row.opening_stock}</p>
      </div>
      <div>
        <p className="text-gray-500 text-xs">Sold</p>
        <p className="font-bold text-blue-600">{row.total_sold}</p>
      </div>
      <div>
        <p className="text-gray-500 text-xs">Close</p>
        <p className="font-bold text-emerald-600">{row.closing_stock}</p>
      </div>
    </div>
  </div>
);

export default StockStatementReport;