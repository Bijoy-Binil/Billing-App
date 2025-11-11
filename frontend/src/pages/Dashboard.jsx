// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import SummaryCard from "../components/SummaryCard";
import BillsTable from "../components/BillsTable";
import StockSummary from "../components/StockSummary";
import { ChartBarIcon, ReceiptTaxIcon, CubeIcon } from "@heroicons/react/solid";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthStatus from "../components/AuthStatus";
import api from "../api";

const Dashboard = () => {
  const [bills, setBills] = useState([]);
  const [todayBills, setTodayBills] = useState([]);
  const [salesToday, setSalesToday] = useState(0);
  const [billCountToday, setBillCountToday] = useState(0);
  const [stockProducts, setStockProducts] = useState([]);
  const [mostSold, setMostSold] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetchAll();
    fetchLowstock();
  }, []);

  const fetchAll = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await api.get("/billings/");
      const allBills = res.data.results || res.data;
      setBills(allBills);

      const today = new Date().toISOString().slice(0, 10);
      const todayBills = allBills.filter((b) => b.created_at.startsWith(today));

      const totalSales = todayBills.reduce((sum, bill) => sum + Number(bill.total || 0), 0);

      setTodayBills(todayBills);
      setSalesToday(totalSales);
      setBillCountToday(todayBills.length);

      const productMap = {};
      allBills.forEach((bill) => {
        bill.items.forEach((item) => {
          const name = item.product_name;
          const qty = Number(item.quantity || 0);
          const totalSale = qty * Number(item.price || 0);
          if (!productMap[name]) {
            productMap[name] = { product: name, total_qty: 0, total_sales: 0 };
          }
          productMap[name].total_qty += qty;
          productMap[name].total_sales += totalSale;
        });
      });

      const sortedProducts = Object.values(productMap).sort((a, b) => b.total_qty - a.total_qty);
      setMostSold(sortedProducts);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching bills:", error);
      setErr("Failed to load bills.");
      setLoading(false);
    }
  };

  const fetchLowstock = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await api.get("/products/");

      const products = res.data.results || res.data;
      const lowStock = products.filter((p) => p.quantity < 10);
      setStockProducts(lowStock);

      if (lowStock.length > 0) {
        const productNames = lowStock
          .slice(0, 5)
          .map((p, idx) => `${idx + 1}. ${p.name}`)
          .join(", ");

        toast.warning(
          `⚠️ ${lowStock.length} items are running low: ${productNames}${
            lowStock.length > 5 ? "..." : ""
          }`,
          { icon: "🚨", theme: "dark" }
        );
      }
    } catch (error) {
      console.error("Error fetching low stock:", error);
      setStockProducts([]);
    }
  };

  return (
<div className="w-full min-h-screen p-6 bg-[#E7F0FF]">
  {/* Header */}
  <div className="mb-6">
    <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
    <p className="text-gray-500 mt-1">Your business insights at a glance</p>
  </div>

  {/* TOP SUMMARY ROW */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

    {/* Today's Sales */}
    <div className="rounded-xl bg-[#e4c99f] border border-[#F5DAB1] p-5 shadow-sm flex justify-between items-start">
      <div>
        <p className="text-gray-700 font-medium">Today's Sales</p>
        <h2 className="text-2xl font-bold text-gray-900 mt-1">
          ₹{salesToday.toFixed(2)}
        </h2>
        <p className="text-sm text-gray-600 mt-1">{billCountToday} bills</p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-[#F4C78A] flex justify-center items-center">
        <ChartBarIcon className="w-6 h-6 text-white" />
      </div>
    </div>

    {/* Low Stock Items */}
    <div className="rounded-xl bg-[#f3c6c1] border border-[#FFBDB8] p-5 shadow-sm flex justify-between items-start">
      <div>
        <p className="text-gray-700 font-medium">Low Stock Items</p>
        <h2 className="text-2xl font-bold text-gray-900 mt-1">
          {stockProducts.length}
        </h2>
        <p className="text-sm text-gray-600 mt-1">Critical stock alerts</p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-[#FFAAA1] flex justify-center items-center">
        <CubeIcon className="w-6 h-6 text-white" />
      </div>
    </div>

    {/* Top Selling */}
    <div className="rounded-xl bg-[#bfeece] border border-[#A2EAB9] p-5 shadow-sm flex justify-between items-start">
      <div>
        <p className="text-gray-700 font-medium">Top Selling</p>
        <h2 className="text-xl font-bold text-gray-900 mt-1 truncate">
          {mostSold.length ? mostSold[0].product : "—"}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {mostSold.length ? `${mostSold[0].total_qty} sold` : "No data"}
        </p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-[#7FDFA1] flex justify-center items-center">
        <ReceiptTaxIcon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>

  {/* MIDDLE ROW */}
  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
    {/* Today's Bills Table */}
    <div className="bg-[#c6d8f1] rounded-2xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🧾</span>
        <h2 className="text-xl font-semibold text-gray-800">
          Today's Bills
        </h2>
        <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full">
          {todayBills.length} bills
        </span>
      </div>

      <BillsTable bills={todayBills} />
    </div>

    {/* RIGHT SIDE */}
    <div className="space-y-6">

      {/* Low Stock Alert */}
      <div className="bg-[#bfc4ca] rounded-2xl border border-[#DCECCD] p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span>⚠️</span>
          <h2 className="text-lg font-semibold text-gray-800">
            Low Stock Alert
          </h2>
          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
            {stockProducts.length} items
          </span>
        </div>

        <div className="max-h-60 overflow-y-auto">
          <StockSummary products={stockProducts} />
        </div>
      </div>

      {/* MOST SOLD ITEMS */}
      <div className="bg-[#d3c5a7] rounded-2xl border border-[#FFC4B6] p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span>🔥</span>
            <h2 className="text-lg font-semibold text-gray-800">Most Sold Items</h2>
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
              Top 3
            </span>
          </div>
          <span className="text-xs text-gray-500">Last 7 days</span>
        </div>

        <div className="space-y-2">
          {mostSold.slice(0, 3).map((p, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center bg-[#d3c5a7] border border-gray-200 rounded-xl p-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{p.product}</p>
                  <p className="text-xs text-gray-500">{p.total_qty} pcs sold</p>
                </div>
              </div>
              <p className="font-semibold text-emerald-600">
                ₹{Number(p.total_sales).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</div>

  );
};

export default Dashboard;