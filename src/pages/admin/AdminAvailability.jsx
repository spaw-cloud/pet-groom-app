import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import { IoArrowBack, IoCalendar, IoTime, IoTrash, IoChevronBack, IoChevronForward } from 'react-icons/io5';
import axios from 'axios';
import { API_BASE_URL } from '../../lib/api';
const TIME_SLOTS = ['10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function AdminAvailability() {
  const { admin, token, loading: authLoading } = useAdmin();
  const navigate = useNavigate();
  const [blockedDates, setBlockedDates] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [tab, setTab] = useState('dates');

  useEffect(() => {
    if (!authLoading && !admin) { navigate('/admin/login', { replace: true }); return; }
    if (token) fetchAvailability();
  }, [admin, authLoading, token]);

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/booked-slots`);
      setBlockedDates(res.data.dates || []);
      setBlockedSlots(res.data.slots || {});
    } catch {} finally { setLoading(false); }
  }, []);

  const blockDate = async (dateStr) => {
    try {
      await axios.post(`${API_BASE_URL}/api/admin/block-date`, { date: dateStr }, { headers: { Authorization: `Bearer ${token}` } });
      setBlockedDates(prev => [...prev, dateStr]);
    } catch {}
  };

  const unblockDate = async (dateStr) => {
    try {
      await axios.post(`${API_BASE_URL}/api/admin/unblock-date`, { date: dateStr }, { headers: { Authorization: `Bearer ${token}` } });
      setBlockedDates(prev => prev.filter(d => d !== dateStr));
    } catch {}
  };

  const blockSlot = async (dateStr, time) => {
    try {
      await axios.post(`${API_BASE_URL}/api/admin/block-slot`, { date: dateStr, time }, { headers: { Authorization: `Bearer ${token}` } });
      setBlockedSlots(prev => ({ ...prev, [dateStr]: [...(prev[dateStr] || []), time] }));
    } catch {}
  };

  const unblockSlot = async (dateStr, time) => {
    try {
      await axios.post(`${API_BASE_URL}/api/admin/unblock-slot`, { date: dateStr, time }, { headers: { Authorization: `Bearer ${token}` } });
      setBlockedSlots(prev => ({ ...prev, [dateStr]: (prev[dateStr] || []).filter(t => t !== time) }));
    } catch {}
  };

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const formatDateStr = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDateStr(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      const isBlocked = blockedDates.includes(dateStr);
      const isSelected = selectedDate === dateStr;
      const hasBlockedSlots = (blockedSlots[dateStr] || []).length > 0;
      cells.push(
        <button key={d} onClick={() => { setSelectedDate(dateStr); setTab('slots'); }}
          data-testid={`avail-date-${dateStr}`}
          style={{ width: '100%', aspectRatio: '1', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: isSelected ? 700 : 500,
            background: isBlocked ? 'rgba(239,68,68,0.2)' : isSelected ? '#8B5CF6' : 'transparent',
            color: isBlocked ? '#ef4444' : isSelected ? '#fff' : '#e2e8f0', border: 'none', cursor: 'pointer', position: 'relative', textDecoration: isBlocked ? 'line-through' : 'none' }}>
          {d}
          {hasBlockedSlots && !isBlocked && <span style={{ position: 'absolute', bottom: 4, width: 5, height: 5, borderRadius: 3, background: '#f59e0b' }} />}
        </button>
      );
    }
    return cells;
  };

  if (authLoading || loading) return <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="spinner" /></div>;

  return (
    <div className="page" data-testid="admin-availability-page">
      <div style={{ padding: '40px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => navigate('/admin/dashboard')} style={{ width: 40, height: 40, borderRadius: 20, background: '#1e293b', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IoArrowBack size={22} color="#fff" />
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, flex: 1 }}>Availability</h1>
      </div>

      <div style={{ flex: 1, padding: '0 20px', overflow: 'auto', paddingBottom: 24 }}>
        {/* Calendar */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              style={{ background: 'none', border: 'none', padding: 4 }}><IoChevronBack size={22} color="#8B5CF6" /></button>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              style={{ background: 'none', border: 'none', padding: 4 }}><IoChevronForward size={22} color="#8B5CF6" /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
            {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#64748b', padding: '4px 0' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {renderCalendar()}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center' }}>
            {[{ color: 'rgba(239,68,68,0.2)', label: 'Blocked Day' }, { color: '#f59e0b', label: 'Blocked Slots', dot: true }].map(({ color, label, dot }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: dot ? 8 : 16, height: dot ? 8 : 16, borderRadius: dot ? 4 : 4, background: color }} />
                <span style={{ color: '#94a3b8', fontSize: 12 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Date Actions */}
        {selectedDate && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}>{selectedDate}</h3>
              {blockedDates.includes(selectedDate) ? (
                <button onClick={() => unblockDate(selectedDate)} data-testid="unblock-date-btn" className="btn btn-success" style={{ padding: '8px 16px', fontSize: 13 }}>
                  Unblock Day
                </button>
              ) : (
                <button onClick={() => blockDate(selectedDate)} data-testid="block-date-btn" className="btn btn-danger" style={{ padding: '8px 16px', fontSize: 13 }}>
                  Block Entire Day
                </button>
              )}
            </div>

            {!blockedDates.includes(selectedDate) && (
              <div>
                <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 12 }}>Tap a slot to toggle availability:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {TIME_SLOTS.map(time => {
                    const isBlocked = (blockedSlots[selectedDate] || []).includes(time);
                    return (
                      <button key={time} onClick={() => isBlocked ? unblockSlot(selectedDate, time) : blockSlot(selectedDate, time)}
                        data-testid={`slot-toggle-${time.replace(/[: ]/g, '-')}`}
                        style={{ padding: '12px 8px', borderRadius: 10, border: `1px solid ${isBlocked ? '#ef4444' : '#334155'}`, background: isBlocked ? 'rgba(239,68,68,0.12)' : '#1e293b', color: isBlocked ? '#ef4444' : '#e2e8f0', fontSize: 14, fontWeight: 600, cursor: 'pointer', textDecoration: isBlocked ? 'line-through' : 'none' }}>
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
