import { useEffect, useState } from "react";
import api from "../lib/api";

export default function Home() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/services");
      setServices(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Our Services</h2>

      {/* SEARCH */}
      <input
        style={styles.search}
        placeholder="Search services..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* LOADING */}
      {loading && (
        <div style={styles.grid}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={styles.skeleton}></div>
          ))}
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div style={styles.error}>{error}</div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && filtered.length === 0 && (
        <div style={styles.empty}>
          <h3>No services available 🐾</h3>
          <p>Add services from admin panel</p>
          <button onClick={fetchServices}>Refresh</button>
        </div>
      )}

      {/* SERVICES LIST */}
      {!loading && filtered.length > 0 && (
        <div style={styles.grid}>
          {filtered.map((s) => (
            <div key={s.id} style={styles.card}>
              <h3>{s.name}</h3>
              <p>₹{s.price}</p>

              <button
                style={styles.button}
                onClick={() => alert(`Booking ${s.name}`)}
              >
                Book Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    background: "#0f172a",
    minHeight: "100vh",
    color: "#fff",
  },
  title: {
    fontSize: "24px",
    marginBottom: "15px",
  },
  search: {
    width: "100%",
    padding: "10px",
    marginBottom: "20px",
    borderRadius: "8px",
    border: "none",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
  },
  card: {
    background: "#1e293b",
    padding: "15px",
    borderRadius: "12px",
  },
  button: {
    marginTop: "10px",
    padding: "8px",
    background: "#7c3aed",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    cursor: "pointer",
  },
  skeleton: {
    height: "100px",
    background: "#1e293b",
    borderRadius: "12px",
    opacity: 0.5,
  },
  empty: {
    textAlign: "center",
    marginTop: "50px",
  },
  error: {
    color: "red",
    textAlign: "center",
  },
};
