import { Routes, Route } from "react-router-dom";
import Bookings from "./pages/Bookings";
import AdminServices from "./pages/admin/AdminServices";
import AdminBookings from "./pages/admin/AdminBookings";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import { Navigate } from "react-router-dom";

// 🔐 Protect Admin Routes
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <>
      {/* ✅ Safe Navbar */}
      <Navbar />

      {/* ✅ Routes */}
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
    </>
  );
}
