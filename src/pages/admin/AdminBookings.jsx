import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import { IoArrowBack, IoRefresh, IoTrash, IoCheckmarkCircle, IoClose, IoChevronDown } from 'react-icons/io5';
import axios from 'axios';

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL;
const STATUS_COLORS = { pending: '#f59e0b', confirmed: '#22c55e', completed: '#06b6d4', cancelled: '#ef4444' };

export default function AdminBookings() {
  const { admin, token, loading: authLoading } = useAdmin();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);
  const [statusModal, setStatusModal] = useState(null);

  useEffect(() => {
    if (!authLoading && !admin) { navigate('/admin', { replace: true }); return; }
    if (token) fetchBookings();
  }, [admin, authLoading, token]);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/admin/bookings`, { headers: { Authorization: `Bearer ${token}` } });
      setBookings(res.data);
    } catch {} finally { setLoading(false); }
  }, [token]);

  const handleStatusChange = async (bookingId, status) => {
    try {
      await axios.put(`${BACKEND_URL}/api/admin/bookings/${bookingId}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      setBookings(prev => prev.map(b => (b.booking_id || b.id) === bookingId ? { ...b, status } : b));
      setStatusModal(null);
    } catch {}
  };

  const handleDelete = async (bookingId) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/bookings/${bookingId}`, { headers: { Authorization: `Bearer ${token}` } });
      setBookings(prev => prev.filter(b => (b.booking_id || b.id) !== bookingId));
    } catch {} finally { setDeleteId(null); }
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  if (authLoading) return <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="spinner" /></div>;

  return (
    <div className="page" data-testid="admin-bookings-page">
      <div style={{ padding: '40px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => navigate('/admin/dashboard')} style={{ width: 40, height: 40, borderRadius: 20, background: '#1e293b', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IoArrowBack size={22} color="#fff" />
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, flex: 1 }}>Bookings</h1>
        <button onClick={() => { setLoading(true); fetchBookings(); }} style={{ background: 'none', border: 'none', padding: 4 }}>
          <IoRefresh size={22} color="#8B5CF6" />
        </button>
      </div>

      {/* Filter */}
      <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8, overflow: 'auto' }}>
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} data-testid={`filter-${f}`}
            style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: filter === f ? '#8B5CF6' : '#1e293b', color: filter === f ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: '0 20px', overflow: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', paddingTop: 60 }}>No bookings found</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 24 }}>
            {filtered.map((b) => {
              const id = b.booking_id || b.id;
              return (
                <div key={id} data-testid={`admin-booking-${id}`} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{b.service_name || 'Service'}</span>
                    <button onClick={() => setStatusModal(id)} data-testid={`status-btn-${id}`}
                      style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: STATUS_COLORS[b.status] || '#64748b', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', textTransform: 'capitalize' }}>
                      {b.status} <IoChevronDown size={14} />
                    </button>
                  </div>
                  <p style={{ color: '#e2e8f0', fontSize: 13, margin: 0 }}>Customer: {b.customer_name || b.user_name || 'N/A'}</p>
                  <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Pet: {b.pet_name || 'N/A'} | {b.date} at {b.time}</p>
                  {b.address && <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{b.address}</p>}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => setDeleteId(id)} data-testid={`delete-booking-${id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      <IoTrash size={14} /> Delete
                    </button>
                  </div>

                  {/* Status dropdown */}
                  {statusModal === id && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 0', borderTop: '1px solid #334155' }}>
                      {['pending', 'confirmed', 'completed', 'cancelled'].map(s => (
                        <button key={s} onClick={() => handleStatusChange(id, s)} data-testid={`set-status-${s}-${id}`}
                          style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${STATUS_COLORS[s]}`, background: b.status === s ? STATUS_COLORS[s] : 'transparent', color: b.status === s ? '#fff' : STATUS_COLORS[s], fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      {deleteId && (
        <div className="modal-overlay center" onClick={() => setDeleteId(null)}>
          <div className="modal-content centered" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', padding: 32 }}>
            <IoTrash size={40} color="#ef4444" />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '16px 0 8px' }}>Delete Booking?</h3>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleteId(null)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} data-testid="confirm-delete-booking-btn" className="btn btn-danger" style={{ flex: 1 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
