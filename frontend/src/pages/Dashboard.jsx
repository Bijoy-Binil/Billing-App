// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import SummaryCard from "../components/SummaryCard";
import BillsTable from "../components/BillsTable";
import StockSummary from "../components/StockSummary";
import { ChartBarIcon, ReceiptTaxIcon, CubeIcon } from "@heroicons/react/solid";

const Dashboard = () => {
  const [bills, setBills] = useState([]);
  const [todayBills, setTodayBills] = useState([]);
  const [salesToday, setSalesToday] = useState(0);
  const [billCountToday, setBillCountToday] = useState(0);
  const [stockProducts, setStockProducts] = useState([]);
  const [mostSold, setMostSold] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  console.log("mostsold==>", mostSold);
  console.log("stockProdcuts==>", stockProducts);
  useEffect(() => {
    fetchAll();
    fetchLowstock();
  }, []);

  // ✅ Fetch all bills
  const fetchAll = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await axios.get("http://127.0.0.1:8000/api/billings/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allBills = res.data.results || res.data;
      setBills(allBills);

      // ✅ Filter only today's bills
      const today = new Date().toISOString().slice(0, 10);
      const todayBills = allBills.filter((b) => b.created_at.startsWith(today));

      // ✅ Calculate today’s total sales and bill count
      const totalSales = todayBills.reduce((sum, bill) => sum + Number(bill.total || 0), 0);

      setTodayBills(todayBills);
      setSalesToday(totalSales);
      setBillCountToday(todayBills.length);

      // ✅ Calculate most sold items (across all bills)
      const productMap = {};
      allBills.forEach((bill) => {
        bill.items.forEach((item) => {
          const name = item.product_name;
          const qty = Number(item.quantity || 0); // correct key name
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

  // ✅ Fetch low stock products
  const fetchLowstock = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await axios.get("http://127.0.0.1:8000/api/products/low-stock/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStockProducts(res.data.results || res.data);
    } catch (error) {
      console.error("Error fetching low stock:", error);
      setStockProducts([]);
    }
  };
  console.log(stockProducts);
  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <div className="max-w-[1400px] mx-auto">
        {/* ✅ Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SummaryCard
            title="Today's Sales"
            value={`₹${salesToday.toFixed(2)}`}
            sub={`${billCountToday} bills`}
            icon={<ChartBarIcon className="w-6 h-6 text-white" />}
          />
          <SummaryCard
            title="Low Stock Items"
            value={stockProducts.length}
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

        {/* ✅ Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BillsTable bills={todayBills} />
          <div className="space-y-4">
            <StockSummary products={stockProducts} />

            <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-2xl">
              <div className="text-white font-semibold mb-3">Most Sold Items (Top 5)</div>
              <ul className="space-y-2">
                {mostSold.length === 0 && <li className="text-gray-400">No sales data</li>}
                {mostSold.slice(0, 5).map((m, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between items-center p-2 rounded-lg bg-gray-900/30 border border-gray-700"
                  >
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
