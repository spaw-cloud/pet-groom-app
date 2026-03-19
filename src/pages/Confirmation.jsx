import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoArrowBack, IoCheckmarkCircle, IoPaw, IoCalendar, IoTime, IoLocation, IoCard, IoHome } from 'react-icons/io5';
import api from '../lib/api';

export default function Confirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { service, petId, petName, date, time, addressId, address } = location.state || {};
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState('');

  const handleBook = async () => {
    try {
      setBooking(true); setError('');
      await api.post('/bookings', { service_id: service.service_id || service.id, pet_id: petId, booking_date: date, booking_time: time, address_id: addressId });
      setBooked(true);
    } catch (err) { setError(err?.response?.data?.detail || 'Booking failed. Please try again.'); }
    finally { setBooking(false); }
  };

  if (!service) { navigate('/tabs', { replace: true }); return null; }

  if (booked) {
    return (
      <div className="page" data-testid="booking-success" style={{ alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: 100, height: 100, borderRadius: 50, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <IoCheckmarkCircle size={64} color="#10b981" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, fontFamily: "'Playfair Display', serif" }}>Booking Confirmed!</h1>
        <p style={{ color: '#94a3b8', fontSize: 15, textAlign: 'center', marginBottom: 32, maxWidth: 300 }}>
          Your grooming session has been booked successfully. You will receive a confirmation email shortly.
        </p>
        <button onClick={() => navigate('/tabs/bookings', { replace: true })} data-testid="view-bookings-btn" className="btn btn-primary btn-block" style={{ maxWidth: 360, fontSize: 18, marginBottom: 12 }}>
          <IoCalendar size={20} /> View My Bookings
        </button>
        <button onClick={() => navigate('/tabs', { replace: true })} data-testid="back-to-home-btn" className="btn btn-ghost btn-block" style={{ maxWidth: 360, fontSize: 16 }}>
          <IoHome size={20} /> Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="page" data-testid="confirmation-page">
      <div style={{ padding: '48px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: 20, background: '#1e293b', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IoArrowBack size={22} color="#fff" />
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, flex: 1 }}>Confirm Booking</h1>
      </div>

      <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Booking Summary</h2>

        <div className="card" style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Service */}
          <div style={{ display: 'flex', gap: 16 }}>
            {service.image_base64 && <img src={service.image_base64} alt={service.name} style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover' }} />}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>{service.name}</h3>
              <p style={{ color: '#8B5CF6', fontSize: 18, fontWeight: 800, margin: '4px 0 0' }}>Rs.{service.price}</p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #334155', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: IoPaw, color: '#ec4899', label: 'Pet', value: petName || 'Selected' },
              { icon: IoCalendar, color: '#8B5CF6', label: 'Date', value: date },
              { icon: IoTime, color: '#8B5CF6', label: 'Time', value: time },
              { icon: IoLocation, color: '#3b82f6', label: 'Address', value: address || 'Selected' },
            ].map(({ icon: Icon, color, label, value }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Icon size={20} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>{label}</p>
                  <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: '2px 0 0' }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IoCard size={22} color="#8B5CF6" />
            <span style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 600 }}>Payment</span>
          </div>
          <span style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500 }}>Cash on Delivery</span>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.12)', padding: '12px 16px', borderRadius: 10, marginTop: 16 }}>
            <p style={{ color: '#ef4444', fontSize: 14, fontWeight: 500, margin: 0 }}>{error}</p>
          </div>
        )}
      </div>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #334155' }}>
        <button onClick={handleBook} disabled={booking} data-testid="confirm-booking-btn" className="btn btn-success btn-block" style={{ fontSize: 18 }}>
          {booking ? <div className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} /> : 'Confirm Booking'}
        </button>
      </div>
    </div>
  );
}
