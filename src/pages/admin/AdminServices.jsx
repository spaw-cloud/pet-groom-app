import { useEffect, useState } from "react";
import API from "../../lib/api";

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  // ✅ Fetch services (TEMP: using bookings until you create services API)
  const fetchServices = async () => {
    try {
      const res = await API.get("/bookings"); // ⚠️ changed from /services
      setServices(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch data ❌");
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // ✅ Dummy add (until backend /services exists)
  const handleAdd = () => {
    alert("Add service API not created yet ⚠️");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Admin Services</h2>

      <input
        placeholder="Service Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <br />

      <input
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <br />

      <button onClick={handleAdd}>Add Service</button>

      <h3 style={{ marginTop: "20px" }}>Data (from backend)</h3>

      {services.length === 0 ? (
        <p>No data found</p>
      ) : (
        services.map((item, index) => (
          <div key={index} style={{ border: "1px solid gray", margin: "10px", padding: "10px" }}>
            <p><b>Name:</b> {item.name}</p>
            <p><b>Phone:</b> {item.phone}</p>
            <p><b>Pet:</b> {item.pet}</p>
            <p><b>Time:</b> {item.time}</p>
          </div>
        ))
      )}
    </div>
  );
}
