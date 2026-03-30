import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const fetchServices = async () => {
    try {
      const res = await api.get("/services");
      setServices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const addService = async () => {
    if (!name || !price) return;

    try {
      await api.post("/services", { name, price });
      setName("");
      setPrice("");
      fetchServices();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteService = async (name) => {
    try {
      await api.delete(`/services/${name}`);
      fetchServices();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Admin Services</h2>

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

      <ul>
        {services.map((s, i) => (
          <li key={i}>
            {s.name} - ₹{s.price}
            <button onClick={() => deleteService(s.name)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
