import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const adminToken = localStorage.getItem("admin_token");
  const sessionToken = localStorage.getItem("session_token");

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  };

  const handleClientLogout = () => {
    localStorage.removeItem("session_token");
    localStorage.removeItem("user_profile");
    localStorage.removeItem("clientToken");
    navigate("/");
  };

  return (
    <div style={styles.nav}>
      <h2 style={styles.logo}>SPAW</h2>

      <div>
        <Link to="/" style={styles.link}>
          Home
        </Link>
        {sessionToken && (
          <Link to="/tabs" style={styles.link}>
            Services
          </Link>
        )}
        {adminToken && (
          <>
            <Link to="/admin/dashboard" style={styles.link}>
              Dashboard
            </Link>
            <Link to="/admin/services" style={styles.link}>
              Services
            </Link>
            <Link to="/admin/bookings" style={styles.link}>
              Bookings
            </Link>
            <Link to="/admin/customers" style={styles.link}>
              Customers
            </Link>
            <Link to="/admin/availability" style={styles.link}>
              Availability
            </Link>
          </>
        )}
      </div>

      <div>
        {!adminToken ? (
          <Link to="/admin/login" style={styles.button}>
            Admin
          </Link>
        ) : (
          <button type="button" onClick={handleLogout} style={styles.button}>
            Admin logout
          </button>
        )}
        {sessionToken && (
          <button
            type="button"
            onClick={handleClientLogout}
            style={{ ...styles.button, marginLeft: 8, background: "#475569" }}
          >
            Sign out
          </button>
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
    flexWrap: "wrap",
    gap: 8,
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
