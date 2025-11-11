import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Package, Download, RefreshCw, BarChart3 } from "lucide-react";

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
      const res = await axios.get(
        "http://127.0.0.1:8000/api/reports/stock-statement/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res.data);
    } catch (error) {
      console.error("Error fetching stock statement:", error);
      setError("Failed to load stock statement data");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Product", "Opening Stock", "Sold", "Closing Stock"];
    const csvRows = data.map((r) => [
      r.product, r.opening_stock, r.total_sold, r.closing_stock
    ]);

    const csvContent =
      headers.join(",") + "\n" + csvRows.map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "stock-statement.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ✅ Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Stock Statement Report
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Complete inventory movement and analysis
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              disabled={data.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl shadow-lg flex items-center gap-2 font-semibold transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>

            <button
              onClick={fetchStockStatement}
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

        {/* ✅ Stats Cards */}
        {data.length > 0 && (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard 
              title="Total Products" 
              value={data.length} 
              gradient="from-blue-500 to-blue-600"
              icon="📦"
            />
            <KpiCard
              title="Total Sold"
              value={data.reduce((s, r) => s + (r.total_sold || 0), 0)}
              gradient="from-amber-400 to-orange-400"
              icon="💰"
            />
            <KpiCard
              title="Avg Opening"
              value={Math.round(
                data.reduce((s, r) => s + (r.opening_stock || 0), 0) /
                  data.length
              )}
              gradient="from-emerald-400 to-green-400"
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

        {/* ✅ Table Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-2xl shadow-lg p-6"
        >
          {loading ? (
            <LoadingView />
          ) : error ? (
            <ErrorView retry={fetchStockStatement} message={error} />
          ) : data.length === 0 ? (
            <EmptyView />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto rounded-xl border border-blue-200 shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr className="text-left">
                      <th className="py-4 px-4 font-bold text-gray-700 uppercase tracking-wide text-xs">#</th>
                      <th className="py-4 px-4 font-bold text-gray-700 uppercase tracking-wide text-xs">Product</th>
                      <th className="py-4 px-4 font-bold text-gray-700 uppercase tracking-wide text-xs text-center">Opening Stock</th>
                      <th className="py-4 px-4 font-bold text-gray-700 uppercase tracking-wide text-xs text-center">Sold</th>
                      <th className="py-4 px-4 font-bold text-gray-700 uppercase tracking-wide text-xs text-center">Closing Stock</th>
                      <th className="py-4 px-4 font-bold text-gray-700 uppercase tracking-wide text-xs text-center">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-blue-100">
                    {data.map((r, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-blue-50 transition-colors duration-200"
                      >
                        <td className="py-4 px-4 font-medium text-gray-900">{idx + 1}</td>
                        <td className="py-4 px-4 font-semibold text-gray-900">{r.product}</td>
                        <td className="py-4 px-4 text-center text-gray-700">
                          {r.opening_stock}
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-amber-600">
                          {r.total_sold}
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-emerald-600">
                          {r.closing_stock}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <StatusChip value={r.closing_stock} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4">
                {data.map((r, idx) => (
                  <MobileCard key={idx} row={r} index={idx} />
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

/* ✅ Components */

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
      <div className="text-2xl">{icon}</div>
    </div>
  </motion.div>
);

const StatusChip = ({ value }) => {
  if (value > 10)
    return (
      <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-400 to-green-400 text-white border border-emerald-500">
        Good
      </span>
    );
  if (value > 0)
    return (
      <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-400 to-orange-400 text-white border border-amber-500">
        Low
      </span>
    );
  return (
    <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-rose-500 to-pink-500 text-white border border-rose-500">
      Out
    </span>
  );
};

const LoadingView = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-gray-600 text-sm mt-4">Loading stock statement...</p>
  </div>
);

const ErrorView = ({ message, retry }) => (
  <div className="text-center py-16">
    <div className="w-16 h-16 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
      <Package className="w-8 h-8 text-white" />
    </div>
    <p className="text-rose-600 font-semibold mb-4">{message}</p>
    <button
      onClick={retry}
      className="px-6 py-3 bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl shadow-lg transition-all font-semibold"
    >
      Try Again
    </button>
  </div>
);

const EmptyView = () => (
  <div className="text-center py-16">
    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-600 mb-2">
      No Stock Data Found
    </h3>
    <p className="text-gray-500 text-sm">
      Data will appear once products & sales exist.
    </p>
  </div>
);

const MobileCard = ({ row, index }) => (
  <div className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm">
    <div className="flex justify-between items-start mb-3">
      <h3 className="font-semibold text-gray-900 text-base">
        {index + 1}. {row.product}
      </h3>
      <StatusChip value={row.closing_stock} />
    </div>
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="text-center bg-blue-50 rounded-lg p-2">
        <div className="text-gray-600 text-xs">Opening</div>
        <div className="font-semibold text-gray-900">{row.opening_stock}</div>
      </div>
      <div className="text-center bg-amber-50 rounded-lg p-2">
        <div className="text-amber-600 text-xs">Sold</div>
        <div className="font-bold text-amber-700">{row.total_sold}</div>
      </div>
      <div className="text-center bg-emerald-50 rounded-lg p-2">
        <div className="text-emerald-600 text-xs">Closing</div>
        <div className="font-bold text-emerald-700">{row.closing_stock}</div>
      </div>
      <div className="text-center bg-purple-50 rounded-lg p-2">
        <div className="text-purple-600 text-xs">Change</div>
        <div className="font-semibold text-purple-700">
          {row.opening_stock - row.closing_stock}
        </div>
      </div>
    </div>
  </div>
);

export default StockStatementReport;