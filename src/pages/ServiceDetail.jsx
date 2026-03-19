import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoArrowBack, IoTimeOutline, IoCheckmarkCircle } from 'react-icons/io5';

export default function ServiceDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const service = location.state?.service;

  if (!service) { navigate('/tabs', { replace: true }); return null; }

  return (
    <div className="page" data-testid="service-detail-page">
      {/* Header Image */}
      {service.image_base64 && (
        <div style={{ position: 'relative', height: 220 }}>
          <img src={service.image_base64} alt={service.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 50%, rgba(15,23,42,0.95))' }} />
          <button onClick={() => navigate(-1)} data-testid="back-from-service-detail" style={{ position: 'absolute', top: 40, left: 16, width: 40, height: 40, borderRadius: 20, background: 'rgba(0,0,0,0.5)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IoArrowBack size={22} color="#fff" />
          </button>
        </div>
      )}

      <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
        {!service.image_base64 && (
          <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: 20, background: '#1e293b', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <IoArrowBack size={22} color="#fff" />
          </button>
        )}

        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>{service.name}</h1>
        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: '22px', marginBottom: 20 }}>{service.description}</p>

        {/* Duration & Price */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ flex: 1, textAlign: 'center' }}>
            <IoTimeOutline size={24} color="#8B5CF6" />
            <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '8px 0 4px' }}>{service.duration || '60 mins'}</p>
            <p style={{ color: '#94a3b8', fontSize: 12 }}>Duration</p>
          </div>
          <div className="card" style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: 24, color: '#8B5CF6', fontWeight: 800 }}>Rs.</span>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '8px 0 4px' }}>{service.price}</p>
            <p style={{ color: '#94a3b8', fontSize: 12 }}>Price</p>
          </div>
        </div>

        {/* Inclusions */}
        {(service.included_services || service.inclusions)?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>What's Included</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(service.included_services || service.inclusions).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <IoCheckmarkCircle size={20} color="#10b981" />
                  <span style={{ color: '#e2e8f0', fontSize: 15 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Book Now Button */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #334155' }}>
        <button onClick={() => navigate('/booking/select-pet', { state: { service } })} data-testid="book-now-btn" className="btn btn-primary btn-block" style={{ fontSize: 18 }}>
          Book Now - Rs.{service.price}
        </button>
      </div>
    </div>
  );
}
