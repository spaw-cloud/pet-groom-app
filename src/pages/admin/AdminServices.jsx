import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch services from backend
  const fetchServices = async () => {
    try {
      const res = await api.get("/services");
      setServices(res.data);
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

      {loading ? (
        <p style={{ color: "#fff" }}>Loading services...</p>
      ) : services.length === 0 ? (
        <p style={{ color: "#fff" }}>No bookings found</p>
      ) : (
        <div style={{ display: "grid", gap: "15px" }}>
          {services.map((item, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                padding: "15px",
                borderRadius: "12px",
                boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
                transition: "0.2s",
              }}
            >
              <h3 style={{ margin: 0 }}>{item.name}</h3>
              <p style={{ margin: "5px 0" }}>
                🐶 Pet: <b>{item.pet}</b>
              </p>
              <p style={{ margin: "5px 0" }}>
                📞 Phone: <b>{item.phone}</b>
              </p>
              <p style={{ margin: "5px 0" }}>
                🕒 Time: <b>{item.time}</b>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
