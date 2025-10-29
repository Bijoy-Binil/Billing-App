// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import api from "../api";
import SummaryCard from "../components/SummaryCard";
import BillsTable from "../components/BillsTable";
import StockSummary from "../components/StockSummary";
import {
  ChartBarIcon,
  ReceiptTaxIcon,
  CubeIcon,
} from "@heroicons/react/solid"; // optional: install @heroicons/react
import axios from "axios";

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
const fetchAll = async () => {
    const token = localStorage.getItem("accessToken")
  try {
    const res = await axios.get("http://127.0.0.1:8000/api/billings/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("res==>",res.data.results)

    setBills(res.data.results);
  } catch (error) {
    console.error("Error fetching bills:", error);
    setBills([]); // fallback safe
  }
};


    fetchAll();
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <div className="max-w-[1400px] mx-auto">
        {/* header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Dashboard</h2>
            <p className="text-gray-400 text-sm">Overview of sales, billing & stock</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-400">Welcome, {localStorage.getItem("username") || "Cashier"}</div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00FF88]/30 to-[#00BFFF]/20 flex items-center justify-center text-black font-bold">U</div>
          </div>
        </header>

        {/* summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SummaryCard
            title="Today's Sales"
            value={`₹${salesToday.toFixed(2)}`}
            sub={`${billCountToday} bills`}
            icon={<ChartBarIcon className="w-6 h-6 text-white" />}
          />
          <SummaryCard
            title="Low Stock Items"
            value={stockProducts.filter(p => p.quantity <= 5).length}
            sub="Critical stock alerts"
            icon={<CubeIcon className="w-6 h-6 text-white" />}
          />
          <SummaryCard
            title="Top Selling"
            value={mostSold.length ? `${mostSold[0].product}` : "—"}
            sub={mostSold.length ? `${mostSold[0].total_qty} sold` : "No data"}
            icon={<ReceiptTaxIcon className="w-6 h-6 text-white" />}
          />
        </div>

        {/* main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <BillsTable bills={todayBills} />
          </div>

          <div className="space-y-4">
            <StockSummary products={stockProducts} />

            <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-2xl">
              <div className="text-white font-semibold mb-3">Most Sold Items (Top 5)</div>
              <ul className="space-y-2">
                {mostSold.length === 0 && (
                  <li className="text-gray-400">No sales data</li>
                )}
                {mostSold.slice(0, 5).map((m, idx) => (
                  <li key={idx} className="flex justify-between items-center p-2 rounded-lg bg-gray-900/30 border border-gray-700">
                    <div>
                      <div className="text-sm font-medium text-gray-100">{m.product}</div>
                      <div className="text-xs text-gray-400">{m.total_qty} pcs sold</div>
                    </div>
                    <div className="text-emerald-400 font-semibold">₹{Number(m.total_sales || 0).toFixed(2)}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {loading && <div className="mt-6 text-gray-400">Loading...</div>}
        {err && <div className="mt-6 text-red-400">{err}</div>}
      </div>
    </div>
  );
};

export default Dashboard;
