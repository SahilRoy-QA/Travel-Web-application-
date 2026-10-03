import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { ArrowRight, MapPin, Star } from 'lucide-react';
import { db } from '../../services/firebase';
import { useSettings } from '../../context/SettingsContext';
import { sampleHotels } from '../../services/seedData';
import { HomepageSection, Hotel } from '../../types';

export const FeaturedHotelsSection: React.FC<{ section: HomepageSection }> = ({ section }) => {
  const { policies } = useSettings();
  const [hotels, setHotels] = useState<Hotel[]>(sampleHotels);

  useEffect(() => {
    try {
      const q = query(
        collection(db, 'hotels'),
        where('isPublished', '==', true),
        limit(6)
      );
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Hotel));
            setHotels(items);
          }
        },
        (err) => {
          console.warn('Hotels snapshot notice:', err.message);
        }
      );
      return () => unsub();
    } catch {
      // Fallback to sample
    }
  }, []);

  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200/60 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Verified Properties
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {section.title}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{section.subtitle}</p>
          </div>
          <Link
            to="/hotels"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-500 transition group"
          >
            <span>View All Hotels</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {hotels.slice(0, 6).map((hotel) => (
            <Link
              key={hotel.id}
              to={`/hotels/${hotel.id}`}
              className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Photo Box */}
              <div className="relative aspect-16/10 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                  alt={hotel.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-xs text-xs font-black text-slate-900 dark:text-white">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{hotel.starRating}.0</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{hotel.destinationCity}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{hotel.propertyType}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                    {hotel.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400 mt-2.5">
                    {hotel.amenities?.slice(0, 3).map((a, i) => (
                      <span key={i} className="after:content-['·'] after:ml-2 last:after:content-none">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Starting from</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        {policies.currencySymbol}{hotel.minPrice.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">/ night</span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:underline">
                    View Details →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
