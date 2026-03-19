import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IoArrowBack, IoShieldCheckmark, IoAlertCircle } from 'react-icons/io5';

export default function VerifyOtp() {
  const { verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { email, phone, name: userName } = location.state || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => { if (!email) navigate('/', { replace: true }); }, [email]);
  useEffect(() => { inputRefs.current[0]?.focus(); }, []);
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (index === 5 && value) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) handleVerifyOTP(fullOtp);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerifyOTP = async (otpValue) => {
    const fullOtp = otpValue || otp.join('');
    if (fullOtp.length !== 6) { setErrorMsg('Please enter all 6 digits'); return; }
    try {
      setVerifying(true); setErrorMsg('');
      await verifyOTP(email, fullOtp, phone, userName);
      navigate('/tabs', { replace: true });
    } catch (error) {
      setErrorMsg(error?.response?.data?.detail || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally { setVerifying(false); }
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
        <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 12, fontFamily: "'Playfair Display', serif" }}>Verify Email</h1>
        <p style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 40 }}>
          Enter the 6-digit code sent to<br /><span style={{ color: '#8B5CF6', fontWeight: 600 }}>{email}</span>
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }} data-testid="otp-inputs">
          {otp.map((digit, i) => (
            <input key={i} ref={el => inputRefs.current[i] = el} type="text" inputMode="numeric" maxLength={1} value={digit}
              onChange={e => handleOtpChange(e.target.value.replace(/\D/g, ''), i)} onKeyDown={e => handleKeyDown(e, i)} disabled={verifying}
              style={{ width: 48, height: 56, borderRadius: 12, background: digit ? 'rgba(139,92,246,0.06)' : '#1e293b', border: `2px solid ${digit ? '#8B5CF6' : '#334155'}`, color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', fontFamily: "'Outfit', sans-serif" }}
              data-testid={`otp-input-${i}`} />
          ))}
        </div>

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.12)', padding: '10px 16px', borderRadius: 10, marginBottom: 16, width: '100%', maxWidth: 360 }}>
            <IoAlertCircle size={18} color="#ef4444" />
            <span style={{ color: '#ef4444', fontSize: 14, fontWeight: 500, flex: 1 }}>{errorMsg}</span>
          </div>
        )}

        <button onClick={() => handleVerifyOTP()} disabled={verifying} data-testid="verify-otp-btn" className="btn btn-primary btn-block" style={{ maxWidth: 360, fontSize: 18, marginBottom: 16 }}>
          {verifying ? <div className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} /> : 'Verify OTP'}
        </button>

        <button disabled={resendTimer > 0 || resending} data-testid="resend-otp-btn"
          onClick={async () => {
            try { setResending(true); setErrorMsg(''); await resendOTP(email); setResendTimer(60); }
            catch (err) { setErrorMsg(err?.response?.data?.detail || 'Failed to resend OTP.'); }
            finally { setResending(false); }
          }}
          style={{ background: 'none', border: 'none', color: resendTimer > 0 ? '#94a3b8' : '#8B5CF6', fontSize: 14, fontWeight: 600 }}>
          {resending ? <div className="spinner spinner-sm" /> : resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
        </button>
      </div>
    </div>
  );
}
