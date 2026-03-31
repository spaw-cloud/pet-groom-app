import { useEffect, useState } from "react";
import API from "../../lib/api";
import toast from "react-hot-toast";

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  // 🔄 Fetch services
  const fetchServices = async () => {
    try {
      const res = await API.get("/services");
      setServices(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load services ❌");
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // ➕ Add service
  const addService = async () => {
    if (!name || !price) {
      return toast.error("Enter name and price");
    }

    try {
      await API.post("/services", { name, price });
      toast.success("Service added ✅");

      setName("");
      setPrice("");
      fetchServices();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add service ❌");
    }
  };

  // ❌ Delete service
  const deleteService = async (id) => {
    try {
      await API.delete(`/services/${id}`);
      toast.success("Deleted ✅");
      fetchServices();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed ❌");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <h2 className="text-2xl font-bold mb-6">Admin Services</h2>

      {/* ➕ Add Service */}
      <div className="bg-white text-black p-4 rounded-lg mb-6 shadow">
        <h3 className="font-semibold mb-3">Add Service</h3>

        <input
          placeholder="Service Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 mr-2 rounded"
        />

        <input
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border p-2 mr-2 rounded"
        />

        <button
          onClick={addService}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>

      {/* 📋 Service List */}
      <div className="grid gap-4">
        {services.length === 0 ? (
          <p>No services found</p>
        ) : (
          services.map((s) => (
            <div
              key={s.id}
              className="bg-white text-black p-4 rounded shadow flex justify-between items-center"
            >
              <div>
                <b>{s.name}</b> — ₹{s.price}
              </div>

              <button
                onClick={() => deleteService(s.id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
