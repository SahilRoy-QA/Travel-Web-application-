import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Car,
  Compass,
  Hotel,
  Luggage,
  MapPin,
  Navigation,
  Search,
  Users,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { HeroCarousel } from './HeroCarousel';

export const HeroSearch: React.FC = () => {
  const { sections } = useSettings();
  const navigate = useNavigate();

  const heroSection = sections.find((s) => s.type === 'hero');
  const [activeTab, setActiveTab] = useState<'hotels' | 'packages' | 'cabs' | 'services'>('hotels');

  // Search parameters for Stays
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [checkOut, setCheckOut] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    return tomorrow.toISOString().split('T')[0];
  });
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [guestPickerOpen, setGuestPickerOpen] = useState(false);

  // Search parameters for Cabs
  const [cabTripType, setCabTripType] = useState<'point_to_point' | 'airport' | 'rental' | 'outstation_one_way'>('point_to_point');
  const [cabPickup, setCabPickup] = useState('');
  const [cabDrop, setCabDrop] = useState('');

  const topCities = ['Goa', 'Jaipur', 'Kerala', 'Manali', 'Udaipur', 'Dubai'];
  const topCabRoutes = [
    { label: 'Delhi → IGI Airport', pickup: 'Connaught Place, New Delhi', drop: 'Indira Gandhi International Airport (DEL)', type: 'airport' },
    { label: 'Mumbai → Pune', pickup: 'Bandra West, Mumbai', drop: 'Pune Shivajinagar', type: 'outstation_one_way' },
    { label: 'BLR Airport Drop', pickup: 'Koramangala, Bengaluru', drop: 'Kempegowda International Airport (BLR)', type: 'airport' },
    { label: 'Delhi → Jaipur', pickup: 'Delhi NCR', drop: 'Jaipur Pink City', type: 'outstation_one_way' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'hotels') {
      const params = new URLSearchParams();
      if (city) params.set('city', city);
      params.set('checkIn', checkIn);
      params.set('checkOut', checkOut);
      params.set('guests', guests.toString());
      params.set('rooms', rooms.toString());
      navigate(`/hotels?${params.toString()}`);
    } else if (activeTab === 'packages') {
      const params = new URLSearchParams();
      if (city) params.set('destination', city);
      navigate(`/packages?${params.toString()}`);
    } else if (activeTab === 'cabs') {
      const params = new URLSearchParams();
      params.set('tripType', cabTripType);
      if (cabPickup) params.set('pickup', cabPickup);
      if (cabDrop) params.set('drop', cabDrop);
      params.set('date', checkIn);
      navigate(`/cabs?${params.toString()}`);
    } else {
      const params = new URLSearchParams();
      if (city) params.set('city', city);
      navigate(`/services?${params.toString()}`);
    }
  };

  return (
    <div className="relative bg-slate-950 text-white pt-8 pb-16 sm:pt-20 sm:pb-28 overflow-hidden transition-colors min-h-[520px] sm:min-h-[640px] flex flex-col justify-center w-full">
      {/* Dynamic Full-Bleed Background Photo Carousel Layer */}
      <HeroCarousel />

      {/* Hero Content Layer */}
      <div className="relative z-30 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 px-1 sm:px-0">
          <div className="inline-flex max-w-full items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-3 sm:mb-4 text-center">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
            <span className="truncate sm:whitespace-normal">Real-Time Travel Booking & Verified Stays</span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black tracking-tight text-white leading-tight break-words">
            {heroSection?.title || 'Find Your Perfect Escape'}
          </h1>
          <p className="mt-2 sm:mt-4 text-xs sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {heroSection?.subtitle || 'Compare luxury hotels, boutique resorts, and curated tour packages with best price guarantee.'}
          </p>
        </div>

        {/* Tabbed Search Box (BookMyShow / MakeMyTrip Card Design) */}
        <div className="w-full max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 p-3 sm:p-5 transition-colors overflow-hidden sm:overflow-visible">
          {/* Tabs: Horizontally scrollable without pushing card width on mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 sm:pb-3 overflow-x-auto no-scrollbar -mx-1 px-1 sm:mx-0 sm:px-0">
            <button
              type="button"
              onClick={() => setActiveTab('hotels')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'hotels'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Hotel className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Hotels & Stays</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('packages')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'packages'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Luggage className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Tour Packages</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cabs')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'cabs'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Mobility / Cabs</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'services'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Other Services</span>
            </button>
          </div>

          {/* Search Form Inputs */}
          {activeTab === 'cabs' ? (
            <form onSubmit={handleSearch} className="pt-3 sm:pt-4 space-y-3">
              {/* Cab Trip Type Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'point_to_point', label: 'Local City' },
                  { id: 'airport', label: 'Airport Transfer' },
                  { id: 'rental', label: 'Hourly Rental' },
                  { id: 'outstation_one_way', label: 'Outstation' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setCabTripType(type.id as any)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                      cabTripType === type.id
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-center">
                {/* Pickup */}
                <div className="md:col-span-4 relative min-w-0">
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1 ml-1 truncate">
                    Pickup Point
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-500 pointer-events-none" />
                    <input
                      type="text"
                      value={cabPickup}
                      onChange={(e) => setCabPickup(e.target.value)}
                      placeholder="e.g. Connaught Place, Hotel Oberoi"
                      className="w-full pl-10 pr-3 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Drop */}
                <div className="md:col-span-4 relative min-w-0">
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1 ml-1 truncate">
                    {cabTripType === 'rental' ? 'City / Base Zone' : 'Drop Destination'}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-rose-500 pointer-events-none" />
                    <input
                      type="text"
                      value={cabDrop}
                      onChange={(e) => setCabDrop(e.target.value)}
                      placeholder={
                        cabTripType === 'rental'
                          ? 'e.g. Delhi NCR 8hr/80km'
                          : 'e.g. DEL Airport Terminal 3, Cyber City'
                      }
                      className="w-full pl-10 pr-3 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Date */}
                <div className="md:col-span-2 min-w-0">
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1 ml-1 truncate">
                    Ride Date
                  </label>
                  <div className="relative min-w-0">
                    <Calendar className="absolute left-2.5 sm:left-3 top-3 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full pl-7 sm:pl-9 pr-1 sm:pr-2 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Search Cabs Button */}
                <div className="md:col-span-2 flex items-end">
                  <button
                    type="submit"
                    className="w-full py-3 sm:py-3.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-1 md:mt-0"
                  >
                    <Car className="w-4 h-4" />
                    <span>Find Cabs</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
          <form onSubmit={handleSearch} className="pt-3 sm:pt-4 grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-center">
            {/* Destination Input */}
            <div className="md:col-span-4 relative min-w-0">
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1 ml-1 truncate">
                Destination or City
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-sky-600 dark:text-sky-400 pointer-events-none" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Where to? (e.g. Goa, Jaipur)"
                  className="w-full pl-10 pr-3 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-850 transition min-w-0"
                />
              </div>
            </div>

            {/* Dates (For Hotels and Packages) */}
            {activeTab !== 'services' ? (
              <div className="md:col-span-4 grid grid-cols-2 gap-2 min-w-0">
                <div className="min-w-0">
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1 ml-1 truncate">
                    Check-In
                  </label>
                  <div className="relative min-w-0">
                    <Calendar className="absolute left-2.5 sm:left-3 top-3 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full pl-7 sm:pl-9 pr-1 sm:pr-2 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-850 min-w-0"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1 ml-1 truncate">
                    Check-Out
                  </label>
                  <div className="relative min-w-0">
                    <Calendar className="absolute left-2.5 sm:left-3 top-3 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={checkOut}
                      min={checkIn}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full pl-7 sm:pl-9 pr-1 sm:pr-2 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-850 min-w-0"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="md:col-span-4 min-w-0">
                <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1 ml-1 truncate">
                  Service Date
                </label>
                <div className="relative min-w-0">
                  <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-850 min-w-0"
                  />
                </div>
              </div>
            )}

            {/* Guests & Rooms */}
            <div className="md:col-span-2 relative min-w-0">
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1 ml-1 truncate">
                Guests & Rooms
              </label>
              <button
                type="button"
                onClick={() => setGuestPickerOpen(!guestPickerOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-750 transition cursor-pointer min-w-0"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{guests} Guests, {rooms} Rm</span>
                </div>
              </button>

              {/* Guest Picker Popover */}
              {guestPickerOpen && (
                <div className="absolute left-0 right-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Guests</p>
                        <p className="text-xs text-slate-400">Ages 12 and above</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={guests <= 1}
                          onClick={() => setGuests(guests - 1)}
                          className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{guests}</span>
                        <button
                          type="button"
                          disabled={guests >= 10}
                          onClick={() => setGuests(guests + 1)}
                          className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Rooms</p>
                        <p className="text-xs text-slate-400">Total rooms required</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={rooms <= 1}
                          onClick={() => setRooms(rooms - 1)}
                          className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{rooms}</span>
                        <button
                          type="button"
                          disabled={rooms >= 5}
                          onClick={() => setRooms(rooms + 1)}
                          className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setGuestPickerOpen(false)}
                      className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Search Submit Button */}
            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                className="w-full py-3 sm:py-3.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-1 md:mt-0"
              >
                <Search className="w-4 h-4" />
                <span>Search Stays</span>
              </button>
            </div>
          </form>
          )}

          {/* Quick Destination Chips */}
          <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {activeTab === 'cabs' ? 'Popular Cab Routes:' : 'Trending Now:'}
            </span>
            {activeTab === 'cabs' ? (
              topCabRoutes.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => {
                    setCabPickup(r.pickup);
                    setCabDrop(r.drop);
                    setCabTripType(r.type as any);
                  }}
                  className="hover:text-sky-600 dark:hover:text-sky-400 font-medium transition cursor-pointer"
                >
                  {r.label}
                </button>
              ))
            ) : (
              topCities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCity(c)}
                  className="hover:text-sky-600 dark:hover:text-sky-400 font-medium transition cursor-pointer"
                >
                  {c}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
