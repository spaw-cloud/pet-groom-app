import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

// Pages
import ClientLogin from "./pages/ClientLogin";
import Login from "./pages/Login";
import Bookings from "./pages/Bookings";
import AdminServices from "./pages/admin/AdminServices";

// 🔐 Admin Protection
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("adminToken");
  return token ? children : <Navigate to="/admin/login" />;
};

// 👤 Client Protection
const ClientRoute = ({ children }) => {
  const token = localStorage.getItem("clientToken");
  return token ? children : <Navigate to="/" />;
};

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        {/* 👤 CLIENT ROUTES */}
        <Route path="/" element={<ClientLogin />} />

        <Route
          path="/book"
          element={
            <ClientRoute>
              <Bookings />
            </ClientRoute>
          }
        />

        {/* 🔐 ADMIN ROUTES */}
        <Route path="/admin/login" element={<Login />} />

        <Route
          path="/admin/services"
          element={
            <AdminRoute>
              <AdminServices />
            </AdminRoute>
          }
        />

        {/* 🚫 Catch invalid routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
