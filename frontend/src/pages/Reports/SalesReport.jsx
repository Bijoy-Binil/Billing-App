import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const API_SALES = "http://127.0.0.1:8000/api/billings/";

const SalesReport = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get(API_SALES, { headers: { Authorization: `Bearer ${token}` } });
        const data = res.data.results || res.data || [];
        if (mounted) setBills(data);
      } catch (err) {
        console.error("Error fetching bills:", err);
        if (mounted) setBills([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, [token]);

  // Aggregation: produce last 30 days totals (date string key)
  const chartData = useMemo(() => {
    if (!bills.length) return [];
    const map = {};
    const now = new Date();
    const days = 30;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString("en-GB"); // dd/mm/yyyy
      map[key] = 0;
    }

    bills.forEach((b) => {
      const dateStr = new Date(b.created_at).toLocaleDateString("en-GB");
      const total = Number(b.total) || 0;
      if (map.hasOwnProperty(dateStr)) map[dateStr] += total;
    });

    return Object.keys(map).map((k) => ({ date: k, total: Number(map[k].toFixed(2)) }));
  }, [bills]);

  const todayTotal = useMemo(() => {
    const today = new Date().toLocaleDateString("en-GB");
    return bills.reduce((s, b) => (new Date(b.created_at).toLocaleDateString("en-GB") === today ? s + (Number(b.total) || 0) : s), 0);
  }, [bills]);

  const monthTotal = useMemo(() => {
    const curMonth = new Date().getMonth();
    const curYear = new Date().getFullYear();
    return bills.reduce((s, b) => {
      const d = new Date(b.created_at);
      return (d.getMonth() === curMonth && d.getFullYear() === curYear) ? s + (Number(b.total) || 0) : s;
    }, 0);
  }, [bills]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Sales Report</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Today's Sales" value={`₹${todayTotal.toFixed(2)}`} />
        <StatCard title="This Month" value={`₹${monthTotal.toFixed(2)}`} />
        <StatCard title="Total Bills" value={`${bills.length}`} />
      </div>

      <section className="bg-gray-800/60 p-4 rounded-xl border border-gray-700">
        <h2 className="text-lg font-medium text-emerald-400 mb-3">Last 30 days — Daily totals</h2>
        <div style={{ height: 320 }}>
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : chartData.length === 0 ? (
            <div className="text-gray-400">No sales data</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#2d3748" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip formatter={(v) => `₹${v}`} />
                <Line type="monotone" dataKey="total" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="mt-6 bg-gray-800/60 p-4 rounded-xl border border-gray-700">
        <h3 className="text-md font-medium text-emerald-400 mb-3">Recent bills</h3>
        <div className="overflow-x-auto">
          <table className="min-w-[640px] text-left">
            <thead className="text-gray-400 text-sm">
              <tr>
                <th className="py-2">Bill ID</th>
                <th className="py-2">Customer</th>
                <th className="py-2">Total</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {bills.slice(0, 12).map((b) => (
                <tr key={b.id} className="border-t border-gray-700">
                  <td className="py-2 text-sm text-white">{b.bill_id}</td>
                  <td className="py-2 text-sm text-gray-200">{b.customer_name || "Walk-in"}</td>
                  <td className="py-2 text-sm text-emerald-400">₹{Number(b.total).toFixed(2)}</td>
                  <td className="py-2 text-sm text-gray-400">{new Date(b.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400">No bills yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

/* small presentational components */
const StatCard = ({ title, value }) => (
  <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700">
    <div className="text-sm text-gray-400">{title}</div>
    <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
  </div>
);

export default SalesReport;
