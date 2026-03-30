import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Bookings from "./pages/Bookings";
import AdminServices from "./pages/admin/AdminServices";
import AdminBookings from "./pages/admin/AdminBookings";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";

// 🔐 Protect Admin Routes
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Navbar />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Bookings />} />
        <Route path="/login" element={<Login />} />

        {/* Admin */}
        <Route
          path="/admin/services"
          element={
            <AdminRoute>
              <AdminServices />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/bookings"
          element={
            <AdminRoute>
              <AdminBookings />
            </AdminRoute>
          }
        />
      </Routes>
    </Router>
  );
}
