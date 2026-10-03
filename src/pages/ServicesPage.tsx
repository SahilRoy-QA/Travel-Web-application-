import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Car, Check, Clock, Compass, MapPin, Sparkles } from 'lucide-react';
import { db } from '../services/firebase';
import { useSettings } from '../context/SettingsContext';
import { sampleServices } from '../services/seedData';
import { ServiceItem } from '../types';

export const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { policies } = useSettings();
  const [services, setServices] = useState<ServiceItem[]>(sampleServices);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cab' | 'activity' | 'transfer'>('all');

  useEffect(() => {
    try {
      const q = query(collection(db, 'services'), where('isAvailable', '==', true));
      const unsub = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            setServices(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceItem)));
          }
        },
        () => {}
      );
      return () => unsub();
    } catch {
      // Fallback
    }
  }, []);

  const filtered = services.filter((s) => {
    if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
    return true;
  });

  const handleBookService = (service: ServiceItem) => {
    const params = new URLSearchParams({
      type: 'service',
      itemId: service.id,
      guestsCount: '1',
    });
    navigate(`/book?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
            Travel Add-Ons & Mobility
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 mt-1">
            Airport Cabs, Transfers & Experiences
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chauffeur-driven airport pickups, verified scuba dives, desert safaris, and private luxury yacht transfers.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All Services' },
            { id: 'cab', label: 'Airport & City Cabs' },
            { id: 'activity', label: 'Adventure Activities' },
            { id: 'transfer', label: 'Yacht & Water Transfers' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filtered.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl uppercase tracking-wider">
                    {service.category}
                  </div>
                </div>

                <div className="p-5">
                  {service.destinationCity && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-600" />
                      <span>{service.destinationCity}</span>
                    </div>
                  )}

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                    {service.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>

                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    {service.inclusions?.map((inc, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{inc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Starting from</span>
                    <span className="text-xl font-black text-slate-900">
                      {policies.currencySymbol}{service.price.toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleBookService(service)}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
