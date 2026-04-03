import React, { useState, useEffect, useCallback } from 'react';
import { IoPaw, IoAdd, IoClose, IoTrash } from 'react-icons/io5';
import api from '../lib/api';

export default function Pets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    special_notes: ''
  });
  const [deleteId, setDeleteId] = useState(null);

  const fetchPets = useCallback(async () => {
    try {
      setLoading(true);

      // ✅ FIXED
      const res = await api.get('/pets');

      setPets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Pets fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const handleSave = async () => {
    if (!form.name || !form.breed) return;

    try {
      setSaving(true);

      await api.post('/pets', form);

      setShowModal(false);
      setForm({
        name: '',
        breed: '',
        age: '',
        weight: '',
        special_notes: ''
      });

      fetchPets();
    } catch (err) {
      console.error("Save pet error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (petId) => {
    try {
      // ✅ FIXED
      await api.delete(`/pets/${petId}`);

      setPets(prev =>
        prev.filter(p => (p.pet_id || p.id) !== petId)
      );
    } catch (err) {
      console.error("Delete pet error:", err);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div style={{ flex: 1, background: '#0f172a', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>My Pets</h1>

        <button onClick={() => setShowModal(true)}>
          <IoAdd size={20} /> Add Pet
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : pets.length === 0 ? (
        <p>No pets added yet</p>
      ) : (
        pets.map((pet) => {
          const id = pet.pet_id || pet.id;

          return (
            <div key={id} style={{ marginBottom: 10 }}>
              <h3>{pet.name}</h3>
              <p>{pet.breed}</p>

              <button onClick={() => setDeleteId(id)}>
                <IoTrash />
              </button>
            </div>
          );
        })
      )}

      {/* Add Modal */}
      {showModal && (
        <div>
          <input
            placeholder="Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />

          <input
            placeholder="Breed"
            value={form.breed}
            onChange={e => setForm(f => ({ ...f, breed: e.target.value }))}
          />

          <button onClick={handleSave} disabled={saving}>
            Save
          </button>
        </div>
      )}
    </div>
  );
}