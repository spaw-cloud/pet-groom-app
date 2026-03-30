import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Bookings from "./pages/Bookings";
import AdminServices from "./pages/admin/AdminServices";
import AdminBookings from "./pages/admin/AdminBookings";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";

// 🔐 Admin Protection
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/" element={<Bookings />} />
        <Route path="/login" element={<Login />} />

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
