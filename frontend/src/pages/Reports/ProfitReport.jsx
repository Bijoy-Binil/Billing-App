import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const API_SALES = "http://127.0.0.1:8000/api/billings/";
const API_PRODUCTS = "http://127.0.0.1:8000/api/products/";

const ProfitReport = () => {
  const [bills, setBills] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [bRes, pRes] = await Promise.all([
          axios.get(API_SALES, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(API_PRODUCTS, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (mounted) {
          setBills(bRes.data.results || bRes.data || []);
          setProducts(pRes.data.results || pRes.data || []);
        }
      } catch (err) {
        console.error("Error fetching profit data:", err);
        if (mounted) { setBills([]); setProducts([]); }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAll();
    return () => (mounted = false);
  }, [token]);

  // products map id -> cost_price (fallback undefined)
  const productMap = useMemo(() => {
    const m = {};
    products.forEach((p) => {
      m[p.id] = { cost_price: Number(p.cost_price || p.cost || 0), name: p.name };
    });
    return m;
  }, [products]);

  // compute profit per bill and aggregate daily/monthly
  const { dailyProfit, monthlyProfit, totalProfit, chartData } = useMemo(() => {
    const daily = {};
    const monthly = {};
    let total = 0;

    const cd = []; // chart points per date

    bills.forEach((b) => {
      const date = new Date(b.created_at);
      const dateKey = date.toLocaleDateString("en-GB"); // dd/mm/yyyy
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      // compute bill profit by summing items:
      let billProfit = 0;
      (b.items || []).forEach((it) => {
        const qty = Number(it.quantity ?? it.qty ?? 0);
        const price = Number(it.price || 0);

        // If item has nested product object, try grab cost from there
        let cost = 0;
        if (typeof it.product === "object" && it.product !== null) {
          cost = Number(it.product.cost_price || it.product.cost || 0);
        } else {
          // try lookup from productMap by id
          cost = Number(productMap[it.product]?.cost_price || 0);
        }

        if (!cost) {
          // fallback: assume 20% margin if cost unknown
          cost = price * 0.8;
        }

        billProfit += qty * (price - cost);
      });

      // accumulate
      total += billProfit;
      daily[dateKey] = (daily[dateKey] || 0) + billProfit;
      monthly[monthKey] = (monthly[monthKey] || 0) + billProfit;
    });

    // build chartData sorted by date (daily)
    const keys = Object.keys(daily).sort((a, b) => new Date(a) - new Date(b));
    keys.forEach((k) => cd.push({ date: k, profit: Number(daily[k].toFixed(2)) }));

    return {
      dailyProfit: daily,
      monthlyProfit: monthly,
      totalProfit: total,
      chartData: cd,
    };
  }, [bills, productMap]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Profit Report</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Profit" value={`₹${Number(totalProfit || 0).toFixed(2)}`} />
        <StatCard title="Today's Profit" value={`₹${Number(Object.values(dailyProfit || {}).reduce((s, v) => s + (v || 0), 0)).toFixed(2)}`} />
        <StatCard title="Months tracked" value={Object.keys(monthlyProfit || {}).length} />
      </div>

      <section className="bg-gray-800/60 p-4 rounded-xl border border-gray-700 mb-6">
        <h2 className="text-lg font-medium text-emerald-400 mb-3">Daily Profit (recent days)</h2>
        <div style={{ height: 340 }}>
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : chartData.length === 0 ? (
            <div className="text-gray-400">No profit data</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid stroke="#2d3748" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip formatter={(v) => `₹${Number(v).toFixed(2)}`} />
                <Area type="monotone" dataKey="profit" stroke="#F59E0B" fill="#FBBF24" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="bg-gray-800/60 p-4 rounded-xl border border-gray-700">
        <h3 className="text-md font-medium text-emerald-400 mb-3">Monthly Profit Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-[640px]">
            <thead className="text-gray-400 text-sm">
              <tr>
                <th className="py-2">Month</th>
                <th className="py-2">Profit</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(monthlyProfit).length === 0 && (
                <tr><td colSpan={2} className="py-6 text-center text-gray-400">No data</td></tr>
              )}
              {Object.entries(monthlyProfit).sort((a,b)=>a[0].localeCompare(b[0])).map(([m, val]) => (
                <tr key={m} className="border-t border-gray-700">
                  <td className="py-2 text-sm text-white">{m}</td>
                  <td className="py-2 text-sm text-emerald-400">₹{Number(val || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700">
    <div className="text-sm text-gray-400">{title}</div>
    <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
  </div>
);

export default ProfitReport;
