import { useState } from "react";
import toast from "react-hot-toast";
import api from "../lib/api";

export default function Bookings() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pet, setPet] = useState("");
  const [breed, setBreed] = useState("");
  const [time, setTime] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const handleBooking = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/bookings", {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        pet: pet.trim(),
        breed: breed.trim(),
        time: time.trim(),
        date,
      });
      toast.success("Booking submitted");
      setName("");
      setPhone("");
      setAddress("");
      setPet("");
      setBreed("");
      setTime("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Quick booking</h1>
      <div className="space-y-4">
        <input
          className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <input
          className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2"
          placeholder="Pet name"
          value={pet}
          onChange={(e) => setPet(e.target.value)}
        />
        <input
          className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2"
          placeholder="Breed"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
        />
        <input
          type="date"
          className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2"
          placeholder="Time (e.g. 14:00)"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <button
          type="button"
          disabled={loading}
          onClick={handleBooking}
          className="w-full py-3 rounded-lg bg-violet-600 hover:bg-violet-500 font-semibold disabled:opacity-50"
        >
          {loading ? "Sending…" : "Submit booking"}
        </button>
      </div>
    </div>
  );
}
