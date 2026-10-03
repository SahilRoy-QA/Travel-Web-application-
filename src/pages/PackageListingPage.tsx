import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Clock, Compass, Filter, MapPin, Search, Users } from 'lucide-react';
import { db } from '../services/firebase';
import { useSettings } from '../context/SettingsContext';
import { samplePackages } from '../services/seedData';
import { TourPackage } from '../types';

export const PackageListingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { policies } = useSettings();
  const destParam = searchParams.get('destination') || '';

  const [packages, setPackages] = useState<TourPackage[]>(samplePackages);
  const [searchTerm, setSearchTerm] = useState(destParam);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSearchTerm(destParam);
  }, [destParam]);

  useEffect(() => {
    setLoading(true);
    try {
      const q = query(collection(db, 'packages'), where('isPublished', '==', true));
      const unsub = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            setPackages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TourPackage)));
          }
          setLoading(false);
        },
        () => setLoading(false)
      );
      return () => unsub();
    } catch {
      setLoading(false);
    }
  }, []);

  const filtered = packages.filter((pkg) => {
    if (
      searchTerm &&
      !pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !pkg.destinationName.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    if (selectedDuration && pkg.durationDays !== selectedDuration) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
            Curated Holidays
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 mt-1">
            All Tour Packages & Escapes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Comprehensive itineraries with verified 4-star/5-star accommodations, private transfers, and local guides.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs mb-8 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by destination or package title..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Duration:</span>
            {[null, 4, 5, 6].map((dur) => (
              <button
                key={dur ?? 'all'}
                onClick={() => setSelectedDuration(dur)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedDuration === dur
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {dur ? `${dur} Days` : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Cards */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto">
            <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No Packages Found</h3>
            <p className="text-xs text-slate-500 mt-1">Try searching for other destinations like Kerala or Rajasthan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filtered.map((pkg) => (
              <Link
                key={pkg.id}
                to={`/packages/${pkg.id}`}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                    <img
                      src={pkg.images?.[0] || 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80'}
                      alt={pkg.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-orange-400" />
                      <span>{pkg.durationDays}D / {pkg.durationNights}N</span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-1.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span className="font-semibold text-slate-700">{pkg.destinationName}</span>
                      {pkg.agentName && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>By {pkg.agentName}</span>
                        </>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2">
                      {pkg.title}
                    </h3>

                    <ul className="mt-3 space-y-1 text-xs text-slate-500">
                      {pkg.inclusions?.slice(0, 2).map((inc, i) => (
                        <li key={i} className="flex items-center gap-2 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-600 shrink-0" />
                          <span className="truncate">{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Per Traveller</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-slate-900">
                          {policies.currencySymbol}{pkg.pricePerTraveller.toLocaleString()}
                        </span>
                        {pkg.originalPrice && (
                          <span className="text-xs text-slate-400 line-through">
                            {policies.currencySymbol}{pkg.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="px-4 py-2 bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs group-hover:bg-orange-500 transition-colors">
                      View Itinerary
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
