import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);

  const fetchBookings = async () => {
    const res = await api.get("/bookings");
    setBookings(res.data);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const deleteBooking = async (name) => {
    await api.delete(`/bookings/${name}`);
    fetchBookings();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Admin Bookings</h2>

      {bookings.map((b, i) => (
        <div key={i} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
          <p><b>{b.name}</b></p>
          <p>{b.service}</p>
          <p>{b.date} - {b.time}</p>

          <button onClick={() => deleteBooking(b.name)}>Delete</button>

          <a
            href={`https://wa.me/91XXXXXXXXXX?text=Booking confirmed for ${b.service} on ${b.date} at ${b.time}`}
            target="_blank"
          >
            <button>Confirm WhatsApp</button>
          </a>
        </div>
      ))}
    </div>
  );
}
