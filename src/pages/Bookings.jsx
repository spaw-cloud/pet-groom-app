import { useEffect, useState } from "react";
import api from "../lib/api";

export default function Bookings() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get("/services");
        setServices(res.data);
      } catch (err) {
        console.error("Error fetching services:", err);
      }
    };

    fetchServices();
  }, []);

  // Submit booking
  const handleBooking = async () => {
    if (!name || !selectedService || !time) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      await api.post("/bookings", {
        name,
        service: selectedService,
        time,
      });

      alert("Booking confirmed ✅");

      // Reset form
      setName("");
      setSelectedService("");
      setTime("");
    } catch (err) {
      console.error("Booking error:", err);
      alert("Failed to book ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h2>🐾 Book a Grooming Service</h2>

      <input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
      />

      <select
        value={selectedService}
        onChange={(e) => setSelectedService(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
      >
        <option value="">Select Service</option>
        {services.map((s, i) => (
          <option key={i} value={s.name}>
            {s.name} - ₹{s.price}
          </option>
        ))}
      </select>

      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
      />

      <button
        onClick={handleBooking}
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px",
          backgroundColor: "#000",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading ? "Booking..." : "Book Now"}
      </button>
    </div>
  );
}
