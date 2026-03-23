import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IoArrowBack, IoShieldCheckmark, IoAlertCircle } from 'react-icons/io5';

export default function VerifyOtp() {
  const { verifyOTP, resendOTP } = useAuth();
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

  const handleVerifyOTP = async () => {
    const fullOtp = otp.join('').trim();

    console.log("OTP BEING SENT:", fullOtp);

    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits');
      return;
    }

    try {
      setVerifying(true);
      setErrorMsg('');

      const res = await verifyOTP(email, fullOtp);

      console.log("VERIFY RESPONSE:", res);

      navigate('/tabs', { replace: true });

    } catch (error) {
      console.error("VERIFY ERROR:", error);

      setErrorMsg(
        error?.response?.data?.detail || 'Invalid OTP. Please try again.'
      );

      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="page">
      <div style={{ padding: '48px 24px 16px' }}>
        <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: 20, background: '#1e293b', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IoArrowBack size={24} color="#fff" />
        </button>
      </div>

      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 100, height: 100, borderRadius: 50, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, marginTop: 20 }}>
          <IoShieldCheckmark size={64} color="#8B5CF6" />
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 12 }}>
          Verify Email
        </h1>

        <p style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 40 }}>
          Enter the 6-digit code sent to<br />
          <span style={{ color: '#8B5CF6', fontWeight: 600 }}>{email}</span>
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => inputRefs.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleOtpChange(e.target.value.replace(/\D/g, ''), i)}
              onKeyDown={e => handleKeyDown(e, i)}
              disabled={verifying}
              style={{
                width: 48,
                height: 56,
                borderRadius: 12,
                background: '#1e293b',
                border: '2px solid #334155',
                color: '#fff',
                fontSize: 24,
                textAlign: 'center'
              }}
            />
          ))}
        </div>

        {errorMsg && (
          <div style={{ display: 'flex', gap: 8, background: 'rgba(239,68,68,0.12)', padding: 10, borderRadius: 10 }}>
            <IoAlertCircle color="#ef4444" />
            <span style={{ color: '#ef4444' }}>{errorMsg}</span>
          </div>
        )}

        <button onClick={handleVerifyOTP} disabled={verifying}>
          {verifying ? "Verifying..." : "Verify OTP"}
        </button>

        <button
          disabled={resendTimer > 0 || resending}
          onClick={async () => {
            try {
              setResending(true);
              await resendOTP(email);
              setResendTimer(60);
            } catch (err) {
              setErrorMsg('Failed to resend OTP');
            } finally {
              setResending(false);
            }
          }}
        >
          {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
        </button>
      </div>
    </div>
  );
}
