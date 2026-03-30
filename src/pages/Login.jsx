import { useState } from "react";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await api.post("/login", { username, password });
      localStorage.setItem("token", res.data.token);
      navigate("/admin/bookings");
    } catch {
      alert("Invalid login ❌");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">

        <h2 className="text-2xl font-bold text-center mb-6">
          🔐 Admin Login
        </h2>

        <input
          className="w-full p-3 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition"
        >
          Login
        </button>

      </div>
    </div>
  );
}
