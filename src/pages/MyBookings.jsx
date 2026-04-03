import { useEffect, useState } from "react";
import api from "../lib/api";

export default function MyBookings() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/bookings");
        if (!cancelled) setRows(res.data || []);
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.detail || "Could not load bookings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ flex: 1, padding: 24, color: "#fff" }}>
        <div className="spinner" style={{ margin: "48px auto" }} />
      </div>
    );
  }

  if (err) {
    return (
      <div style={{ flex: 1, padding: 24, color: "#f87171" }}>
        {err}
      </div>
    );
  }

  return (
    <div data-testid="my-bookings-page" style={{ flex: 1, background: "#0f172a", padding: 20, overflow: "auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20, fontFamily: "'Playfair Display', serif" }}>My Bookings</h1>
      {rows.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>No bookings yet. Browse services to book.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map((b) => (
            <div key={b.booking_id || b.id} className="card">
              <p style={{ color: "#fff", fontWeight: 700 }}>{b.service_name || "Service"}</p>
              <p style={{ color: "#94a3b8", fontSize: 14 }}>
                {b.date} {b.time} · {b.pet_name || "Pet"}
              </p>
              <p style={{ color: "#64748b", fontSize: 13 }}>{b.status || "pending"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
