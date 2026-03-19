import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import { IoCalendar, IoPeople, IoCut, IoTimer, IoLogOut, IoRefresh } from 'react-icons/io5';
import NotificationBell from '../../components/NotificationBell';
import axios from 'axios';

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL;

export default function Dashboard() {
  const { admin, token, loading: authLoading, logout } = useAdmin();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_bookings: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, total_customers: 0, total_services: 0, today_bookings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !admin) { navigate('/admin', { replace: true }); return; }
    if (token) fetchStats();
  }, [admin, authLoading, token]);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
      // Map the dashboard response to stats format
      const data = res.data;
      setStats({
        total_bookings: data.total_bookings || 0,
        pending: data.pending_bookings || 0,
        confirmed: data.confirmed_bookings || 0,
        completed: data.completed_bookings || 0,
        cancelled: data.cancelled_bookings || 0,
        total_customers: data.total_customers || 0,
        total_services: data.total_services || 0,
        today_bookings: 0  // Not in dashboard response
      });
    } catch {} finally { setLoading(false); }
  };

  const handleLogout = async () => { await logout(); navigate('/admin', { replace: true }); };

  if (authLoading || loading) return <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="spinner" /></div>;

  const quickActions = [
    { icon: IoCalendar, label: 'Bookings', color: '#8B5CF6', path: '/admin/bookings' },
    { icon: IoPeople, label: 'Customers', color: '#3b82f6', path: '/admin/customers' },
    { icon: IoCut, label: 'Services', color: '#ec4899', path: '/admin/services' },
    { icon: IoTimer, label: 'Timer', color: '#f59e0b', path: '/admin/availability' },
  ];

  const statCards = [
    { label: 'Today', value: stats.today_bookings, color: '#8B5CF6' },
    { label: 'Pending', value: stats.pending, color: '#f59e0b' },
    { label: 'Confirmed', value: stats.confirmed, color: '#22c55e' },
    { label: 'Completed', value: stats.completed, color: '#06b6d4' },
  ];

  return (
    <div className="page" data-testid="admin-dashboard">
      <div style={{ flex: 1, padding: 20, paddingTop: 40, overflow: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Dashboard</h1>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: '4px 0 0' }}>Welcome, {admin?.name || 'Admin'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NotificationBell token={token} type="admin" />
            <button onClick={handleLogout} data-testid="admin-logout-btn" style={{ background: 'none', border: 'none', padding: 4 }}>
              <IoLogOut size={24} color="#ef4444" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 28 }}>
          {statCards.map(({ label, value, color }) => (
            <div key={label} className="card" style={{ textAlign: 'center' }}>
              <p style={{ color: color, fontSize: 28, fontWeight: 800, margin: 0 }}>{value}</p>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0', fontWeight: 600 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Total Stats Row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total Bookings', value: stats.total_bookings },
            { label: 'Customers', value: stats.total_customers },
            { label: 'Services', value: stats.total_services },
          ].map(({ label, value }) => (
            <div key={label} className="card" style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: 0 }}>{value}</p>
              <p style={{ color: '#64748b', fontSize: 11, margin: '4px 0 0', fontWeight: 600 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {quickActions.map(({ icon: Icon, label, color, path }) => (
            <button key={label} onClick={() => navigate(path)} data-testid={`admin-action-${label.toLowerCase()}`}
              className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={22} color={color} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
