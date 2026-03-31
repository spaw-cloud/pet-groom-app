import { useState } from "react";

export default function Login() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    otp: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSendOtp = () => {
    if (!form.name || !form.phone) {
      alert("Please fill required fields");
      return;
    }

    // TODO: API call
    setStep(2);
  };

  const handleVerifyOtp = () => {
    // TODO: verify API
    localStorage.setItem("user", JSON.stringify(form));
    window.location.href = "/booking";
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 premium-bg overflow-hidden relative">

      {/* Glow Effects */}
      <div className="absolute glow-green" />
      <div className="absolute glow-blue" />

      {/* Card */}
      <div className="relative w-full max-w-md premium-card p-8 text-white">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-wide">
            🐾 SPAW
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Premium Pet Grooming
          </p>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-semibold text-center mb-6">
          {step === 1 ? "Welcome Back" : "Enter OTP"}
        </h2>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-5">

            <InputField
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
            />

            <InputField
              label="Email Address"
              name="email"
              value={form.email}
              onChange={handleChange}
            />

            <InputField
              label="Phone Number"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />

            <button
              onClick={handleSendOtp}
              className="premium-button"
            >
              Continue →
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-5">

            <input
              type="text"
              name="otp"
              placeholder="••••••"
              value={form.otp}
              onChange={handleChange}
              maxLength={6}
              className="otp-input"
            />

            <button
              onClick={handleVerifyOtp}
              className="premium-button"
            >
              Verify & Continue
            </button>

            <button
              onClick={() => setStep(1)}
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Edit details
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-8">
          Trusted by 500+ pet owners 🐶
        </p>
      </div>
    </div>
  );
}

/* Floating Input */
function InputField({ label, name, value, onChange }) {
  return (
    <div className="relative">
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        required
        placeholder=" "
        className="premium-input peer"
      />
      <label className="premium-label">
        {label}
      </label>
    </div>
  );
}
