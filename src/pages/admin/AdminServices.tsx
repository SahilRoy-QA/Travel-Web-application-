import React, { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import {
  Compass,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../services/firebase';
import { useSettings } from '../../context/SettingsContext';
import { sampleServices } from '../../services/seedData';
import { ServiceItem } from '../../types';

export const AdminServices: React.FC = () => {
  const { policies } = useSettings();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'cab' | 'activity' | 'transfer'>('cab');
  const [price, setPrice] = useState(1200);
  const [destinationCity, setDestinationCity] = useState('New Delhi');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'services'), (snap) => {
      if (!snap.empty) {
        setServices(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceItem)));
      } else {
        setServices(sampleServices);
      }
    });

    return () => unsub();
  }, []);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docRef = doc(collection(db, 'services'));
      await setDoc(docRef, {
        id: docRef.id,
        title,
        category,
        price,
        destinationCity,
        description,
        image: imageUrl || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
        inclusions: ['Driver allowance', 'Toll tax', 'Sanitized vehicle'],
        isAvailable: true,
        createdAt: new Date().toISOString(),
      });
      setModalOpen(false);
      setTitle('');
      setDescription('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'services');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete service?')) return;
    try {
      await deleteDoc(doc(db, 'services', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `services/${id}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Travel Mobility & Services
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Airport express cabs, adventure scuba expeditions, and luxury catamaran transfers.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((srv) => (
          <div
            key={srv.id}
            className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-16/10 rounded-2xl overflow-hidden mb-4 bg-slate-900">
                <img src={srv.image} alt={srv.title} className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 bg-slate-950/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                  {srv.category}
                </span>
              </div>
              <h3 className="font-bold text-white text-sm line-clamp-1">{srv.title}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{srv.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-700/60 mt-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Rate</span>
                <span className="text-lg font-black text-white">
                  {policies.currencySymbol}{srv.price.toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => handleDelete(srv.id)}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition"
                title="Delete Service"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add Travel Service</h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Airport Express Luxury Sedan"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="cab">Cab Transfer</option>
                    <option value="activity">Adventure Activity</option>
                    <option value="transfer">Yacht / Water Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Price ({policies.currencySymbol})</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">City Location</label>
                <input
                  type="text"
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Brief Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl"
                >
                  {saving ? 'Saving...' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
