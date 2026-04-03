import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetchBookings = async () => {
    try {
      const res = await api.get("/api/admin/bookings");
      setBookings(Array.isArray(res.data) ? res.data : []);
      setErr("");
    } catch (e) {
      setErr(e.response?.data?.detail || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const deleteBooking = async (id) => {
    try {
      await api.delete(`/api/admin/bookings/${id}`);
      fetchBookings();
    } catch (e) {
      alert(e.response?.data?.detail || "Delete failed");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, color: "#fff" }}>
        <div className="spinner" style={{ margin: "40px auto" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", color: "#fff", minHeight: "100vh", background: "#0f172a" }}>
      <h2 style={{ marginBottom: 16 }}>Admin Bookings</h2>
      {err && <p style={{ color: "#f87171" }}>{err}</p>}
      {bookings.map((b) => {
        const id = b.booking_id || b.id;
        const phone = b.customer_phone || b.phone || "";
        return (
          <div
            key={id}
            style={{
              border: "1px solid #334155",
              margin: "10px 0",
              padding: 16,
              borderRadius: 12,
              background: "#1e293b",
            }}
          >
            <p>
              <b>{b.name || "Customer"}</b> {phone && `· ${phone}`}
            </p>
            <p style={{ color: "#94a3b8", fontSize: 14 }}>
              {b.service_name || "Service"} · {b.pet_name || b.pet || ""}
            </p>
            <p>
              {b.date} {b.time}
            </p>
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => deleteBooking(id)}
                style={{
                  padding: "8px 12px",
                  background: "#b91c1c",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
              {phone && (
                <a
                  href={`https://wa.me/91${phone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                    `Booking: ${b.service_name || ""} on ${b.date} at ${b.time}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "8px 12px",
                    background: "#15803d",
                    borderRadius: 8,
                    color: "#fff",
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        );
      })}
      {bookings.length === 0 && !err && <p style={{ color: "#94a3b8" }}>No bookings yet.</p>}
    </div>
  );
}
