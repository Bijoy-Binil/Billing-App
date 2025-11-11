import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Factory, Download, RefreshCw, Building, FileText } from "lucide-react";

/* ✅ PDF Export Helper */
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
    r.total_products > 0
      ? (Number(r.total_stock_value) / r.total_products).toFixed(2)
      : "0.00",
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

/* ✅ CSV Export Helper */
const exportCSV = (data) => {
  if (!data.length) return;

  const headers = [
    "Manufacturer",
    "Total Products",
    "Total Stock Value (₹)",
    "Avg Value Per Product (₹)",
  ];

  const rows = data.map((r) => [
    r.manufacturer || "Unknown",
    r.total_products,
    Number(r.total_stock_value).toFixed(2),
    r.total_products > 0
      ? (Number(r.total_stock_value) / r.total_products).toFixed(2)
      : "0.00",
  ]);

  const csv =
    headers.join(",") + "\n" + rows.map((row) => row.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "manufacturer-stock-report.csv";
  a.click();

  URL.revokeObjectURL(url);
};

const StockManufacturerReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchManufacturerReport();
  }, []);

  const fetchManufacturerReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      const res = await axios.get(
        "http://127.0.0.1:8000/api/reports/manufacturer/",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setData(res.data);
    } catch (err) {
      setError("Failed to load manufacturer data");
    } finally {
      setLoading(false);
    }
  };

  const summaryStats = {
    totalManufacturers: data.length,
    totalProducts: data.reduce((sum, r) => sum + (r.total_products || 0), 0),
    totalStockValue: data.reduce(
      (sum, r) => sum + Number(r.total_stock_value || 0),
      0
    ),
    avgProductsPerManufacturer:
      data.length > 0
        ? Math.round(
            data.reduce((s, r) => s + (r.total_products || 0), 0) / data.length
          )
        : 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {/* ✅ Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg">
              <Factory className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Manufacturer Stock Report
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">
                Stock grouped by manufacturer & product value
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => exportCSV(data)}
              disabled={!data.length}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 text-xs sm:text-sm"
            >
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" /> CSV
            </button>

            <button
              onClick={() => exportPDF(data)}
              disabled={!data.length}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 text-xs sm:text-sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" /> PDF
            </button>

            <button
              onClick={fetchManufacturerReport}
              disabled={loading}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg sm:rounded-xl border shadow-sm flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* ✅ Summary Cards */}
        {data.length > 0 && (
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
        )}

        {/* ✅ Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
        >
          {loading ? (
            <LoadingBlock />
          ) : error ? (
            <ErrorBlock error={error} retry={fetchManufacturerReport} />
          ) : !data.length ? (
            <EmptyBlock />
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden lg:block overflow-x-auto rounded-lg sm:rounded-xl border border-blue-200 shadow-sm">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 sm:py-4 font-bold text-xs">#</th>
                      <th className="px-3 sm:px-4 py-3 sm:py-4 font-bold text-xs">Manufacturer</th>
                      <th className="px-3 sm:px-4 py-3 sm:py-4 text-center font-bold text-xs">Products</th>
                      <th className="px-3 sm:px-4 py-3 sm:py-4 text-center font-bold text-xs">Stock Value (₹)</th>
                      <th className="px-3 sm:px-4 py-3 sm:py-4 text-center font-bold text-xs">Avg / Product</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-blue-100">
                    {data.map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50">
                        <td className="px-3 sm:px-4 py-3 sm:py-4 font-medium">{i + 1}</td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 font-semibold">
                          {row.manufacturer || "Unknown"}
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">
                          <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-xs">
                            {row.total_products}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-center font-bold text-emerald-600 text-sm sm:text-base">
                          ₹{Number(row.total_stock_value).toFixed(2)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-center font-semibold text-purple-600 text-sm">
                          ₹
                          {row.total_products > 0
                            ? (
                                Number(row.total_stock_value) /
                                row.total_products
                              ).toFixed(2)
                            : "0.00"}
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

/* ✅ KPI Card */
const KpiCard = ({ title, value, gradient, icon }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`bg-gradient-to-r ${gradient} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg text-white`}
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

/* ✅ Mobile Card */
const MobileCard = ({ row, index }) => (
  <div className="bg-white border shadow rounded-xl sm:rounded-2xl p-4 sm:p-5">
    <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-3">
      {index + 1}. {row.manufacturer || "Unknown"}
    </h3>

    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <div className="p-2 sm:p-3 bg-blue-50 rounded-lg text-center">
        <div className="text-blue-600 text-xs">Products</div>
        <div className="font-bold text-blue-700 text-sm sm:text-lg">{row.total_products}</div>
      </div>

      <div className="p-2 sm:p-3 bg-emerald-50 rounded-lg text-center">
        <div className="text-emerald-600 text-xs">Stock Value</div>
        <div className="font-bold text-emerald-700 text-sm sm:text-lg">
          ₹{Number(row.total_stock_value).toFixed(2)}
        </div>
      </div>

      <div className="col-span-2 p-2 sm:p-3 bg-purple-50 rounded-lg text-center">
        <div className="text-purple-600 text-xs">Avg / Product</div>
        <div className="font-semibold text-purple-700 text-sm">
          ₹
          {row.total_products > 0
            ? (Number(row.total_stock_value) / row.total_products).toFixed(2)
            : "0.00"}
        </div>
      </div>
    </div>
  </div>
);

/* ✅ Loading */
const LoadingBlock = () => (
  <div className="py-12 sm:py-16 flex justify-center">
    <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

/* ✅ Error */
const ErrorBlock = ({ error, retry }) => (
  <div className="py-12 sm:py-16 text-center">
    <p className="text-rose-600 font-semibold mb-3 text-sm sm:text-base">{error}</p>
    <button
      onClick={retry}
      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 text-white rounded-lg sm:rounded-xl shadow hover:bg-indigo-700 text-sm sm:text-base"
    >
      Retry
    </button>
  </div>
);

/* ✅ Empty */
const EmptyBlock = () => (
  <div className="text-center py-12 sm:py-16">
    <Factory className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
    <p className="text-gray-500 text-sm sm:text-base">No manufacturer data available.</p>
  </div>
);

export default StockManufacturerReport;