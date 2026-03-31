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
    try {
      await API.post("/bookings", form);
      alert("Booking confirmed ✅");
    } catch {
      alert("Error ❌");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>🐾 Book Grooming Service</h2>

        <input name="name" placeholder="Your Name" onChange={handleChange} style={styles.input} />
        <input name="phone" placeholder="Phone Number" onChange={handleChange} style={styles.input} />
        <input name="address" placeholder="Address" onChange={handleChange} style={styles.input} />
        <input name="pet" placeholder="Pet Breed" onChange={handleChange} style={styles.input} />
        <input name="time" placeholder="Preferred Time" onChange={handleChange} style={styles.input} />

        <button onClick={handleSubmit} style={styles.button}>
          Book Now 🚀
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "12px",
    width: "350px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "6px",
    border: "1px solid #ddd",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
