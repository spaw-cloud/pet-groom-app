import { Routes, Route, Navigate } from "react-router-dom";
import ClientLogin from "./pages/ClientLogin";
import Login from "./pages/Login";
import Bookings from "./pages/Bookings";
import AdminServices from "./pages/admin/AdminServices";
import Navbar from "./components/Navbar";

// 🔐 Admin protection
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("adminToken");
  return token ? children : <Navigate to="/admin/login" />;
};

// 👤 Client protection
const ClientRoute = ({ children }) => {
  const token = localStorage.getItem("clientToken");
  return token ? children : <Navigate to="/" />;
};

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        {/* Client */}
        <Route path="/" element={<ClientLogin />} />
        <Route
          path="/book"
          element={
            <ClientRoute>
              <Bookings />
            </ClientRoute>
          }
        />

        {/* Admin */}
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin/services"
          element={
            <AdminRoute>
              <AdminServices />
            </AdminRoute>
          }
        />
      </Routes>
    </>
  );
}