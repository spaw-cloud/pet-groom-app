import { useEffect, useState } from "react";
import api from "../lib/api";

export default function Bookings() {
  const [services, setServices] = useState([]);
  const [name, setName] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    api.get("/services").then((res) => setServices(res.data));
  }, []);

  const handleBooking = async () => {
    if (!name || !selectedService || !date || !time) {
      alert("Please fill all fields");
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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        
        <h2 className="text-2xl font-bold text-center mb-6">
          🐾 Book Grooming Service
        </h2>

        <input
          className="w-full p-3 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <select
          className="w-full p-3 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-black"
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

        <input
          type="date"
          className="w-full p-3 border rounded-lg mb-3 focus:outline-none"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <input
          type="time"
          className="w-full p-3 border rounded-lg mb-4 focus:outline-none"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />

        <button
          onClick={handleBooking}
          className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
