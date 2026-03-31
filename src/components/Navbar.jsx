import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div style={styles.nav}>
      <h2 style={styles.logo}>🐾 SPAW</h2>

      <div>
        <Link to="/" style={styles.link}>Home</Link>

        {token && (
          <>
            <Link to="/admin/services" style={styles.link}>Services</Link>
            <Link to="/admin/bookings" style={styles.link}>Bookings</Link>
          </>
        )}
      </div>

      <div>
        {!token ? (
          <Link to="/login" style={styles.button}>Login</Link>
        ) : (
          <button onClick={handleLogout} style={styles.button}>Logout</button>
        )}
      </div>
    </div>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    background: "#020617",
    color: "#fff",
  },
  logo: {
    margin: 0,
  },
  link: {
    marginRight: "15px",
    color: "#cbd5f5",
    textDecoration: "none",
  },
  button: {
    padding: "8px 15px",
    background: "#2563eb",
    border: "none",
    color: "#fff",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
