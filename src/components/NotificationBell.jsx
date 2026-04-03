import React, { useState, useEffect, useCallback } from 'react';
import { IoNotificationsOutline, IoNotifications, IoClose, IoCheckmarkCircle, IoTrophy, IoCloseCircle, IoCalendar, IoNotificationsOffOutline } from 'react-icons/io5';
import axios from 'axios';
import { API_BASE_URL } from '../lib/api';

export default function NotificationBell({ token, type }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const basePath = type === 'admin' ? '/api/admin/notifications' : '/api/notifications';

  const fetchUnread = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}${basePath}/unread-count`, { headers: { Authorization: `Bearer ${token}` } });
      setUnreadCount(res.data.count);
    } catch {}
  }, [token, basePath]);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  const openNotifications = async () => {
    setVisible(true);
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}${basePath}`, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(res.data);
    } catch {}
    setLoading(false);
  };

  const markRead = async (notifId) => {
    try {
      await axios.put(`${API_BASE_URL}${basePath}/${notifId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => n.notification_id === notifId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API_BASE_URL}${basePath}/read-all`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const formatTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const diff = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch { return ''; }
  };

  const getIcon = (title) => {
    if (title.includes('Confirmed')) return { Icon: IoCheckmarkCircle, color: '#22c55e' };
    if (title.includes('Completed')) return { Icon: IoTrophy, color: '#06b6d4' };
    if (title.includes('Cancelled')) return { Icon: IoCloseCircle, color: '#ef4444' };
    if (title.includes('New Booking')) return { Icon: IoCalendar, color: '#8B5CF6' };
    return { Icon: IoNotifications, color: '#f59e0b' };
  };

  return (
    <>
      <button onClick={openNotifications} data-testid="notification-bell" style={{ position: 'relative', background: 'none', border: 'none', padding: 4 }}>
        <IoNotificationsOutline size={26} color="#fff" />
        {unreadCount > 0 && (
          <span data-testid="notification-badge" style={{ position: 'absolute', top: -2, right: -4, background: '#ef4444', borderRadius: 10, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', color: '#fff', fontSize: 11, fontWeight: 800 }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {visible && (
        <div className="modal-overlay" onClick={() => setVisible(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ minHeight: 300 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Notifications</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} data-testid="mark-all-read-btn" style={{ background: 'rgba(139,92,246,0.12)', border: 'none', padding: '6px 12px', borderRadius: 8, color: '#8B5CF6', fontSize: 12, fontWeight: 700 }}>
                    Mark all read
                  </button>
                )}
                <button onClick={() => setVisible(false)} data-testid="close-notifications" style={{ background: 'none', border: 'none' }}>
                  <IoClose size={28} color="#fff" />
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="spinner" /></div>
            ) : notifications.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 50, gap: 12 }}>
                <IoNotificationsOffOutline size={48} color="#334155" />
                <span style={{ color: '#64748b', fontSize: 15 }}>No notifications yet</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notifications.map((n, i) => {
                  const { Icon, color } = getIcon(n.title);
                  return (
                    <button key={i} onClick={() => !n.read && markRead(n.notification_id)} data-testid={`notification-${n.notification_id}`}
                      style={{ display: 'flex', gap: 14, padding: 14, borderRadius: 14, background: n.read ? '#0f172a' : 'rgba(139,92,246,0.03)', border: `1px solid ${n.read ? '#334155' : 'rgba(139,92,246,0.25)'}`, textAlign: 'left', cursor: 'pointer' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={22} color={color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{n.title}</span>
                          {!n.read && <span style={{ width: 8, height: 8, borderRadius: 4, background: '#8B5CF6' }} />}
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 3, lineHeight: '18px' }}>{n.message}</p>
                        <span style={{ color: '#475569', fontSize: 11, marginTop: 6, display: 'block' }}>{formatTime(n.created_at)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
