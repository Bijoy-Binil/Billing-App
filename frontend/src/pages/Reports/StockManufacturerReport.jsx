import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Factory, Download, RefreshCw, Building, FileText } from "lucide-react";
import SectionLoader from "../../components/SectionLoader"; // ⬅ Adjust path if needed

/* ---------------------------------------------------
   PDF EXPORT
--------------------------------------------------- */
const exportPDF = async (data) => {
  if (!data.length) return;

  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Manufacturer Stock Report", 14, 16);

  const rows = data.map((r) => [
    r.manufacturer || "Unknown",
    r.total_products,
    Number(r.total_stock_value).toFixed(2),
    r.total_products > 0 ? (Number(r.total_stock_value) / r.total_products).toFixed(2) : "0.00",
  ]);

  autoTable(doc, {
    head: [["Manufacturer", "Products", "Stock Value (₹)", "Avg per Product"]],
    body: rows,
    startY: 24,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [79, 70, 229] }, // Indigo
  });

  doc.save("manufacturer-stock-report.pdf");
};

/* ---------------------------------------------------
   CSV EXPORT
--------------------------------------------------- */
const exportCSV = (data) => {
  if (!data.length) return;

  const headers = ["Manufacturer", "Total Products", "Total Stock Value (₹)", "Avg Value Per Product (₹)"];

  const rows = data.map((r) => [
    r.manufacturer || "Unknown",
    r.total_products,
    Number(r.total_stock_value).toFixed(2),
    r.total_products > 0 ? (Number(r.total_stock_value) / r.total_products).toFixed(2) : "0.00",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "manufacturer-stock-report.csv";
  a.click();
  URL.revokeObjectURL(url);
};

/* ---------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------- */
const StockManufacturerReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    fetchManufacturerReport();
  }, []);

  const fetchManufacturerReport = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get("http://127.0.0.1:8000/api/reports/manufacturer/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setData(res.data || []);
    } catch (err) {
      setError("Failed to load manufacturer data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  /* SUMMARY */
  const summaryStats = {
    totalManufacturers: data.length,
    totalProducts: data.reduce((sum, r) => sum + (r.total_products || 0), 0),
    totalStockValue: data.reduce((sum, r) => sum + Number(r.total_stock_value || 0), 0),
    avgProductsPerManufacturer:
      data.length > 0 ? Math.round(data.reduce((s, r) => s + (r.total_products || 0), 0) / data.length) : 0,
  };
// GLOBAL FULL-PAGE LOADER (Fixes 2 loader problem)
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <SectionLoader />
    </div>
  );
}

  /* ---------------------------------------------------
     UI
  --------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <Factory className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Manufacturer Stock Report</h1>
              <p className="text-gray-600 text-xs sm:text-sm">Stock grouped by manufacturer & product value</p>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex gap-2">
            <button
              onClick={() => exportCSV(data)}
              disabled={!data.length}
              className="px-4 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" /> CSV
            </button>

            <button
              onClick={() => exportPDF(data)}
              disabled={!data.length}
              className="px-4 sm:px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg sm:rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> PDF
            </button>

            <button
              onClick={fetchManufacturerReport}
              disabled={loading}
              className="px-4 sm:px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg sm:rounded-xl border shadow-sm flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* KPI CARDS */}
        {loading ? (
          <SectionLoader />
        ) : data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <KpiCard
              title="Manufacturers"
              value={summaryStats.totalManufacturers}
              gradient="from-purple-500 to-purple-600"
              icon={<Building className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
            />
            <KpiCard
              title="Total Products"
              value={summaryStats.totalProducts}
              gradient="from-blue-500 to-blue-600"
              icon="📦"
            />
            <KpiCard
              title="Avg Products"
              value={summaryStats.avgProductsPerManufacturer}
              gradient="from-amber-400 to-orange-400"
              icon="📊"
            />
            <KpiCard
              title="Total Stock Value"
              value={`₹${summaryStats.totalStockValue.toFixed(2)}`}
              gradient="from-emerald-400 to-green-400"
              icon="💰"
            />
          </div>
        ) : null}

        {/* TABLE BLOCK */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-blue-200"
        >
          {loading ? (
            <SectionLoader />
          ) : error ? (
            <ErrorBlock error={error} retry={fetchManufacturerReport} />
          ) : !data.length ? (
            <EmptyBlock />
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden lg:block overflow-x-auto rounded-lg border border-blue-200 shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-xs">#</th>
                      <th className="px-4 py-3 text-left font-bold text-xs">Manufacturer</th>
                      <th className="px-4 py-3 text-center font-bold text-xs">Products</th>
                      <th className="px-4 py-3 text-center font-bold text-xs">Stock Value (₹)</th>
                      <th className="px-4 py-3 text-center font-bold text-xs">Avg / Product</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-blue-100">
                    {data.map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50">
                        <td className="px-4 py-3">{i + 1}</td>
                        <td className="px-4 py-3 font-semibold">{row.manufacturer || "Unknown"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg">
                            {row.total_products}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-600">
                          ₹{Number(row.total_stock_value).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center text-purple-600 font-semibold">
                          ₹
                          {row.total_products > 0
                            ? (Number(row.total_stock_value) / row.total_products).toFixed(2)
                            : "0.00"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="lg:hidden space-y-4">
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
    className={`bg-gradient-to-r ${gradient} rounded-xl p-4 sm:p-6 shadow-lg text-white`}
  >
    <div className="flex justify-between items-center">
      <div>
        <p className="text-xs sm:text-sm opacity-80">{title}</p>
        <p className="text-xl sm:text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className="text-xl sm:text-2xl">{icon}</div>
    </div>
  </motion.div>
);

const MobileCard = ({ row, index }) => (
  <div className="bg-white border shadow rounded-xl p-4">
    <h3 className="font-semibold text-gray-900 text-base mb-3">
      {index + 1}. {row.manufacturer || "Unknown"}
    </h3>

    <div className="grid grid-cols-2 gap-3">
      <div className="bg-blue-50 rounded-lg p-3 text-center">
        <div className="text-blue-600 text-xs">Products</div>
        <div className="font-bold text-blue-700">{row.total_products}</div>
      </div>

      <div className="bg-emerald-50 rounded-lg p-3 text-center">
        <div className="text-emerald-600 text-xs">Stock Value</div>
        <div className="font-bold text-emerald-700">₹{Number(row.total_stock_value).toFixed(2)}</div>
      </div>

      <div className="col-span-2 bg-purple-50 rounded-lg p-3 text-center">
        <div className="text-purple-600 text-xs">Avg / Product</div>
        <div className="font-semibold text-purple-700">
          ₹{row.total_products > 0 ? (Number(row.total_stock_value) / row.total_products).toFixed(2) : "0.00"}
        </div>
      </div>
    </div>
  </div>
);

/* Loading */
const LoadingBlock = () => <SectionLoader />;

/* Error */
const ErrorBlock = ({ error, retry }) => (
  <div className="text-center py-12">
    <p className="text-rose-600 font-semibold mb-2">{error}</p>
    <button onClick={retry} className="px-6 py-3 bg-indigo-600 text-white rounded-xl">
      Retry
    </button>
  </div>
);

/* Empty */
const EmptyBlock = () => (
  <div className="text-center py-12">
    <Factory className="w-12 h-12 text-gray-400 mx-auto mb-3" />
    <p className="text-gray-500">No manufacturer data available.</p>
  </div>
);

export default StockManufacturerReport;
