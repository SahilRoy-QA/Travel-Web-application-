import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, MapPin, Navigation, Plane, Train, X } from 'lucide-react';
import { presetLocations, PresetLocation } from '../../services/cabService';

interface CabLocationInputProps {
  label: string;
  value: string;
  onChange: (value: string, locationData?: { lat: number; lng: number; zoneId?: string }) => void;
  placeholder?: string;
  isPickup?: boolean;
  filterCity?: string;
  className?: string;
  required?: boolean;
}

export const CabLocationInput: React.FC<CabLocationInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Enter location or address',
  isPickup = true,
  filterCity,
  className = '',
  required = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [locating, setLocating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Filter preset locations based on search query or city
  const filteredPresets = presetLocations.filter((loc) => {
    if (filterCity && filterCity !== 'all' && loc.city.toLowerCase() !== filterCity.toLowerCase()) {
      return false;
    }
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      loc.name.toLowerCase().includes(q) ||
      loc.city.toLowerCase().includes(q) ||
      loc.address.toLowerCase().includes(q)
    );
  });

  const handleSelectLocation = (loc: PresetLocation) => {
    setQuery(loc.name);
    onChange(loc.name, { lat: loc.lat, lng: loc.lng, zoneId: loc.zoneId });
    setDropdownOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onChange('', undefined);
    inputRef.current?.focus();
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const formatted = `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        setQuery(formatted);
        onChange(formatted, { lat, lng });
        setDropdownOpen(false);
      },
      (err) => {
        setLocating(false);
        console.warn('Geolocation notice:', err.message);
        // Fallback to primary hub
        const defaultHub = presetLocations[0];
        setQuery(defaultHub.name);
        onChange(defaultHub.name, { lat: defaultHub.lat, lng: defaultHub.lng, zoneId: defaultHub.zoneId });
      },
      { timeout: 8000 }
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex items-center justify-between mb-1 ml-0.5">
        <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {isPickup && (
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locating}
            className="text-[10px] sm:text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
          >
            <Navigation className={`w-3 h-3 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Locating...' : 'Use Current'}</span>
          </button>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-3.5 top-3.5 flex items-center justify-center pointer-events-none">
          {isPickup ? (
            <MapPin className="w-4 h-4 text-emerald-500" />
          ) : (
            <MapPin className="w-4 h-4 text-rose-500" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setDropdownOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setDropdownOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition"
        />

        <div className="absolute right-2.5 top-2.5 sm:top-3 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Suggestions List (Google Places Fallback & Curated Hubs) */}
      {dropdownOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 max-h-72 overflow-y-auto no-scrollbar py-2">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Popular Pickup & Drop Hubs</span>
            <span className="text-[9px] text-sky-500">Fast Auto-Select</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredPresets.length > 0 ? (
              filteredPresets.map((loc) => {
                const isAirport = loc.category === 'airport';
                const isRailway = loc.category === 'railway';

                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className="w-full px-3.5 py-2.5 flex items-start gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer group"
                  >
                    <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-sky-50 dark:group-hover:bg-sky-950/50 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition">
                      {isAirport ? (
                        <Plane className="w-3.5 h-3.5" />
                      ) : isRailway ? (
                        <Train className="w-3.5 h-3.5" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {loc.name}
                        </p>
                        <span className="shrink-0 text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                          {loc.city}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {loc.address}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-xs text-slate-500 text-center">
                Press enter to use &quot;{query}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
