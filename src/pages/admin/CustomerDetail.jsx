import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import { IoArrowBack, IoPaw, IoLocation } from 'react-icons/io5';
import axios from 'axios';
import { API_BASE_URL } from '../../lib/api';

const STATUS_COLORS = { pending: '#f59e0b', confirmed: '#22c55e', completed: '#06b6d4', cancelled: '#ef4444' };

export default function CustomerDetail() {
  const { admin, token, loading: authLoading } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/customers/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    if (!authLoading && !admin) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (!userId) {
      navigate('/admin/customers', { replace: true });
      return;
    }
    if (token) fetchDetail();
  }, [admin, authLoading, token, userId, fetchDetail, navigate]);

  if (authLoading || loading) {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: '#fff' }}>Customer not found</p>
      </div>
    );
  }

  const { user, pets, bookings, addresses } = data;

  return (
    <div className="page" data-testid="customer-detail-page">
      <div style={{ padding: '40px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: '#1e293b',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IoArrowBack size={22} color="#fff" />
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, flex: 1 }}>Customer Details</h1>
      </div>

      <div style={{ flex: 1, padding: '0 20px', overflow: 'auto', paddingBottom: 24 }}>
        <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              background: 'rgba(139,92,246,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <span style={{ color: '#8B5CF6', fontSize: 28, fontWeight: 800 }}>
              {(user.name || '?')[0].toUpperCase()}
            </span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>{user.name || 'No Name'}</h2>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>{user.phone || '—'}</p>
          {user.email && <p style={{ color: '#94a3b8', fontSize: 14 }}>{user.email}</p>}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Bookings', val: bookings.length },
            { label: 'Pets', val: pets.length },
            { label: 'Addresses', val: addresses.length },
          ].map(({ label, val }) => (
            <div key={label} className="card" style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ color: '#8B5CF6', fontSize: 22, fontWeight: 800, margin: 0 }}>{val}</p>
              <p style={{ color: '#94a3b8', fontSize: 12, margin: '4px 0 0' }}>{label}</p>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Pets</h3>
        {pets.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>No pets</p>
        ) : (
          pets.map((p, i) => (
            <div key={i} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <IoPaw size={20} color="#ec4899" />
              <div style={{ flex: 1 }}>
                <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>{p.name}</p>
                <p style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0 0' }}>
                  {p.breed} {p.age ? `| ${p.age}yr` : ''} {p.weight ? `| ${p.weight}` : ''}
                </p>
                {p.special_notes && (
                  <p style={{ color: '#64748b', fontSize: 11, fontStyle: 'italic', margin: '4px 0 0' }}>{p.special_notes}</p>
                )}
              </div>
            </div>
          ))
        )}

        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12, marginTop: 8 }}>Addresses</h3>
        {addresses.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>No addresses</p>
        ) : (
          addresses.map((a, i) => (
            <div key={i} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <IoLocation size={20} color="#3b82f6" />
              <div style={{ flex: 1 }}>
                <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>
                  {a.house_number}, {a.street}
                </p>
                <p style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0 0' }}>
                  {a.area}, {a.city} - {a.pincode}
                </p>
                {a.landmark && (
                  <p style={{ color: '#64748b', fontSize: 11, fontStyle: 'italic', margin: '4px 0 0' }}>
                    Landmark: {a.landmark}
                  </p>
                )}
              </div>
            </div>
          ))
        )}

        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12, marginTop: 8 }}>Booking History</h3>
        {bookings.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: 13 }}>No bookings</p>
        ) : (
          bookings.map((b, i) => (
            <div key={i} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  marginTop: 6,
                  background: STATUS_COLORS[b.status] || '#64748b',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>
                  {b.date} at {b.time}
                </p>
                <p style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0 0' }}>
                  Status: {b.status} | Payment: {b.payment_status}
                </p>
                {b.address && (
                  <p style={{ color: '#64748b', fontSize: 11, fontStyle: 'italic', margin: '4px 0 0' }}>{b.address}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
