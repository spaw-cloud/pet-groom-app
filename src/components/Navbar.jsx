import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  // ✅ Safe token check
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div
      style={{
        padding: "10px",
        background: "#111",
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <div>
        <Link to="/" style={{ color: "#fff", marginRight: "10px" }}>
          Home
        </Link>

        {token && (
          <>
            <Link
              to="/admin/services"
              style={{ color: "#fff", marginRight: "10px" }}
            >
              Services
            </Link>

            <Link
              to="/admin/bookings"
              style={{ color: "#fff", marginRight: "10px" }}
            >
              Bookings
            </Link>
          </>
        )}
      </div>

      <div>
        {!token ? (
          <Link to="/login" style={{ color: "#fff" }}>
            Login
          </Link>
        ) : (
          <button onClick={handleLogout}>Logout</button>
        )}
      </div>
    </div>
  );
}
