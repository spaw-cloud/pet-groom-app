import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IoPerson, IoMail, IoCall, IoLogOut, IoLocation, IoAdd, IoClose, IoTrash, IoChevronForward, IoNavigate } from 'react-icons/io5';
import api from '../lib/api';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ house_number: '', street: '', area: '', city: '', pincode: '', landmark: '' });
  const [deleteId, setDeleteId] = useState(null);

  const fetchAddresses = useCallback(async () => {
    try { const res = await api.get('/api/addresses'); setAddresses(res.data); }
    catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const handleSaveAddress = async () => {
    if (!form.house_number || !form.street || !form.area || !form.city || !form.pincode) return;
    try {
      setSaving(true);
      await api.post('/api/addresses', form);
      setShowAddressModal(false);
      setForm({ house_number: '', street: '', area: '', city: '', pincode: '', landmark: '' });
      fetchAddresses();
    } catch {} finally { setSaving(false); }
  };

  const handleDeleteAddress = async (addrId) => {
    try {
      await api.delete(`/api/addresses/${addrId}`);
      setAddresses(prev => prev.filter(a => (a.address_id || a.id) !== addrId));
    } catch {} finally { setDeleteId(null); }
  };

  const handleLogout = async () => { await logout(); navigate('/', { replace: true }); };

  return (
    <div data-testid="profile-page" style={{ flex: 1, background: '#0f172a', padding: 20, overflow: 'auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24, fontFamily: "'Playfair Display', serif" }}>Profile</h1>

      {/* User Info Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: 30, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#8B5CF6', fontSize: 24, fontWeight: 800 }}>{(user?.name || '?')[0].toUpperCase()}</span>
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>{user?.name || 'User'}</h2>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>Member</p>
          </div>
        </div>
        {[{ icon: IoMail, label: user?.email || 'No email' }, { icon: IoCall, label: user?.phone_number || user?.phone || 'No phone' }].map(({ icon: Icon, label }, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i === 0 ? '1px solid #334155' : 'none' }}>
            <Icon size={18} color="#8B5CF6" />
            <span style={{ color: '#e2e8f0', fontSize: 14 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Saved Addresses */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Saved Addresses</h2>
        <button onClick={() => setShowAddressModal(true)} data-testid="add-address-btn" className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13, borderRadius: 10 }}>
          <IoAdd size={18} /> Add
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 30 }}><div className="spinner" /></div>
      ) : addresses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <IoLocation size={36} color="#334155" />
          <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 12 }}>No saved addresses</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {addresses.map((addr) => {
            const id = addr.address_id || addr.id;
            return (
              <div key={id} data-testid={`address-card-${id}`} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <IoLocation size={20} color="#3b82f6" style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>{addr.house_number}, {addr.street}</p>
                  <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>{addr.area}, {addr.city} - {addr.pincode}</p>
                  {addr.landmark && <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>Landmark: {addr.landmark}</p>}
                </div>
                <button onClick={() => setDeleteId(id)} data-testid={`delete-address-${id}`} style={{ background: 'none', border: 'none', padding: 4 }}>
                  <IoTrash size={18} color="#ef4444" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Logout */}
      <button onClick={handleLogout} data-testid="logout-btn" className="btn btn-block" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', marginTop: 16, marginBottom: 24 }}>
        <IoLogOut size={20} /> Logout
      </button>

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="modal-overlay center" onClick={() => setShowAddressModal(false)}>
          <div className="modal-content centered" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Add Address</h2>
              <button onClick={() => setShowAddressModal(false)} style={{ background: 'none', border: 'none' }}><IoClose size={24} color="#fff" /></button>
            </div>
            <input className="text-input" placeholder="House/Flat Number *" value={form.house_number} onChange={e => setForm(f => ({ ...f, house_number: e.target.value }))} data-testid="addr-house-input" />
            <input className="text-input" placeholder="Street *" value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} data-testid="addr-street-input" />
            <input className="text-input" placeholder="Area *" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} data-testid="addr-area-input" />
            <div style={{ display: 'flex', gap: 12 }}>
              <input className="text-input" placeholder="City *" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} data-testid="addr-city-input" style={{ flex: 1 }} />
              <input className="text-input" placeholder="Pincode *" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} data-testid="addr-pincode-input" style={{ flex: 1 }} />
            </div>
            <input className="text-input" placeholder="Landmark (optional)" value={form.landmark} onChange={e => setForm(f => ({ ...f, landmark: e.target.value }))} data-testid="addr-landmark-input" />
            <button onClick={handleSaveAddress} disabled={saving || !form.house_number || !form.street || !form.area || !form.city || !form.pincode}
              data-testid="save-address-btn" className="btn btn-primary btn-block" style={{ marginTop: 8 }}>
              {saving ? <div className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} /> : 'Save Address'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="modal-overlay center" onClick={() => setDeleteId(null)}>
          <div className="modal-content centered" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', padding: 32 }}>
            <IoTrash size={40} color="#ef4444" />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '16px 0 8px' }}>Delete Address?</h3>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleteId(null)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => handleDeleteAddress(deleteId)} data-testid="confirm-delete-address-btn" className="btn btn-danger" style={{ flex: 1 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
