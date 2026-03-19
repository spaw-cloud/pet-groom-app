import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoArrowBack, IoLocation, IoAdd, IoClose, IoNavigate } from 'react-icons/io5';
import api from '../lib/api';

export default function SelectAddress() {
  const navigate = useNavigate();
  const location = useLocation();
  const { service, petId, petName, date, time } = location.state || {};
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ house_number: '', street: '', area: '', city: '', pincode: '', landmark: '' });
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => { if (!service) navigate('/tabs', { replace: true }); }, [service]);

  const fetchAddresses = useCallback(async () => {
    try { const res = await api.get('/addresses'); setAddresses(res.data); }
    catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const handleSave = async () => {
    if (!form.house_number || !form.street || !form.area || !form.city || !form.pincode) return;
    try {
      setSaving(true);
      await api.post('/addresses', form);
      setShowModal(false);
      setForm({ house_number: '', street: '', area: '', city: '', pincode: '', landmark: '' });
      fetchAddresses();
    } catch {} finally { setSaving(false); }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm(f => ({ ...f, area: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
        setGettingLocation(false);
      },
      () => { setGettingLocation(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!service) return null;

  return (
    <div className="page" data-testid="select-address-page">
      <div style={{ padding: '48px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: 20, background: '#1e293b', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IoArrowBack size={22} color="#fff" />
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, flex: 1 }}>Select Address</h1>
      </div>

      <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="spinner" /></div>
        ) : (
          <>
            {addresses.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 60 }}>
                <IoLocation size={48} color="#334155" />
                <p style={{ color: '#94a3b8', fontSize: 16, marginTop: 16 }}>No saved addresses</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {addresses.map((addr) => {
                  const id = addr.address_id || addr.id;
                  const isSelected = selectedAddress === id;
                  return (
                    <button key={id} onClick={() => setSelectedAddress(id)} data-testid={`select-address-${id}`}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: isSelected ? 'rgba(139,92,246,0.06)' : '#1e293b', borderRadius: 14, padding: 16, border: `2px solid ${isSelected ? '#8B5CF6' : '#334155'}`, textAlign: 'left', cursor: 'pointer', width: '100%' }}>
                      <IoLocation size={22} color="#3b82f6" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>{addr.house_number}, {addr.street}</p>
                        <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>{addr.area}, {addr.city} - {addr.pincode}</p>
                        {addr.landmark && <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>Landmark: {addr.landmark}</p>}
                      </div>
                      <div style={{ width: 24, height: 24, borderRadius: 12, border: `2px solid ${isSelected ? '#8B5CF6' : '#334155'}`, background: isSelected ? '#8B5CF6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        {isSelected && <div style={{ width: 10, height: 10, borderRadius: 5, background: '#fff' }} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <button onClick={() => setShowModal(true)} data-testid="add-address-in-booking-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 16, background: '#1e293b', borderRadius: 14, border: '2px dashed #334155', color: '#8B5CF6', fontSize: 16, fontWeight: 600, marginTop: 16, cursor: 'pointer' }}>
              <IoAdd size={22} /> Add New Address
            </button>
          </>
        )}
      </div>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #334155' }}>
        <button onClick={() => {
          const addr = addresses.find(a => (a.address_id || a.id) === selectedAddress);
          navigate('/booking/confirmation', { state: { service, petId, petName, date, time, addressId: selectedAddress, address: addr ? `${addr.house_number}, ${addr.street}, ${addr.area}, ${addr.city} - ${addr.pincode}` : '' } });
        }} disabled={!selectedAddress} data-testid="continue-to-confirmation-btn" className="btn btn-primary btn-block" style={{ fontSize: 18 }}>
          Continue
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay center" onClick={() => setShowModal(false)}>
          <div className="modal-content centered" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Add Address</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none' }}><IoClose size={24} color="#fff" /></button>
            </div>
            <button onClick={handleUseLocation} disabled={gettingLocation}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 12, background: 'rgba(59,130,246,0.1)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', fontSize: 14, fontWeight: 600, marginBottom: 16, cursor: 'pointer' }}>
              <IoNavigate size={18} /> {gettingLocation ? 'Getting location...' : 'Use My Current Location'}
            </button>
            <input className="text-input" placeholder="House/Flat Number *" value={form.house_number} onChange={e => setForm(f => ({ ...f, house_number: e.target.value }))} />
            <input className="text-input" placeholder="Street *" value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} />
            <input className="text-input" placeholder="Area *" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} />
            <div style={{ display: 'flex', gap: 12 }}>
              <input className="text-input" placeholder="City *" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={{ flex: 1 }} />
              <input className="text-input" placeholder="Pincode *" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} style={{ flex: 1 }} />
            </div>
            <input className="text-input" placeholder="Landmark (optional)" value={form.landmark} onChange={e => setForm(f => ({ ...f, landmark: e.target.value }))} />
            <button onClick={handleSave} disabled={saving || !form.house_number || !form.street || !form.area || !form.city || !form.pincode} className="btn btn-primary btn-block" style={{ marginTop: 8 }}>
              {saving ? <div className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} /> : 'Save Address'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
