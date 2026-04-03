import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/admin/dashboard");
        if (!cancelled) setStats(res.data);
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.detail || "Failed to load dashboard");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-6 text-white min-h-screen bg-gray-900">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      {err && <p className="text-red-400 mb-4">{err}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gray-800 p-5 rounded-2xl shadow">
          <h2 className="text-lg text-gray-300">Total Bookings</h2>
          <p className="text-2xl font-bold mt-2">{stats?.total_bookings ?? "—"}</p>
        </div>
        <div className="bg-gray-800 p-5 rounded-2xl shadow">
          <h2 className="text-lg text-gray-300">Customers</h2>
          <p className="text-2xl font-bold mt-2">{stats?.total_customers ?? "—"}</p>
        </div>
        <div className="bg-gray-800 p-5 rounded-2xl shadow">
          <h2 className="text-lg text-gray-300">Services</h2>
          <p className="text-2xl font-bold mt-2">{stats?.total_services ?? "—"}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Link to="/admin/services" className="text-violet-400 underline">
          Manage services
        </Link>
        <Link to="/admin/bookings" className="text-violet-400 underline">
          View bookings
        </Link>
        <Link to="/admin/customers" className="text-violet-400 underline">
          Customers
        </Link>
        <Link to="/admin/availability" className="text-violet-400 underline">
          Availability
        </Link>
      </div>
    </div>
  );
}
