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
    const res = await api.get("/services");
    setServices(res.data);
  };

  const addService = async () => {
    if (!name || !price) return alert("Fill all fields");

    await api.post("/services", {
      name,
      price: Number(price),
    });

    setName("");
    setPrice("");
    fetchServices();
  };

  const deleteService = async (id) => {
    await api.delete(`/services/${id}`);
    fetchServices();
  };

  return (
    <div style={styles.container}>
      <h2>Manage Services</h2>

      {/* ADD FORM */}
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

      {/* LIST */}
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
