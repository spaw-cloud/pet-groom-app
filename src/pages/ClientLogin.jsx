import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function ClientLogin() {
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    const cleanPhone = phone.replace(/\D/g, "");

    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    // ✅ Move to next step
    navigate("/select-pet", { state: { phone: cleanPhone } });
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-900 to-black">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl rounded-2xl p-8 w-80 text-white"
      >
        <h1 className="text-2xl font-bold text-center mb-2">SPAW</h1>
        <p className="text-sm text-center mb-6 text-gray-300">
          Book grooming in seconds
        </p>

        <input
          type="tel"
          placeholder="Enter phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-white/20 border border-white/30 placeholder-gray-300 text-white outline-none"
        />

        <button
          type="button"
          onClick={handleLogin}
          className="w-full bg-green-500 hover:bg-green-600 py-2 rounded-lg font-semibold transition"
        >
          Continue
        </button>

        <p className="text-xs text-center mt-4 text-gray-400">
          By continuing, you agree to our terms
        </p>
      </motion.div>
    </div>
  );
}