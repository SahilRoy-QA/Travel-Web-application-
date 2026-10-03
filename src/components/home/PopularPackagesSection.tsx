import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { ArrowRight, Clock, MapPin, Users } from 'lucide-react';
import { db } from '../../services/firebase';
import { useSettings } from '../../context/SettingsContext';
import { samplePackages } from '../../services/seedData';
import { HomepageSection, TourPackage } from '../../types';

export const PopularPackagesSection: React.FC<{ section: HomepageSection }> = ({ section }) => {
  const { policies } = useSettings();
  const [packages, setPackages] = useState<TourPackage[]>(samplePackages);

  useEffect(() => {
    try {
      const q = query(
        collection(db, 'packages'),
        where('isPublished', '==', true),
        limit(4)
      );
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TourPackage));
            setPackages(items);
          }
        },
        (err) => {
          console.warn('Packages snapshot notice:', err.message);
        }
      );
      return () => unsub();
    } catch {
      // Fallback
    }
  }, []);

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Holiday Escapes
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {section.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{section.subtitle}</p>
        </div>
        <Link
          to="/packages"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-500 transition group"
        >
          <span>View All Tour Packages</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {packages.slice(0, 3).map((pkg) => (
          <Link
            key={pkg.id}
            to={`/packages/${pkg.id}`}
            className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
          >
            {/* Image box */}
            <div className="relative aspect-16/10 overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={pkg.images?.[0] || 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80'}
                alt={pkg.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>{pkg.durationDays}D / {pkg.durationNights}N</span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{pkg.destinationName}</span>
                  {pkg.agentName && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">By {pkg.agentName}</span>
                    </>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-2">
                  {pkg.title}
                </h3>

                <ul className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {pkg.inclusions?.slice(0, 2).map((inc, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      <span className="truncate">{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Per Traveller</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {policies.currencySymbol}{pkg.pricePerTraveller.toLocaleString()}
                    </span>
                    {pkg.originalPrice && (
                      <span className="text-xs text-slate-400 line-through">
                        {policies.currencySymbol}{pkg.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:underline">
                  Explore Itinerary →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
