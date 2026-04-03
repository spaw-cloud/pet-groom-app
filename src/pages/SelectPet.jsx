import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoArrowBack, IoPaw, IoAdd, IoClose } from 'react-icons/io5';
import api from '../lib/api';

export default function SelectPet() {
  const navigate = useNavigate();
  const location = useLocation();
  const service = location.state?.service;
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', breed: '', age: '', weight: '', special_notes: '' });

  useEffect(() => { if (!service) navigate('/tabs', { replace: true }); }, [service]);

  const fetchPets = useCallback(async () => {
    try { const res = await api.get('/api/pets'); setPets(res.data); }
    catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPets(); }, [fetchPets]);

  const handleSave = async () => {
    if (!form.name || !form.breed) return;
    try {
      setSaving(true);
      await api.post('/api/pets', form);
      setShowModal(false);
      setForm({ name: '', breed: '', age: '', weight: '', special_notes: '' });
      fetchPets();
    } catch {} finally { setSaving(false); }
  };

  if (!service) return null;

  return (
    <div className="page" data-testid="select-pet-page">
      <div style={{ padding: '48px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: 20, background: '#1e293b', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IoArrowBack size={22} color="#fff" />
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, flex: 1 }}>Select Pet</h1>
      </div>

      <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="spinner" /></div>
        ) : (
          <>
            {pets.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 60 }}>
                <IoPaw size={48} color="#334155" />
                <p style={{ color: '#94a3b8', fontSize: 16, marginTop: 16 }}>No pets added yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pets.map((pet) => {
                  const id = pet.pet_id || pet.id;
                  const isSelected = selectedPet === id;
                  return (
                    <button key={id} onClick={() => setSelectedPet(id)} data-testid={`select-pet-${id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, background: isSelected ? 'rgba(139,92,246,0.06)' : '#1e293b', borderRadius: 14, padding: 16, border: `2px solid ${isSelected ? '#8B5CF6' : '#334155'}`, textAlign: 'left', cursor: 'pointer', width: '100%' }}>
                      <div style={{ width: 46, height: 46, borderRadius: 23, background: 'rgba(236,72,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <IoPaw size={24} color="#ec4899" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>{pet.name}</h3>
                        <p style={{ color: '#94a3b8', fontSize: 13, margin: '2px 0 0' }}>{pet.breed}{pet.age ? ` | ${pet.age} yrs` : ''}</p>
                      </div>
                      <div style={{ width: 24, height: 24, borderRadius: 12, border: `2px solid ${isSelected ? '#8B5CF6' : '#334155'}`, background: isSelected ? '#8B5CF6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isSelected && <div style={{ width: 10, height: 10, borderRadius: 5, background: '#fff' }} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <button onClick={() => setShowModal(true)} data-testid="add-pet-in-booking-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 16, background: '#1e293b', borderRadius: 14, border: '2px dashed #334155', color: '#8B5CF6', fontSize: 16, fontWeight: 600, marginTop: 16, cursor: 'pointer' }}>
              <IoAdd size={22} /> Add New Pet
            </button>
          </>
        )}
      </div>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #334155' }}>
        <button onClick={() => navigate('/booking/select-datetime', { state: { service, petId: selectedPet, petName: pets.find(p => (p.pet_id || p.id) === selectedPet)?.name } })}
          disabled={!selectedPet} data-testid="continue-to-datetime-btn" className="btn btn-primary btn-block" style={{ fontSize: 18 }}>
          Continue
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay center" onClick={() => setShowModal(false)}>
          <div className="modal-content centered" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Add New Pet</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none' }}><IoClose size={24} color="#fff" /></button>
            </div>
            <input className="text-input" placeholder="Pet Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className="text-input" placeholder="Breed *" value={form.breed} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))} />
            <div style={{ display: 'flex', gap: 12 }}>
              <input className="text-input" placeholder="Age" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} style={{ flex: 1 }} />
              <input className="text-input" placeholder="Weight" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} style={{ flex: 1 }} />
            </div>
            <textarea className="text-input" placeholder="Special notes" value={form.special_notes} onChange={e => setForm(f => ({ ...f, special_notes: e.target.value }))} />
            <button onClick={handleSave} disabled={saving || !form.name || !form.breed} className="btn btn-primary btn-block" style={{ marginTop: 8 }}>
              {saving ? <div className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} /> : 'Save Pet'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
