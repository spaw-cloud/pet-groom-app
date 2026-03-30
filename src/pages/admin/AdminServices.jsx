import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get("/api/services"); // ✅ FIXED
      setServices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addService = async () => {
    if (!name || !price) return alert("Fill all fields");

    await api.post("/api/services", {  // ✅ FIXED
      name,
      price: Number(price),
    });

    setName("");
    setPrice("");
    fetchServices();
  };

  const deleteService = async (id) => {
    await api.delete(`/api/services/${id}`); // ✅ FIXED
    fetchServices();
  };

  return (
    <div style={styles.container}>
      <h2>Manage Services</h2>

      <div style={styles.form}>
        <input
          placeholder="Service name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button onClick={addService}>Add</button>
      </div>

      {services.map((s) => (
        <div key={s.id} style={styles.card}>
          <span>{s.name} - ₹{s.price}</span>
          <button onClick={() => deleteService(s.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    color: "#fff",
  },
  form: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },
  card: {
    background: "#1e293b",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
  },
};
