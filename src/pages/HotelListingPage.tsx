import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import {
  ArrowUpDown,
  Filter,
  Grid,
  Heart,
  List,
  MapPin,
  RotateCcw,
  Search,
  Star,
  X,
} from 'lucide-react';
import { db } from '../services/firebase';
import { useSettings } from '../context/SettingsContext';
import { sampleHotels } from '../services/seedData';
import { Hotel } from '../types';

export const HotelListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { policies } = useSettings();

  const cityParam = searchParams.get('city') || '';
  const [hotels, setHotels] = useState<Hotel[]>(sampleHotels);
  const [loading, setLoading] = useState(true);

  // Filters state synced with URL or local
  const [selectedCity, setSelectedCity] = useState(cityParam);
  const [priceMax, setPriceMax] = useState<number>(25000);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'rating_desc'>('recommended');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync cityParam when URL changes
  useEffect(() => {
    setSelectedCity(cityParam);
  }, [cityParam]);

  // Firestore real-time listener
  useEffect(() => {
    setLoading(true);
    try {
      const q = query(collection(db, 'hotels'), where('isPublished', '==', true));
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Hotel));
            setHotels(list);
          }
          setLoading(false);
        },
        (err) => {
          console.warn('Hotels listing listener notice:', err.message);
          setLoading(false);
        }
      );
      return () => unsub();
    } catch {
      setLoading(false);
    }
  }, []);

  const allAmenities = [
    'Beachfront Access',
    'Infinity Pool',
    'Swimming Pool',
    'Full-Service Spa',
    'High-Speed Wi-Fi',
    'Free Valet Parking',
    'Airport Shuttle',
    'Breakfast Included',
  ];

  const propertyTypes = ['hotel', 'resort', 'villa', 'apartment'];

  // Filter & Sort logic
  const filteredHotels = useMemo(() => {
    return hotels
      .filter((h) => {
        // City search
        if (selectedCity && !h.destinationCity.toLowerCase().includes(selectedCity.toLowerCase())) {
          return false;
        }
        // Price filter
        if (h.minPrice > priceMax) {
          return false;
        }
        // Star rating filter
        if (selectedStars.length > 0 && !selectedStars.includes(h.starRating)) {
          return false;
        }
        // Property type filter
        if (selectedTypes.length > 0 && !selectedTypes.includes(h.propertyType)) {
          return false;
        }
        // Amenities filter
        if (
          selectedAmenities.length > 0 &&
          !selectedAmenities.every((amenity) => h.amenities?.includes(amenity))
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.minPrice - b.minPrice;
        if (sortBy === 'price_desc') return b.minPrice - a.minPrice;
        if (sortBy === 'rating_desc') return b.starRating - a.starRating;
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [hotels, selectedCity, priceMax, selectedStars, selectedTypes, selectedAmenities, sortBy]);

  const toggleStar = (star: number) => {
    setSelectedStars((prev) =>
      prev.includes(star) ? prev.filter((s) => s !== star) : [...prev, star]
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const resetFilters = () => {
    setSelectedCity('');
    setPriceMax(25000);
    setSelectedStars([]);
    setSelectedTypes([]);
    setSelectedAmenities([]);
    setSortBy('recommended');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search & Breadcrumb Bar */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3 flex-1">
            <MapPin className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
            <input
              type="text"
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setSearchParams(e.target.value ? { city: e.target.value } : {});
              }}
              placeholder="Search by city (e.g. Goa, Jaipur, Manali, Kerala)..."
              className="w-full text-sm font-semibold text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-transparent focus:outline-hidden"
            />
            {selectedCity && (
              <button
                onClick={() => {
                  setSelectedCity('');
                  setSearchParams({});
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 border-t dark:border-slate-800 md:border-t-0 pt-3 md:pt-0">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold"
            >
              <Filter className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Filters</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 border-none focus:ring-0 cursor-pointer"
              >
                <option value="recommended">Featured / Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating_desc">Guest Rating: High to Low</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-400'
                }`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-400'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Left Sidebar Filters */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs h-fit sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Filter Stays</h3>
              </div>
              <button
                onClick={resetFilters}
                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Price Filter */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                <span>Max Price per Night</span>
                <span className="text-sky-600 dark:text-sky-400 font-extrabold">
                  {policies.currencySymbol}{priceMax.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="2000"
                max="30000"
                step="500"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>{policies.currencySymbol}2,000</span>
                <span>{policies.currencySymbol}30,000+</span>
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">Star Rating</h4>
              <div className="space-y-2">
                {[5, 4, 3].map((star) => (
                  <label
                    key={star}
                    className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedStars.includes(star)}
                        onChange={() => toggleStar(star)}
                        className="rounded-sm text-sky-600 focus:ring-sky-500"
                      />
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{star} Star Properties</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Property Types */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">Property Type</h4>
              <div className="space-y-2">
                {propertyTypes.map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 capitalize cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={() => toggleType(type)}
                      className="rounded-sm text-sky-600 focus:ring-sky-500"
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">Popular Amenities</h4>
              <div className="space-y-2">
                {allAmenities.map((amenity) => (
                  <label
                    key={amenity}
                    className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                      className="rounded-sm text-sky-600 focus:ring-sky-500"
                    />
                    <span>{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Hotel Cards Content Area */}
          <main className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing <strong>{filteredHotels.length}</strong> available properties
                {selectedCity && <> in <strong>{selectedCity}</strong></>}
              </span>
            </div>

            {loading ? (
              // Skeleton Loader
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 animate-pulse space-y-4">
                    <div className="aspect-16/10 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : filteredHotels.length === 0 ? (
              // Empty State
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 max-w-lg mx-auto">
                <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Properties Found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                  We couldn't find any hotel matching your search filters. Try widening your price range or clearing city filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredHotels.map((hotel) => (
                  <Link
                    key={hotel.id}
                    to={`/hotels/${hotel.id}`}
                    className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
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

                      <div className="p-5">
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                          <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{hotel.destinationCity}</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{hotel.propertyType}</span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                          {hotel.name}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                          {hotel.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400 mt-3">
                          {hotel.amenities?.slice(0, 3).map((a, i) => (
                            <span key={i} className="after:content-['·'] after:ml-2 last:after:content-none">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Per night</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-slate-900 dark:text-white">
                              {policies.currencySymbol}{hotel.minPrice.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400">+ taxes</span>
                          </div>
                        </div>

                        <span className="px-4 py-2 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-xs group-hover:bg-sky-500 transition-colors">
                          Select Room
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              // List View
              <div className="space-y-4">
                {filteredHotels.map((hotel) => (
                  <Link
                    key={hotel.id}
                    to={`/hotels/${hotel.id}`}
                    className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row"
                  >
                    <div className="sm:w-64 aspect-16/10 sm:aspect-auto overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                      <img
                        src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                        alt={hotel.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{hotel.destinationCity}</span>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize">{hotel.propertyType}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{hotel.starRating}.0</span>
                          </div>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {hotel.name}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                          {hotel.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400 mt-3">
                          {hotel.amenities?.slice(0, 4).map((a, i) => (
                            <span key={i} className="after:content-['·'] after:ml-2 last:after:content-none">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Starting from</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-slate-900 dark:text-white">
                              {policies.currencySymbol}{hotel.minPrice.toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-400">/ night</span>
                          </div>
                        </div>

                        <span className="px-5 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-xs group-hover:bg-sky-500 transition-colors">
                          View Rooms & Availability
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-white dark:bg-slate-900 h-full p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Filters</h3>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Price Filter Mobile */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-800 mb-2">
                <span>Max Price</span>
                <span className="text-orange-600 font-extrabold">
                  {policies.currencySymbol}{priceMax.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="2000"
                max="30000"
                step="500"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full accent-orange-600"
              />
            </div>

            {/* Star Rating Mobile */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-3">Star Rating</h4>
              <div className="space-y-2">
                {[5, 4, 3].map((star) => (
                  <label key={star} className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedStars.includes(star)}
                      onChange={() => toggleStar(star)}
                      className="rounded-sm text-orange-600"
                    />
                    <span>{star} Stars</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 flex gap-2">
              <button
                onClick={resetFilters}
                className="w-1/2 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-1/2 py-2.5 bg-orange-600 text-white text-xs font-bold rounded-xl"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
