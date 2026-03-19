import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import { IoArrowBack, IoRefresh, IoTimeOutline, IoCheckmarkCircle } from 'react-icons/io5';
import axios from 'axios';

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL;

export default function AdminServices() {
  const { admin, token, loading: authLoading } = useAdmin();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !admin) { navigate('/admin', { replace: true }); return; }
    if (token) fetchServices();
  }, [admin, authLoading, token]);

  const fetchServices = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/services`);
      setServices(res.data);
    } catch {} finally { setLoading(false); }
  }, []);

  if (authLoading) return <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="spinner" /></div>;

  return (
    <div className="page" data-testid="admin-services-page">
      <div style={{ padding: '40px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => navigate('/admin/dashboard')} style={{ width: 40, height: 40, borderRadius: 20, background: '#1e293b', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IoArrowBack size={22} color="#fff" />
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, flex: 1 }}>Services</h1>
        <button onClick={() => { setLoading(true); fetchServices(); }} style={{ background: 'none', border: 'none', padding: 4 }}>
          <IoRefresh size={22} color="#8B5CF6" />
        </button>
      </div>

      <div style={{ flex: 1, padding: '0 20px', overflow: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="spinner" /></div>
        ) : services.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', paddingTop: 60 }}>No services configured</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 24 }}>
            {services.map((s) => (
              <div key={s.service_id || s.id} data-testid={`admin-service-${s.service_id || s.id}`} className="card">
                <div style={{ display: 'flex', gap: 14 }}>
                  {s.image_base64 && <img src={s.image_base64} alt={s.name} style={{ width: 70, height: 70, borderRadius: 12, objectFit: 'cover' }} />}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>{s.name}</h3>
                    <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 8px', lineHeight: '18px' }}>{s.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#8B5CF6', fontSize: 18, fontWeight: 800 }}>Rs.{s.price}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 13 }}>
                        <IoTimeOutline size={16} /> {s.duration || 60} min
                      </span>
                    </div>
                  </div>
                </div>
                {s.inclusions && s.inclusions.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {s.inclusions.map((inc, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <IoCheckmarkCircle size={16} color="#10b981" />
                        <span style={{ color: '#e2e8f0', fontSize: 13 }}>{inc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
