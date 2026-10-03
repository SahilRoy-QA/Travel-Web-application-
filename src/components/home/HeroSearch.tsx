import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Compass,
  Hotel,
  Luggage,
  MapPin,
  Search,
  Users,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export const HeroSearch: React.FC = () => {
  const { branding, sections } = useSettings();
  const navigate = useNavigate();

  const heroSection = sections.find((s) => s.type === 'hero');
  const [activeTab, setActiveTab] = useState<'hotels' | 'packages' | 'services'>('hotels');

  // Search parameters
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

  const topCities = ['Goa', 'Jaipur', 'Kerala', 'Manali', 'Udaipur', 'Dubai'];

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
    } else {
      const params = new URLSearchParams();
      if (city) params.set('city', city);
      navigate(`/services?${params.toString()}`);
    }
  };

  return (
    <div className="relative bg-slate-950 text-white pt-10 pb-20 sm:pt-16 sm:pb-28 overflow-hidden transition-colors">
      {/* Background Graphic & Subtle Sky Ambient Glow */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span>Real-Time Travel Booking & Verified Stays</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            {heroSection?.title || 'Find Your Perfect Escape'}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            {heroSection?.subtitle || 'Compare luxury hotels, boutique resorts, and curated tour packages with best price guarantee.'}
          </p>
        </div>

        {/* Tabbed Search Box (BookMyShow / MakeMyTrip Card Design) */}
        <div className="max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-visible text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 p-3 sm:p-5 transition-colors">
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 px-2">
            <button
              type="button"
              onClick={() => setActiveTab('hotels')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'hotels'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Hotel className="w-4 h-4" />
              <span>Hotels & Stays</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('packages')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'packages'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Luggage className="w-4 h-4" />
              <span>Tour Packages</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Cabs & Services</span>
            </button>
          </div>

          {/* Search Form Inputs */}
          <form onSubmit={handleSearch} className="pt-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Destination Input */}
            <div className="md:col-span-4 relative">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1 ml-1">
                Destination or City
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-sky-600 dark:text-sky-400" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Where to? (e.g. Goa, Jaipur)"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-850 transition"
                />
              </div>
            </div>

            {/* Dates (For Hotels and Packages) */}
            {activeTab !== 'services' ? (
              <div className="md:col-span-4 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1 ml-1">
                    Check-In
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full pl-9 pr-2 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-850"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1 ml-1">
                    Check-Out
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={checkOut}
                      min={checkIn}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full pl-9 pr-2 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-850"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="md:col-span-4">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1 ml-1">
                  Service Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-850"
                  />
                </div>
              </div>
            )}

            {/* Guests & Rooms */}
            <div className="md:col-span-2 relative">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1 ml-1">
                Guests & Rooms
              </label>
              <button
                type="button"
                onClick={() => setGuestPickerOpen(!guestPickerOpen)}
                className="w-full flex items-center justify-between px-3.5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-750 transition cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{guests} Guests, {rooms} Rm</span>
                </div>
              </button>

              {/* Guest Picker Popover */}
              {guestPickerOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50">
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
                className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-5 md:mt-0"
              >
                <Search className="w-4 h-4" />
                <span>Search Stays</span>
              </button>
            </div>
          </form>

          {/* Quick Destination Chips */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Trending Now:</span>
            {topCities.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCity(c)}
                className="hover:text-sky-600 dark:hover:text-sky-400 font-medium transition cursor-pointer"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
