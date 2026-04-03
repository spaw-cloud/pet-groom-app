import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import ClientLogin from "./pages/ClientLogin";
import VerifyOtp from "./pages/VerifyOtp";
import TabLayout from "./pages/TabLayout";
import Home from "./pages/Home";
import ServiceDetail from "./pages/ServiceDetail";
import SelectPet from "./pages/SelectPet";
import SelectDateTime from "./pages/SelectDateTime";
import SelectAddress from "./pages/SelectAddress";
import Confirmation from "./pages/Confirmation";
import Pets from "./pages/Pets";
import Profile from "./pages/Profile";
import MyBookings from "./pages/MyBookings";
import Bookings from "./pages/Bookings";
import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import AdminServices from "./pages/admin/AdminServices";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminCustomers from "./pages/admin/AdminCustomers";
import CustomerDetail from "./pages/admin/CustomerDetail";
import AdminAvailability from "./pages/admin/AdminAvailability";

// ❌ Removed ClientRoute (was blocking navigation)

const AdminRoute = ({ children }) => {
  const t = localStorage.getItem("admin_token");
  return t ? children : <Navigate to="/admin/login" replace />;
};

export default function App() {
  return (
    <>
      <Toaster position="top-center" />
      <Navbar />

      <Routes>
        {/* 🔓 Public Routes */}
        <Route path="/" element={<ClientLogin />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />

        {/* 🔓 Tabs (no auth now) */}
        <Route path="/tabs" element={<TabLayout />}>
          <Route index element={<Home />} />
          <Route path="service" element={<ServiceDetail />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="pets" element={<Pets />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* 🔓 Booking Flow (IMPORTANT FIX) */}
        <Route path="/book" element={<Bookings />} />
        <Route path="/booking/select-pet" element={<SelectPet />} />
        <Route path="/booking/select-datetime" element={<SelectDateTime />} />
        <Route path="/booking/select-address" element={<SelectAddress />} />
        <Route path="/booking/confirmation" element={<Confirmation />} />

        {/* 🔒 Admin Routes (keep protected) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />
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
        <Route
          path="/admin/customers"
          element={
            <AdminRoute>
              <AdminCustomers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/customer-detail"
          element={
            <AdminRoute>
              <CustomerDetail />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/availability"
          element={
            <AdminRoute>
              <AdminAvailability />
            </AdminRoute>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}