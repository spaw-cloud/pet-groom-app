import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Bookings from "./pages/Bookings";
import AdminServices from "./pages/admin/AdminServices";
import AdminBookings from "./pages/admin/AdminBookings";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Bookings />} />
        <Route path="/admin/services" element={<AdminServices />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
      </Routes>
    </Router>
  );
}
