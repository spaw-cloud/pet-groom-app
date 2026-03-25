import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoArrowBack, IoShieldCheckmark, IoAlertCircle } from 'react-icons/io5';
import API_BASE_URL from '../config';   // ✅ FIX

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  const { email } = location.state || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) navigate('/', { replace: true });
  }, [email]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ✅ VERIFY OTP (FIXED)
  const handleVerifyOTP = async () => {
    const fullOtp = otp.join('').trim();

    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits');
      return;
    }

    try {
      setVerifying(true);
      setErrorMsg('');

      const res = await fetch(
        `${API_BASE_URL}/api/auth/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp: fullOtp,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Invalid OTP");
      }

      navigate('/tabs', { replace: true });

    } catch (error) {
      console.error("VERIFY ERROR:", error);
      setErrorMsg(error.message || "Invalid OTP");

      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

    } finally {
      setVerifying(false);
    }
  };

  // ✅ RESEND OTP (FIXED)
  const handleResendOTP = async () => {
    try {
      setResending(true);

      const res = await fetch(
        `${API_BASE_URL}/api/auth/send-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to resend OTP");
      }

      setResendTimer(60);

    } catch (err) {
      setErrorMsg("Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="page">
      <div style={{ padding: '48px 24px 16px' }}>
        <button onClick={() => navigate(-1)}>
          <IoArrowBack size={24} color="#fff" />
        </button>
      </div>

      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <IoShieldCheckmark size={64} color="#8B5CF6" />

        <h1>Verify Email</h1>

        <p>
          Enter code sent to <br />
          <span>{email}</span>
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => inputRefs.current[i] = el}
              value={digit}
              onChange={e => handleOtpChange(e.target.value, i)}
              onKeyDown={e => handleKeyDown(e, i)}
              maxLength={1}
            />
          ))}
        </div>

        {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

        <button onClick={handleVerifyOTP}>
          {verifying ? "Verifying..." : "Verify OTP"}
        </button>

        <button onClick={handleResendOTP}>
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
        </button>
      </div>
    </div>
  );
}
