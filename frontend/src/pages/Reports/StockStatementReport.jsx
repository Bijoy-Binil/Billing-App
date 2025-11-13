import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Package,
  Download,
  RefreshCw,
  FileText,
} from "lucide-react";
import SectionLoader from "../../components/SectionLoader";

const API_URL = "http://127.0.0.1:8000/api/reports/stock-statement/";

const StockStatementReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    fetchStockStatement();
  }, []);

  const fetchStockStatement = async () => {
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

      setData(res.data || []);
    } catch (err) {
      console.error("Error fetching stock statement:", err);
      setError("Unable to load stock statement data");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------
     CSV Export
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
     PDF Export
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
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save("stock_statement.pdf");
  }, [data]);

  /* ---------------------------------------------------
     UI
  --------------------------------------------------- */

  // GLOBAL PAGE LOADER
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <SectionLoader />
      </div>
    );
  }

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
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl shadow flex items-center gap-2 text-xs sm:text-sm disabled:opacity-40"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              CSV
            </button>

            <button
              disabled={!data.length}
              onClick={exportPDF}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg sm:rounded-xl shadow flex items-center gap-2 text-xs sm:text-sm disabled:opacity-40"
            >
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              PDF
            </button>

            <button
              onClick={fetchStockStatement}
              disabled={loading}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 hover:bg-gray-300 rounded-lg sm:rounded-xl border border-gray-300 shadow flex items-center gap-2 text-gray-700 text-xs sm:text-sm"
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
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

        {/* MAIN TABLE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-blue-200 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6"
        >
          {/* ERROR */}
          {error ? (
            <ErrorView message={error} retry={fetchStockStatement} />
          ) : data.length === 0 ? (
            <EmptyView />
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden lg:block overflow-x-auto rounded-lg border border-blue-200 shadow-sm">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="py-3 px-4 text-left font-bold text-gray-700">#</th>
                      <th className="py-3 px-4 text-left font-bold text-gray-700">Product</th>
                      <th className="py-3 px-4 text-center font-bold text-gray-700">Opening</th>
                      <th className="py-3 px-4 text-center font-bold text-gray-700">Sold</th>
                      <th className="py-3 px-4 text-center font-bold text-gray-700">Closing</th>
                      <th className="py-3 px-4 text-center font-bold text-gray-700">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-blue-100">
                    {data.map((r, i) => (
                      <tr key={i} className="hover:bg-blue-50">
                        <td className="py-3 px-4">{i + 1}</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">{r.product}</td>
                        <td className="py-3 px-4 text-center">{r.opening_stock}</td>
                        <td className="py-3 px-4 text-center text-blue-700 font-semibold">
                          {r.total_sold}
                        </td>
                        <td className="py-3 px-4 text-center text-emerald-600 font-semibold">
                          {r.closing_stock}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusChip value={r.closing_stock} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
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

/* COMPONENTS */

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
      <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-rose-500 to-pink-500 text-white">
        Out
      </span>
    );

  if (value <= 10)
    return (
      <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-400 to-orange-400 text-white">
        Low
      </span>
    );

  return (
    <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white">
      Good
    </span>
  );
};

const EmptyView = () => (
  <div className="py-12 text-center">
    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
    <p className="text-gray-600 font-medium text-sm">No data available</p>
    <p className="text-gray-500 text-xs">Stock data will appear when sales occur</p>
  </div>
);

const ErrorView = ({ message, retry }) => (
  <div className="py-12 text-center">
    <p className="text-red-600 font-semibold mb-3">{message}</p>
    <button
      onClick={retry}
      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow text-sm"
    >
      Retry
    </button>
  </div>
);

const MobileCard = ({ row, index }) => (
  <div className="bg-white p-4 rounded-xl shadow border border-blue-200 space-y-3">
    <div className="flex justify-between">
      <h3 className="font-semibold text-gray-900">
        {index + 1}. {row.product}
      </h3>
      <StatusChip value={row.closing_stock} />
    </div>

    <div className="grid grid-cols-3 gap-3 text-center text-sm">
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
