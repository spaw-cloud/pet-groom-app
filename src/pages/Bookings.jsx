import { useEffect, useState } from "react";
import api from "../lib/api";

export default function Bookings() {
  const [services, setServices] = useState([]);
  const [name, setName] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      const res = await api.get("/services");
      setServices(res.data);
    };
    fetchServices();
  }, []);

  const handleBooking = async () => {
    if (!name || !selectedService || !date || !time) {
      alert("Fill all fields");
      return;
    }

    const res = await api.post("/bookings", {
      name,
      service: selectedService,
      date,
      time,
    });

    if (res.data.error) {
      alert(res.data.error);
      return;
    }

    alert("Booking confirmed ✅");

    setName("");
    setSelectedService("");
    setDate("");
    setTime("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🐾 Book Service</h2>

      <input
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <br /><br />

      <select
        value={selectedService}
        onChange={(e) => setSelectedService(e.target.value)}
      >
        <option value="">Select Service</option>
        {services.map((s, i) => (
          <option key={i} value={s.name}>
            {s.name} - ₹{s.price}
          </option>
        ))}
      </select>

      <br /><br />

      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      <br /><br />

      <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />

      <br /><br />

      <button onClick={handleBooking}>Book Now</button>

      <br /><br />

      {/* WhatsApp Button */}
      <a
        href={`https://wa.me/91XXXXXXXXXX?text=Hi, I booked ${selectedService} on ${date} at ${time}`}
        target="_blank"
      >
        <button>Confirm on WhatsApp</button>
      </a>
    </div>
  );
}
