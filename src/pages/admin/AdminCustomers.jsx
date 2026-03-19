import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import { IoArrowBack, IoSearch, IoChevronForward } from 'react-icons/io5';
import axios from 'axios';

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL;

export default function AdminCustomers() {
  const { admin, token, loading: authLoading } = useAdmin();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && !admin) { navigate('/admin', { replace: true }); return; }
    if (token) fetchCustomers();
  }, [admin, authLoading, token]);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/admin/customers`, { headers: { Authorization: `Bearer ${token}` } });
      setCustomers(res.data);
    } catch {} finally { setLoading(false); }
  }, [token]);

  const filtered = customers.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search) || (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading) return <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="spinner" /></div>;

  return (
    <div className="page" data-testid="admin-customers-page">
      <div style={{ padding: '40px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => navigate('/admin/dashboard')} style={{ width: 40, height: 40, borderRadius: 20, background: '#1e293b', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IoArrowBack size={22} color="#fff" />
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, flex: 1 }}>Customers</h1>
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#1e293b', borderRadius: 12, padding: '0 16px', gap: 12, border: '1px solid #334155' }}>
          <IoSearch size={20} color="#64748b" />
          <input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} data-testid="search-customers-input"
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 16, padding: '14px 0', fontFamily: "'Outfit', sans-serif" }} />
        </div>
      </div>

      <div style={{ flex: 1, padding: '0 20px', overflow: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', paddingTop: 60 }}>No customers found</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 24 }}>
            {filtered.map((c) => {
              const id = c.user_id || c.id;
              return (
                <button key={id} onClick={() => navigate('/admin/customer-detail', { state: { userId: id } })} data-testid={`customer-${id}`}
                  className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#8B5CF6', fontSize: 18, fontWeight: 800 }}>{(c.name || '?')[0].toUpperCase()}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#fff', fontSize: 15, fontWeight: 600, margin: 0 }}>{c.name || 'No Name'}</p>
                    <p style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0 0' }}>{c.phone || '—'} | {c.email || '—'}</p>
                    <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0', fontWeight: 600 }}>Bookings: {c.booking_count ?? 0}</p>
                  </div>
                  <IoChevronForward size={20} color="#64748b" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
