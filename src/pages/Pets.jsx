import React, { useState, useEffect, useCallback } from 'react';
import { IoPaw, IoAdd, IoClose, IoTrash, IoRefresh } from 'react-icons/io5';
import api from '../lib/api';

export default function Pets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', breed: '', age: '', weight: '', special_notes: '' });
  const [deleteId, setDeleteId] = useState(null);

  const fetchPets = useCallback(async () => {
    try {
      const res = await api.get('/api/pets');
      setPets(res.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPets(); }, [fetchPets]);

  const handleSave = async () => {
    if (!form.name || !form.breed) return;
    try {
      setSaving(true);
      await api.post('/pets', form);
      setShowModal(false);
      setForm({ name: '', breed: '', age: '', weight: '', special_notes: '' });
      fetchPets();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (petId) => {
    try {
      await api.delete(`/api/pets/${petId}`);
      setPets(prev => prev.filter(p => (p.pet_id || p.id) !== petId));
    } catch {} finally { setDeleteId(null); }
  };

  return (
    <div data-testid="pets-page" style={{ flex: 1, background: '#0f172a', padding: 20, overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>My Pets</h1>
        <button onClick={() => setShowModal(true)} data-testid="add-pet-btn" className="btn btn-primary" style={{ padding: '10px 16px', fontSize: 14, borderRadius: 10 }}>
          <IoAdd size={20} /> Add Pet
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="spinner" /></div>
      ) : pets.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 16 }}>
          <IoPaw size={48} color="#334155" />
          <p style={{ color: '#94a3b8', fontSize: 16 }}>No pets added yet</p>
          <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>Add your furry friend to start booking grooming sessions</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {pets.map((pet) => {
            const id = pet.pet_id || pet.id;
            return (
              <div key={id} data-testid={`pet-card-${id}`} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 50, height: 50, borderRadius: 25, background: 'rgba(236,72,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IoPaw size={26} color="#ec4899" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>{pet.name}</h3>
                    <p style={{ color: '#94a3b8', fontSize: 13, margin: '2px 0 0' }}>
                      {pet.breed}{pet.age ? ` | ${pet.age} yrs` : ''}{pet.weight ? ` | ${pet.weight}` : ''}
                    </p>
                    {pet.special_notes && <p style={{ color: '#64748b', fontSize: 12, fontStyle: 'italic', margin: '4px 0 0' }}>{pet.special_notes}</p>}
                  </div>
                  <button onClick={() => setDeleteId(id)} data-testid={`delete-pet-${id}`} style={{ background: 'none', border: 'none', padding: 4 }}>
                    <IoTrash size={20} color="#ef4444" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Pet Modal */}
      {showModal && (
        <div className="modal-overlay center" onClick={() => setShowModal(false)}>
          <div className="modal-content centered" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Add New Pet</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none' }}><IoClose size={24} color="#fff" /></button>
            </div>
            <input className="text-input" placeholder="Pet Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} data-testid="pet-name-input" />
            <input className="text-input" placeholder="Breed *" value={form.breed} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))} data-testid="pet-breed-input" />
            <div style={{ display: 'flex', gap: 12 }}>
              <input className="text-input" placeholder="Age (years)" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} data-testid="pet-age-input" style={{ flex: 1 }} />
              <input className="text-input" placeholder="Weight" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} data-testid="pet-weight-input" style={{ flex: 1 }} />
            </div>
            <textarea className="text-input" placeholder="Special notes" value={form.special_notes} onChange={e => setForm(f => ({ ...f, special_notes: e.target.value }))} data-testid="pet-notes-input" />
            <button onClick={handleSave} disabled={saving || !form.name || !form.breed} data-testid="save-pet-btn" className="btn btn-primary btn-block" style={{ marginTop: 8 }}>
              {saving ? <div className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} /> : 'Save Pet'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="modal-overlay center" onClick={() => setDeleteId(null)}>
          <div className="modal-content centered" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', padding: 32 }}>
            <IoTrash size={40} color="#ef4444" />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '16px 0 8px' }}>Delete Pet?</h3>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleteId(null)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} data-testid="confirm-delete-pet-btn" className="btn btn-danger" style={{ flex: 1 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
