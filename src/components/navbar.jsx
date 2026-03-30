import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div className="bg-black text-white px-6 py-4 flex justify-between items-center shadow-md">
      <h1 className="text-xl font-bold tracking-wide">🐾 SPAW</h1>

      <div className="space-x-6 text-sm">
        <Link to="/" className="hover:text-gray-300">Home</Link>
        <Link to="/admin/bookings" className="hover:text-gray-300">Admin</Link>
        <Link to="/login" className="hover:text-gray-300">Login</Link>
      </div>
    </div>
  );
}
