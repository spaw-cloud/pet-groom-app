import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      const res = await api.get("/services");
      setServices(res.data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "#fff", marginBottom: "20px" }}>
        Admin Dashboard
      </h2>

      {loading && (
        <p style={{ color: "#fff" }}>Loading services...</p>
      )}

      {!loading && services.length === 0 && (
        <p style={{ color: "#fff" }}>No bookings found</p>
      )}

      {!loading && services.length > 0 && (
        <div style={{ display: "grid", gap: "15px" }}>
          {services.map((item, index) => (
            <div
              key={index}
              style={{
                background: "#fff",
                padding: "16px",
                borderRadius: "12px",
                boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
              }}
            >
              <h3>{item.name || "No Name"}</h3>
              <p>🐶 Pet: <b>{item.pet || "-"}</b></p>
              <p>📞 Phone: <b>{item.phone || "-"}</b></p>
              <p>🕒 Time: <b>{item.time || "-"}</b></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}