import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { IoCalendar, IoTime, IoLocation, IoRefresh, IoPaw } from 'react-icons/io5';
import api from '../lib/api';

const STATUS_COLORS = { pending: '#f59e0b', confirmed: '#22c55e', completed: '#06b6d4', cancelled: '#ef4444' };

export default function Bookings() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await api.get('/bookings');
      setBookings(res.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  return (
    <div data-testid="bookings-page" style={{ flex: 1, background: '#0f172a', padding: 20, paddingTop: 20, overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>My Bookings</h1>
        <button onClick={() => { setRefreshing(true); fetchBookings(); }} data-testid="refresh-bookings-btn" style={{ background: 'none', border: 'none', padding: 4 }}>
          <IoRefresh size={24} color="#8B5CF6" className={refreshing ? 'spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="spinner" /></div>
      ) : bookings.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 16 }}>
          <IoCalendar size={48} color="#334155" />
          <p style={{ color: '#94a3b8', fontSize: 16 }}>No bookings yet</p>
          <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>Browse our services and book your first grooming session!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {bookings.map((b) => (
            <div key={b.booking_id || b.id} data-testid={`booking-card-${b.booking_id || b.id}`}
              className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{b.service_name || 'Grooming'}</span>
                <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#fff', background: STATUS_COLORS[b.status] || '#64748b', textTransform: 'capitalize' }}>
                  {b.status}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IoPaw size={16} color="#ec4899" />
                <span style={{ color: '#e2e8f0', fontSize: 14 }}>{b.pet_name || 'Pet'}</span>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IoCalendar size={16} color="#8B5CF6" />
                  <span style={{ color: '#94a3b8', fontSize: 14 }}>{b.date || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IoTime size={16} color="#8B5CF6" />
                  <span style={{ color: '#94a3b8', fontSize: 14 }}>{b.time || 'N/A'}</span>
                </div>
              </div>
              {b.address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <IoLocation size={16} color="#3b82f6" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ color: '#64748b', fontSize: 13, lineHeight: '18px' }}>{b.address}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
