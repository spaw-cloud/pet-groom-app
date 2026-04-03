import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IoArrowBack, IoShieldCheckmark, IoAlertCircle } from "react-icons/io5";
import { useAuth } from "../contexts/AuthContext";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { phone } = location.state || {};
  const { verifyOtp, sendOtp } = useAuth();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!phone) navigate("/", { replace: true });
  }, [phone, navigate]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (value, index) => {
    const next = [...otp];
    next[index] = value.replace(/\D/g, "").slice(0, 1);
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const fullOtp = otp.join("").trim();
    if (fullOtp.length !== 6) {
      setErrorMsg("Please enter all 6 digits");
      return;
    }
    try {
      setVerifying(true);
      setErrorMsg("");
      await verifyOtp(phone, fullOtp);
      navigate("/tabs", { replace: true });
    } catch (error) {
      setErrorMsg(error.message || "Invalid OTP");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResending(true);
      await sendOtp(phone);
      setResendTimer(60);
    } catch {
      setErrorMsg("Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  if (!phone) return null;

  return (
    <div className="page">
      <div style={{ padding: "48px 24px 16px" }}>
        <button type="button" onClick={() => navigate(-1)} style={{ background: "none", border: "none" }}>
          <IoArrowBack size={24} color="#fff" />
        </button>
      </div>

      <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <IoShieldCheckmark size={64} color="#8B5CF6" />

        <h1 style={{ color: "#fff", marginTop: 16 }}>Verify OTP</h1>

        <p style={{ color: "#94a3b8", textAlign: "center", marginTop: 8 }}>
          Enter code for <br />
          <span style={{ color: "#e2e8f0" }}>{phone}</span>
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              value={digit}
              inputMode="numeric"
              onChange={(e) => handleOtpChange(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              maxLength={1}
              style={{
                width: 44,
                height: 52,
                textAlign: "center",
                fontSize: 22,
                borderRadius: 10,
                border: "1px solid #334155",
                background: "#1e293b",
                color: "#fff",
              }}
            />
          ))}
        </div>

        {errorMsg && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, color: "#ef4444" }}>
            <IoAlertCircle size={18} />
            {errorMsg}
          </div>
        )}

        <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 24, maxWidth: 320 }} onClick={handleVerifyOTP}>
          {verifying ? "Verifying..." : "Verify OTP"}
        </button>

        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginTop: 12 }}
          disabled={resending || resendTimer > 0}
          onClick={handleResendOTP}
        >
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
        </button>
      </div>
    </div>
  );
}
