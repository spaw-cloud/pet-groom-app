import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import { IoLockClosed, IoCall, IoAlertCircle, IoArrowBack } from 'react-icons/io5';

export default function AdminLogin() {
  const { admin, loading, login } = useAdmin();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && admin) navigate('/admin/dashboard', { replace: true });
  }, [admin, loading, navigate]);

  const handleLogin = async () => {
    if (!phone || !password) { setError('Please enter phone and password'); return; }
    try {
      setLoggingIn(true); setError('');
      await login(phone, password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) { setError(err?.response?.data?.detail || 'Login failed'); }
    finally { setLoggingIn(false); }
  };

  if (loading) return <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="spinner" /></div>;

  return (
    <div className="page" data-testid="admin-login-page" style={{ alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <button onClick={() => navigate('/')} style={{ width: 40, height: 40, borderRadius: 20, background: '#1e293b', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IoArrowBack size={22} color="#fff" />
          </button>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Admin Portal</h1>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: '4px 0 0' }}>Spaw Group Management</p>
          </div>
        </div>

        <div className="input-group">
          <IoCall size={20} color="#8B5CF6" />
          <input type="tel" placeholder="Phone Number" value={phone} onChange={e => { setPhone(e.target.value); setError(''); }} disabled={loggingIn} data-testid="admin-phone-input" />
        </div>

        <div className="input-group">
          <IoLockClosed size={20} color="#8B5CF6" />
          <input type="password" placeholder="Password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} disabled={loggingIn}
            data-testid="admin-password-input" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.12)', padding: '10px 16px', borderRadius: 10, marginBottom: 12 }}>
            <IoAlertCircle size={18} color="#ef4444" />
            <span style={{ color: '#ef4444', fontSize: 14, fontWeight: 500 }}>{error}</span>
          </div>
        )}

        <button onClick={handleLogin} disabled={loggingIn} data-testid="admin-login-btn" className="btn btn-primary btn-block" style={{ fontSize: 18 }}>
          {loggingIn ? <div className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} /> : 'Login'}
        </button>
      </div>
    </div>
  );
}
