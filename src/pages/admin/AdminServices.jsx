import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      const res = await api.get("/api/services");
      setServices(Array.isArray(res.data) ? res.data : []);
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
    <div style={{ padding: "20px", minHeight: "100vh", background: "#0f172a" }}>
      <h2 style={{ color: "#fff", marginBottom: "20px" }}>Services</h2>

      {loading && <p style={{ color: "#fff" }}>Loading services...</p>}

      {!loading && services.length === 0 && <p style={{ color: "#94a3b8" }}>No services found</p>}

      {!loading && services.length > 0 && (
        <div style={{ display: "grid", gap: "15px" }}>
          {services.map((item) => {
            const id = item.service_id ?? item.id ?? item.name;
            return (
              <div
                key={id}
                style={{
                  background: "#1e293b",
                  color: "#e2e8f0",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #334155",
                }}
              >
                <h3 style={{ margin: "0 0 8px" }}>{item.name || "Service"}</h3>
                <p style={{ margin: "4px 0" }}>
                  Price: <b>₹{item.price ?? "—"}</b>
                </p>
                <p style={{ margin: "4px 0", color: "#94a3b8", fontSize: 14 }}>
                  Duration: {item.duration || "—"}
                </p>
                {item.description && (
                  <p style={{ margin: "8px 0 0", fontSize: 14, color: "#cbd5e1" }}>{item.description}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
