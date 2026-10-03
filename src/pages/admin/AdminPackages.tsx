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
  Clock,
  Edit,
  Luggage,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../services/firebase';
import { useSettings } from '../../context/SettingsContext';
import { samplePackages } from '../../services/seedData';
import { PackageItineraryDay, TourPackage } from '../../types';

export const AdminPackages: React.FC = () => {
  const { policies } = useSettings();
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<TourPackage | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [destinationName, setDestinationName] = useState('Kerala');
  const [agentName, setAgentName] = useState('ILLUSION Curated Escapes');
  const [durationDays, setDurationDays] = useState(5);
  const [durationNights, setDurationNights] = useState(4);
  const [pricePerTraveller, setPricePerTraveller] = useState(15000);
  const [originalPrice, setOriginalPrice] = useState(20000);
  const [maxGroupSize, setMaxGroupSize] = useState(12);
  const [imageUrl, setImageUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [itinerary, setItinerary] = useState<PackageItineraryDay[]>([
    {
      day: 1,
      title: 'Arrival & Welcome Dinner',
      description: 'Meet and greet at airport and hotel check-in.',
      meals: ['Dinner'],
      hotelStay: 'Luxury Resort',
    },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'packages'), (snap) => {
      if (!snap.empty) {
        setPackages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TourPackage)));
      } else {
        setPackages(samplePackages);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const openCreateModal = () => {
    setEditingPkg(null);
    setTitle('');
    setDestinationName('Kerala');
    setAgentName('ILLUSION Curated Escapes');
    setDurationDays(5);
    setDurationNights(4);
    setPricePerTraveller(15000);
    setOriginalPrice(20000);
    setMaxGroupSize(12);
    setImageUrl('https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80');
    setIsPublished(true);
    setItinerary([
      {
        day: 1,
        title: 'Arrival & Scenic Welcome',
        description: 'Airport reception and check-in to luxury resort.',
        meals: ['Dinner'],
        hotelStay: 'Luxury Resort & Spa',
      },
    ]);
    setModalOpen(true);
  };

  const openEditModal = (p: TourPackage) => {
    setEditingPkg(p);
    setTitle(p.title);
    setDestinationName(p.destinationName);
    setAgentName(p.agentName || 'ILLUSION Curated Escapes');
    setDurationDays(p.durationDays);
    setDurationNights(p.durationNights);
    setPricePerTraveller(p.pricePerTraveller);
    setOriginalPrice(p.originalPrice || p.pricePerTraveller * 1.2);
    setMaxGroupSize(p.maxGroupSize);
    setImageUrl(p.images?.[0] || '');
    setIsPublished(p.isPublished);
    setItinerary(p.itinerary || []);
    setModalOpen(true);
  };

  const addItineraryDay = () => {
    const nextDay = itinerary.length + 1;
    setItinerary([
      ...itinerary,
      {
        day: nextDay,
        title: `Day ${nextDay} Sightseeing & Excursions`,
        description: 'Guided morning exploration and afternoon leisure activities.',
        meals: ['Breakfast', 'Dinner'],
        hotelStay: 'Luxury Resort & Spa',
      },
    ]);
  };

  const removeItineraryDay = (index: number) => {
    const updated = itinerary.filter((_, i) => i !== index).map((d, idx) => ({ ...d, day: idx + 1 }));
    setItinerary(updated);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: Partial<TourPackage> = {
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        destinationName,
        destinationId: 'dest_' + destinationName.toLowerCase().replace(/[^a-z0-9]+/g, ''),
        agentName,
        durationDays,
        durationNights,
        pricePerTraveller,
        originalPrice,
        maxGroupSize,
        itinerary,
        inclusions: [
          '4 Nights luxury verified accommodations',
          'Daily buffet breakfast and dinners',
          'Private chauffeur AC transport',
          'All monument guide passes and boat cruises',
        ],
        exclusions: ['Airfare', 'Personal expenses', 'Optional sports'],
        departureDates: ['2026-10-25', '2026-11-10', '2026-11-25', '2026-12-10'],
        images: imageUrl ? [imageUrl] : [],
        isPublished,
        featured: true,
        updatedAt: new Date().toISOString(),
      };

      if (editingPkg) {
        await updateDoc(doc(db, 'packages', editingPkg.id), payload);
      } else {
        const docRef = doc(collection(db, 'packages'));
        await setDoc(docRef, {
          ...payload,
          id: docRef.id,
          createdAt: new Date().toISOString(),
        });
      }

      setModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'packages');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!window.confirm('Delete this tour package?')) return;
    try {
      await deleteDoc(doc(db, 'packages', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `packages/${id}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Tour Holiday Packages
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Build day-wise itineraries, schedule departure dates, configure group pricing, and assign tour agents.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Package</span>
        </button>
      </div>

      {/* Packages Table */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-900/60 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-4 px-4">Package</th>
                <th className="py-4 px-4">Destination</th>
                <th className="py-4 px-4">Duration</th>
                <th className="py-4 px-4">Rate / Person</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40 text-slate-300">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-slate-750 transition">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={pkg.images?.[0] || 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=200&q=80'}
                        alt={pkg.title}
                        className="w-12 h-10 rounded-xl object-cover shrink-0"
                      />
                      <div>
                        <span className="font-bold text-white text-sm block line-clamp-1">{pkg.title}</span>
                        <span className="text-[10px] text-slate-400">{pkg.agentName || 'ILLUSION'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-200">{pkg.destinationName}</td>
                  <td className="py-4 px-4">
                    <span className="flex items-center gap-1 font-bold text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-orange-400" />
                      {pkg.durationDays}D / {pkg.durationNights}N
                    </span>
                  </td>
                  <td className="py-4 px-4 font-black text-white">
                    {policies.currencySymbol}{pkg.pricePerTraveller.toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                        pkg.isPublished
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {pkg.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(pkg)}
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
                      title="Edit Package"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                      title="Delete Package"
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

      {/* Package Create/Edit Modal with Day-Wise Itinerary Builder */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">
                {editingPkg ? 'Edit Holiday Tour Package' : 'Create Holiday Tour Package'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">Package Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Enchanting Kerala Backwaters Cruise"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Destination Name *</label>
                  <input
                    type="text"
                    required
                    value={destinationName}
                    onChange={(e) => setDestinationName(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Agency / Operator Name</label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Days</label>
                    <input
                      type="number"
                      min="1"
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Nights</label>
                    <input
                      type="number"
                      min="1"
                      value={durationNights}
                      onChange={(e) => setDurationNights(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Price per Person ({policies.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={pricePerTraveller}
                    onChange={(e) => setPricePerTraveller(Number(e.target.value))}
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
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Day-Wise Itinerary Builder */}
              <div className="border-t border-slate-800 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Day-Wise Itinerary Builder</h4>
                    <p className="text-xs text-slate-400">Configure daily schedule, meals, and hotel stay.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addItineraryDay}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-orange-400 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Day</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {itinerary.map((day, idx) => (
                    <div key={idx} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-orange-400">Day {day.day}</span>
                        {itinerary.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItineraryDay(idx)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            Remove Day
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Day Title (e.g. Arrival in Munnar)"
                        value={day.title}
                        onChange={(e) => {
                          const updated = [...itinerary];
                          updated[idx].title = e.target.value;
                          setItinerary(updated);
                        }}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white"
                      />

                      <textarea
                        rows={2}
                        placeholder="Day description and highlights..."
                        value={day.description}
                        onChange={(e) => {
                          const updated = [...itinerary];
                          updated[idx].description = e.target.value;
                          setItinerary(updated);
                        }}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300"
                      />
                    </div>
                  ))}
                </div>
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
                  {saving ? 'Saving...' : 'Save Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
