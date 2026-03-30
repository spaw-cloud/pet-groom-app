import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminServices from "./pages/admin/AdminServices";
import Bookings from "./pages/Bookings";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Booking Page */}
        <Route path="/" element={<Bookings />} />

        {/* Admin Services */}
        <Route path="/admin/services" element={<AdminServices />} />
      </Routes>
    </Router>
  );
}
