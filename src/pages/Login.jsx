import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IoPerson, IoCall, IoMail, IoAlertCircle, IoInformationCircle, IoArrowForward, IoCalendar, IoHome, IoStar } from 'react-icons/io5';
import axios from 'axios';

const BACKEND_URL = "https://pet-groom-app.onrender.com";

export default function Login() {
  const { user, loading, sendOTP, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!loading && user) navigate('/tabs', { replace: true });
  }, [user, loading, navigate]);

  const handleSendOTP = async () => {
  const cleanPhone = phone.replace(/\D/g, '');

  try {
    setSending(true);
    setErrorMsg('');

    await axios.post(`${BACKEND_URL}/api/auth/send-otp`, {
      name,
      email,
      phone: cleanPhone
    });

    navigate('/verify-otp', {
      state: { email, phone: cleanPhone, name }
    });

  } catch (err) {
    setErrorMsg('Failed to send OTP');
  } finally {
    setSending(false);
  }
};

  if (loading) return <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="spinner" /><p style={{ color: '#fff', marginTop: 16 }}>Loading...</p></div>;
  if (user) return <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="spinner" /><p style={{ color: '#fff', marginTop: 16 }}>Redirecting...</p></div>;

  return (
    <div className="page" style={{ padding: 24, justifyContent: 'space-between' }}>
      <div>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <img src="/logo.png" alt="Spaw Group" data-testid="login-logo" style={{ width: 120, height: 120, borderRadius: 60, objectFit: 'contain' }} />
          <h1 style={{ fontSize: 32, fontWeight: 'bold', fontFamily: "'Playfair Display', serif", margin: '20px 0 8px' }}>Spaw Group</h1>
          <p style={{ fontSize: 14, color: '#94a3b8' }}>Professional Pet Grooming at Your Doorstep</p>
        </div>

        {/* Form */}
        <div style={{ marginTop: 20, fontFamily: "'Outfit', sans-serif" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>Welcome to Spaw Group</div>
          <div style={{ fontSize: 15, color: '#94a3b8', marginBottom: 28 }}>Enter your details to continue</div>

          <div className="input-group">
            <IoPerson size={20} color="#8B5CF6" />
            <input type="text" placeholder="Enter your full name" value={name} onChange={e => { setName(e.target.value); setErrorMsg(''); }} disabled={sending} data-testid="login-name-input" />
          </div>

          <div className="input-group">
            <IoCall size={20} color="#8B5CF6" />
            <span style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 500 }}>+91</span>
            <input type="tel" placeholder="Enter 10-digit phone number" value={phone} onChange={e => { setPhone(e.target.value); setErrorMsg(''); }} disabled={sending} maxLength={10} data-testid="login-phone-input" />
          </div>

          <div className="input-group">
            <IoMail size={20} color="#8B5CF6" />
            <input type="email" placeholder="Enter your email address" value={email} onChange={e => { setEmail(e.target.value); setErrorMsg(''); }} disabled={sending} data-testid="login-email-input" />
          </div>

          {errorMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.13)', padding: '10px 16px', borderRadius: 10, marginBottom: 12 }}>
              <IoAlertCircle size={18} color="#ef4444" />
              <span style={{ color: '#ef4444', fontSize: 14, fontWeight: 500 }}>{errorMsg}</span>
            </div>
          )}

          <button onClick={handleSendOTP} disabled={sending} data-testid="login-submit-btn" className="btn btn-primary btn-block" style={{ fontSize: 18, padding: '16px 24px' }}>
            {sending ? 'Please wait...' : 'Continue  →'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
            <IoInformationCircle size={16} color="#64748b" />
            <span style={{ color: '#64748b', fontSize: 13 }}>You will receive an OTP on your email</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        {[{ icon: IoCalendar, text: 'Easy Booking' }, { icon: IoHome, text: 'Doorstep Service' }, { icon: IoStar, text: 'Expert Groomers' }].map(({ icon: Icon, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon size={24} color="#8B5CF6" />
            <span style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 500 }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
