import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Factory, Download, RefreshCw, Building } from "lucide-react";

const StockManufacturerReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchManufacturerReport();
  }, []);

  const fetchManufacturerReport = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await axios.get(
        "http://127.0.0.1:8000/api/reports/manufacturer/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res.data);
    } catch (error) {
      console.error("Error fetching manufacturer report:", error);
      setError("Failed to load manufacturer data");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Manufacturer", "Total Products", "Total Stock Value ( ₹)"];
    const csvData = data.map((row) => [
      row.manufacturer || "Unknown",
      row.total_products,
      Number(row.total_stock_value).toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "manufacturer-stock-report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const summaryStats = {
    totalManufacturers: data.length,
    totalProducts: data.reduce((sum, row) => sum + (row.total_products || 0), 0),
    totalStockValue: data.reduce(
      (sum, row) => sum + (Number(row.total_stock_value) || 0),
      0
    ),
    avgProductsPerManufacturer:
      data.length > 0
        ? Math.round(
            data.reduce((sum, row) => sum + (row.total_products || 0), 0) /
              data.length
          )
        : 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg">
              <Factory className="w-6 h-6 text-white" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Manufacturer Stock Report
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Stock grouped by manufacturer & product value
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              disabled={data.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl shadow-lg flex items-center gap-2 font-semibold transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            <button
              onClick={fetchManufacturerReport}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl border border-gray-300 shadow-sm transition-all font-medium flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* SUMMARY CARDS */}
        {data.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <KpiCard
              title="Manufacturers"
              value={summaryStats.totalManufacturers}
              gradient="from-purple-500 to-purple-600"
              icon={<Building className="w-6 h-6 text-white" />}
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
              value={` ₹${summaryStats.totalStockValue.toFixed(2)}`}
              gradient="from-emerald-400 to-green-400"
              icon="💰"
            />
          </motion.div>
        )}

        {/* MAIN TABLE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-2xl shadow-lg p-6"
        >
          {loading ? (
            <LoadingBlock />
          ) : error ? (
            <ErrorBlock error={error} retry={fetchManufacturerReport} />
          ) : data.length === 0 ? (
            <EmptyBlock />
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto rounded-xl border border-blue-200 shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="py-4 px-4 font-bold text-gray-700 uppercase tracking-wide text-xs">#</th>
                      <th className="py-4 px-4 font-bold text-gray-700 uppercase tracking-wide text-xs">Manufacturer</th>
                      <th className="py-4 px-4 font-bold text-gray-700 uppercase tracking-wide text-xs text-center">Products</th>
                      <th className="py-4 px-4 font-bold text-gray-700 uppercase tracking-wide text-xs text-center">Stock Value ( ₹)</th>
                      <th className="py-4 px-4 font-bold text-gray-700 uppercase tracking-wide text-xs text-center">
                        Avg Value / Product
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-blue-100">
                    {data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 transition-colors duration-200">
                        <td className="py-4 px-4 font-medium text-gray-900">{idx + 1}</td>
                        <td className="py-4 px-4 font-semibold text-gray-900">
                          {row.manufacturer || "Unknown Manufacturer"}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-blue-200">
                            {row.total_products}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-emerald-600 text-lg">
                           ₹{Number(row.total_stock_value).toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-center font-semibold text-purple-600">
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

              {/* MOBILE CARDS */}
              <div className="lg:hidden space-y-4">
                {data.map((row, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-sm">
                        <Factory className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {idx + 1}. {row.manufacturer || "Unknown Manufacturer"}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="text-center bg-blue-50 rounded-lg p-3">
                        <div className="text-blue-600 text-xs font-medium">Products</div>
                        <div className="font-bold text-blue-700 text-lg">{row.total_products}</div>
                      </div>
                      <div className="text-center bg-emerald-50 rounded-lg p-3">
                        <div className="text-emerald-600 text-xs font-medium">Value</div>
                        <div className="font-bold text-emerald-700 text-lg"> ₹{Number(row.total_stock_value).toFixed(2)}</div>
                      </div>
                      <div className="text-center bg-purple-50 rounded-lg p-3 col-span-2">
                        <div className="text-purple-600 text-xs font-medium">Avg per Product</div>
                        <div className="font-bold text-purple-700">
                           ₹{row.total_products > 0 ? (Number(row.total_stock_value) / row.total_products).toFixed(2) : "0.00"}
                        </div>
                      </div>
                    </div>
                  </motion.div>
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
    whileHover={{ scale: 1.02, y: -2 }}
    className={`bg-gradient-to-r ${gradient} rounded-2xl p-6 shadow-lg text-white`}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium opacity-90">{title}</div>
        <div className="text-2xl font-bold mt-2">{value}</div>
      </div>
      <div className="text-white">
        {typeof icon === 'string' ? <span className="text-2xl">{icon}</span> : icon}
      </div>
    </div>
  </motion.div>
);

/* ✅ Loading Block */
const LoadingBlock = () => (
  <div className="py-16 flex justify-center">
    <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

/* ✅ Error Block */
const ErrorBlock = ({ error, retry }) => (
  <div className="text-center py-16">
    <div className="w-16 h-16 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
      <Factory className="w-8 h-8 text-white" />
    </div>
    <p className="text-rose-600 font-medium mb-4">{error}</p>
    <button
      onClick={retry}
      className="px-6 py-3 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl shadow-lg transition-all font-semibold"
    >
      Try Again
    </button>
  </div>
);

/* ✅ Empty Data Block */
const EmptyBlock = () => (
  <div className="text-center py-16">
    <Factory className="w-16 h-16 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Manufacturer Data Available</h3>
    <p className="text-gray-500 text-sm">Manufacturer data will appear once products are added with manufacturer information</p>
  </div>
);

export default StockManufacturerReport;