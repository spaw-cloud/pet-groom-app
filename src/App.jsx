import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import Login from './pages/Login';
import VerifyOtp from './pages/VerifyOtp';
import TabLayout from './pages/TabLayout';
import Home from './pages/Home';
import Bookings from './pages/Bookings';
import Pets from './pages/Pets';
import Profile from './pages/Profile';
import ServiceDetail from './pages/ServiceDetail';
import SelectPet from './pages/SelectPet';
import SelectDateTime from './pages/SelectDateTime';
import SelectAddress from './pages/SelectAddress';
import Confirmation from './pages/Confirmation';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import AdminBookings from './pages/admin/AdminBookings';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminServices from './pages/admin/AdminServices';
import AdminAvailability from './pages/admin/AdminAvailability';
import CustomerDetail from './pages/admin/CustomerDetail';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/tabs" element={<TabLayout />}>
          <Route index element={<Home />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="pets" element={<Pets />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="/booking/service-detail" element={<ServiceDetail />} />
        <Route path="/booking/select-pet" element={<SelectPet />} />
        <Route path="/booking/select-datetime" element={<SelectDateTime />} />
        <Route path="/booking/select-address" element={<SelectAddress />} />
        <Route path="/booking/confirmation" element={<Confirmation />} />
        <Route path="/admin" element={<AdminProvider><AdminLogin /></AdminProvider>} />
        <Route path="/admin/dashboard" element={<AdminProvider><Dashboard /></AdminProvider>} />
        <Route path="/admin/bookings" element={<AdminProvider><AdminBookings /></AdminProvider>} />
        <Route path="/admin/customers" element={<AdminProvider><AdminCustomers /></AdminProvider>} />
        <Route path="/admin/services" element={<AdminProvider><AdminServices /></AdminProvider>} />
        <Route path="/admin/availability" element={<AdminProvider><AdminAvailability /></AdminProvider>} />
        <Route path="/admin/customer-detail" element={<AdminProvider><CustomerDetail /></AdminProvider>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
