import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ArrowRight, MapPin } from 'lucide-react';
import { db } from '../../services/firebase';
import { sampleDestinations } from '../../services/seedData';
import { Destination, HomepageSection } from '../../types';

export const TrendingDestinationsSection: React.FC<{ section: HomepageSection }> = ({ section }) => {
  const [destinations, setDestinations] = useState<Destination[]>(sampleDestinations);

  useEffect(() => {
    try {
      const q = query(collection(db, 'destinations'), orderBy('order', 'asc'));
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Destination));
            setDestinations(items);
          }
        },
        (err) => {
          console.warn('Destinations snapshot notice:', err.message);
        }
      );
      return () => unsub();
    } catch {
      // Fallback to sample
    }
  }, []);

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Top Locations
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
          <span>Explore All Destinations</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
        {destinations.slice(0, 6).map((dest) => (
          <Link
            key={dest.id}
            to={`/hotels?city=${encodeURIComponent(dest.name)}`}
            className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-slate-900"
          >
            <div className="aspect-3/4 w-full">
              <img
                src={dest.image}
                alt={dest.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
              />
            </div>
            <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/30 to-transparent flex flex-col justify-end p-3.5 sm:p-4 text-white">
              <span className="text-base sm:text-lg font-black tracking-tight">{dest.name}</span>
              <span className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-orange-500" />
                {dest.state || dest.country}
              </span>
              <span className="text-[10px] text-orange-400 font-semibold mt-1">
                {dest.hotelCount || 10}+ Stays
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
