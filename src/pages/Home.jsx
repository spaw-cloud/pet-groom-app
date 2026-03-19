import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IoSearch, IoStar, IoTimeOutline, IoChevronForward, IoRefresh } from 'react-icons/io5';
import NotificationBell from '../components/NotificationBell';
import InstallBanner from '../components/InstallBanner';
import api from '../lib/api';

export default function Home() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      const res = await api.get('/services');
      setServices(res.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const filtered = services.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div data-testid="home-page" style={{ flex: 1, background: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, color: '#94a3b8' }}>Hello, {user?.name?.split(' ')[0] || 'there'}</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 0', fontFamily: "'Playfair Display', serif" }}>Our Services</h1>
        </div>
        <NotificationBell token={token} type="user" />
      </div>

      {/* Search */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#1e293b', borderRadius: 12, padding: '0 16px', gap: 12, border: '1px solid #334155' }}>
          <IoSearch size={20} color="#64748b" />
          <input type="text" placeholder="Search services..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            data-testid="search-services-input" style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 16, padding: '14px 0', fontFamily: "'Outfit', sans-serif" }} />
        </div>
      </div>

      {/* Services List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 16 }}>
            <div style={{ fontSize: 48, opacity: 0.3 }}>?</div>
            <p style={{ color: '#94a3b8', fontSize: 16 }}>{searchQuery ? 'No matching services' : 'No services available'}</p>
            <button onClick={() => { setRefreshing(true); fetchServices(); }} className="btn btn-ghost" style={{ fontSize: 14 }}>
              <IoRefresh size={18} /> Refresh
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
            {filtered.map((service) => (
              <button key={service.service_id || service.id} data-testid={`service-card-${service.service_id || service.id}`}
                onClick={() => navigate('/booking/service-detail', { state: { service } })}
                style={{ background: '#1e293b', borderRadius: 16, overflow: 'hidden', border: '1px solid #334155', textAlign: 'left', cursor: 'pointer', width: '100%' }}>
                {service.image_base64 && (
                  <div style={{ height: 160, overflow: 'hidden' }}>
                    <img src={service.image_base64} alt={service.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>{service.name}</h3>
                    <IoChevronForward size={20} color="#8B5CF6" />
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: 14, margin: '8px 0 12px', lineHeight: '20px' }}>{service.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#8B5CF6' }}>Rs.{service.price}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 13 }}>
                      <IoTimeOutline size={16} />
                      <span>{service.duration || '60 min'}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <InstallBanner />
    </div>
  );
}
