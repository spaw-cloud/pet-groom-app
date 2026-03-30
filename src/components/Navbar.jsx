import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div className="bg-black text-white px-6 py-4 flex justify-between items-center">
      <h1 className="text-lg font-bold">🐾 SPAW</h1>

      <div className="space-x-4">
        <Link to="/">Home</Link>
        <Link to="/admin/bookings">Admin</Link>
        <Link to="/login">Login</Link>
      </div>
    </div>
  );
}
