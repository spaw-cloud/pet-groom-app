import { useEffect, useState } from "react";
import API from "../../lib/api";

export default function AdminServices() {
  const [services, setServices] = useState([]);

  // ✅ Fetch data safely
  const fetchData = async () => {
    try {
      const res = await API.get("/bookings");

      if (Array.isArray(res.data)) {
        setServices(res.data);
      } else {
        setServices([]);
      }
    } catch (err) {
      console.error(err);
      setServices([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Admin Dashboard</h2>

      {Array.isArray(services) && services.length > 0 ? (
        services.map((item, index) => (
          <div
            key={index}
            style={{
              border: "1px solid gray",
              margin: "10px",
              padding: "10px",
            }}
          >
            <p><b>Name:</b> {item.name || "N/A"}</p>
            <p><b>Phone:</b> {item.phone || "N/A"}</p>
            <p><b>Address:</b> {item.address || "N/A"}</p>
            <p><b>Pet:</b> {item.pet || "N/A"}</p>
            <p><b>Time:</b> {item.time || "N/A"}</p>
          </div>
        ))
      ) : (
        <p>No bookings found</p>
      )}
    </div>
  );
}
