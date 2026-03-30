import { useState } from "react";
import API from "../lib/api";

export default function Bookings() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    pet: "",
    time: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.address) {
      alert("Please fill all required fields ⚠️");
      return;
    }

    try {
      const res = await API.post("/bookings", form);

      if (res.data?.success) {
        alert("Booking confirmed ✅");

        // ✅ WhatsApp auto message
        window.open(
          `https://wa.me/91XXXXXXXXXX?text=New Booking:%0AName:${form.name}%0APhone:${form.phone}%0AAddress:${form.address}%0APet:${form.pet}%0ATime:${form.time}`,
          "_blank"
        );

        // reset form
        setForm({
          name: "",
          phone: "",
          address: "",
          pet: "",
          time: "",
        });
      } else {
        alert("Something went wrong ❌");
      }
    } catch (err) {
      console.error(err);
      alert("Server error ❌");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Book a Grooming Service 🐾</h2>

      <input name="name" placeholder="Name" value={form.name} onChange={handleChange} />
      <br />

      <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
      <br />

      <input name="address" placeholder="Address" value={form.address} onChange={handleChange} />
      <br />

      <input name="pet" placeholder="Pet Breed" value={form.pet} onChange={handleChange} />
      <br />

      <input name="time" placeholder="Preferred Time" value={form.time} onChange={handleChange} />
      <br />

      <button onClick={handleSubmit}>Book Now</button>
    </div>
  );
}
