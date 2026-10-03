import React, { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  Check,
  Edit,
  Hotel as HotelIcon,
  Image,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../services/firebase';
import { useSettings } from '../../context/SettingsContext';
import { sampleHotels } from '../../services/seedData';
import { Hotel, RoomType } from '../../types';

export const AdminHotels: React.FC = () => {
  const { policies } = useSettings();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit/Create Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [destinationCity, setDestinationCity] = useState('Goa');
  const [starRating, setStarRating] = useState(5);
  const [propertyType, setPropertyType] = useState<'hotel' | 'resort' | 'villa' | 'apartment'>('resort');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [minPrice, setMinPrice] = useState(5000);
  const [featured, setFeatured] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubH = onSnapshot(collection(db, 'hotels'), (snap) => {
      if (!snap.empty) {
        setHotels(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Hotel)));
      } else {
        setHotels(sampleHotels);
      }
      setLoading(false);
    });

    const unsubR = onSnapshot(collection(db, 'rooms'), (snap) => {
      if (!snap.empty) {
        setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RoomType)));
      }
    });

    return () => {
      unsubH();
      unsubR();
    };
  }, []);

  const openCreateModal = () => {
    setEditingHotel(null);
    setName('');
    setDestinationCity('Goa');
    setStarRating(5);
    setPropertyType('resort');
    setDescription('');
    setAddress('');
    setMinPrice(5000);
    setFeatured(false);
    setIsPublished(true);
    setImageUrl('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80');
    setModalOpen(true);
  };

  const openEditModal = (h: Hotel) => {
    setEditingHotel(h);
    setName(h.name);
    setDestinationCity(h.destinationCity);
    setStarRating(h.starRating);
    setPropertyType(h.propertyType as any);
    setDescription(h.description);
    setAddress(h.address);
    setMinPrice(h.minPrice);
    setFeatured(h.featured);
    setIsPublished(h.isPublished);
    setImageUrl(h.images?.[0] || '');
    setModalOpen(true);
  };

  const handleSaveHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: Partial<Hotel> = {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        destinationCity,
        starRating,
        propertyType,
        description,
        address,
        minPrice,
        featured,
        isPublished,
        images: imageUrl ? [imageUrl] : [],
        amenities: [
          'Infinity Pool',
          'High-Speed Wi-Fi',
          'Spa & Wellness',
          'Complimentary Breakfast',
          'Beachfront Access',
        ],
        policies: {
          checkInTime: '14:00',
          checkOutTime: '11:00',
          cancellationPolicy: 'Free cancellation up to 24 hours prior.',
          houseRules: ['ID required at check-in.'],
        },
        updatedAt: new Date().toISOString(),
      };

      if (editingHotel) {
        await updateDoc(doc(db, 'hotels', editingHotel.id), payload);
      } else {
        const docRef = doc(collection(db, 'hotels'));
        await setDoc(docRef, {
          ...payload,
          id: docRef.id,
          createdAt: new Date().toISOString(),
        });

        // Add a default room type
        const roomRef = doc(collection(db, 'rooms'));
        await setDoc(roomRef, {
          id: roomRef.id,
          hotelId: docRef.id,
          name: 'Deluxe Suite',
          description: 'Spacious suite with balcony and marble bath.',
          maxGuests: 2,
          bedType: '1 King Bed',
          basePrice: minPrice,
          totalInventory: 10,
          isAvailable: true,
          amenities: ['Balcony', 'Smart TV', 'Wi-Fi'],
          images: imageUrl ? [imageUrl] : [],
          createdAt: new Date().toISOString(),
        });
      }

      setModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'hotels');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHotel = async (id: string) => {
    if (!window.confirm('Delete this hotel property and its rooms?')) return;
    try {
      await deleteDoc(doc(db, 'hotels', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `hotels/${id}`);
    }
  };

  const togglePublish = async (h: Hotel) => {
    try {
      await updateDoc(doc(db, 'hotels', h.id), {
        isPublished: !h.isPublished,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `hotels/${h.id}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Hotels & Accommodations Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage properties, room configurations, per-night rates, and live publication status.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Property</span>
        </button>
      </div>

      {/* Hotels Table */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-900/60 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-4 px-4">Property</th>
                <th className="py-4 px-4">City / Region</th>
                <th className="py-4 px-4">Rating</th>
                <th className="py-4 px-4">Min Rate</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40 text-slate-300">
              {hotels.map((h) => (
                <tr key={h.id} className="hover:bg-slate-750 transition">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={h.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=200&q=80'}
                        alt={h.name}
                        className="w-12 h-10 rounded-xl object-cover shrink-0"
                      />
                      <div>
                        <span className="font-bold text-white text-sm block">{h.name}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{h.propertyType}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-200">{h.destinationCity}</td>
                  <td className="py-4 px-4">
                    <span className="flex items-center gap-1 font-bold text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {h.starRating}.0
                    </span>
                  </td>
                  <td className="py-4 px-4 font-black text-white">
                    {policies.currencySymbol}{h.minPrice.toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => togglePublish(h)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider cursor-pointer transition ${
                        h.isPublished
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {h.isPublished ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(h)}
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
                      title="Edit Hotel"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteHotel(h.id)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                      title="Delete Hotel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hotel Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">
                {editingHotel ? 'Edit Property Details' : 'Add New Accommodation'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHotel} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">Property Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. The Grand Horizon Resort"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">City / Destination *</label>
                  <input
                    type="text"
                    required
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                    placeholder="e.g. Goa, Jaipur"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Property Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white capitalize cursor-pointer"
                  >
                    <option value="hotel">Hotel</option>
                    <option value="resort">Resort</option>
                    <option value="villa">Villa</option>
                    <option value="apartment">Apartment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Star Rating (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={starRating}
                    onChange={(e) => setStarRating(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Starting Price per Night ({policies.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">Photo Image URL *</label>
                  <input
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">Full Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe amenities, location, dining, views..."
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">Physical Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Beach Road, South Goa..."
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="accent-orange-600 rounded-sm"
                  />
                  <span>Feature on Homepage</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="accent-orange-600 rounded-sm"
                  />
                  <span>Publish Immediately</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
