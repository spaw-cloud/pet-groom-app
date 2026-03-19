import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoArrowBack, IoCalendar, IoTime, IoChevronBack, IoChevronForward } from 'react-icons/io5';
import axios from 'axios';

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL;
const TIME_SLOTS = ['10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function SelectDateTime() {
  const navigate = useNavigate();
  const location = useLocation();
  const { service, petId, petName } = location.state || {};
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookedSlots, setBookedSlots] = useState({ dates: [], slots: {} });
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => { if (!service) navigate('/tabs', { replace: true }); }, [service]);

  const fetchBooked = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/booked-slots`);
      setBookedSlots(res.data);
    } catch {}
  }, []);

  useEffect(() => { fetchBooked(); }, [fetchBooked]);

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const formatDateStr = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const isDateBlocked = (dateStr) => bookedSlots.dates?.includes(dateStr);

  const getAvailableSlots = (dateStr) => {
    const daySlots = bookedSlots.slots?.[dateStr] || [];
    return TIME_SLOTS.filter(t => !daySlots.includes(t));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDateStr(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      const isPast = dateObj < today;
      const isBlocked = isDateBlocked(dateStr);
      const isSelected = selectedDate === dateStr;
      const disabled = isPast || isBlocked;
      cells.push(
        <button key={d} onClick={() => !disabled && (setSelectedDate(dateStr), setSelectedTime(null))} disabled={disabled}
          data-testid={`date-${dateStr}`}
          style={{ width: '100%', aspectRatio: '1', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: isSelected ? 700 : 500,
            background: isSelected ? '#8B5CF6' : 'transparent', color: disabled ? '#334155' : isSelected ? '#fff' : '#e2e8f0', border: 'none', cursor: disabled ? 'default' : 'pointer', textDecoration: isBlocked ? 'line-through' : 'none' }}>
          {d}
        </button>
      );
    }
    return cells;
  };

  if (!service) return null;

  return (
    <div className="page" data-testid="select-datetime-page">
      <div style={{ padding: '48px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: 20, background: '#1e293b', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IoArrowBack size={22} color="#fff" />
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, flex: 1 }}>Select Date & Time</h1>
      </div>

      <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
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
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>Available Times</h3>
            {getAvailableSlots(selectedDate).length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: 24 }}>No available slots for this date</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {getAvailableSlots(selectedDate).map(time => {
                  const isSelected = selectedTime === time;
                  return (
                    <button key={time} onClick={() => setSelectedTime(time)} data-testid={`time-${time.replace(/[: ]/g, '-')}`}
                      style={{ padding: '12px 8px', borderRadius: 10, border: `2px solid ${isSelected ? '#8B5CF6' : '#334155'}`, background: isSelected ? 'rgba(139,92,246,0.12)' : '#1e293b', color: isSelected ? '#8B5CF6' : '#e2e8f0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                      {time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #334155' }}>
        <button onClick={() => navigate('/booking/select-address', { state: { service, petId, petName, date: selectedDate, time: selectedTime } })}
          disabled={!selectedDate || !selectedTime} data-testid="continue-to-address-btn" className="btn btn-primary btn-block" style={{ fontSize: 18 }}>
          Continue
        </button>
      </div>
    </div>
  );
}
