import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Hotel, Luggage } from 'lucide-react';
import { sampleHotels, samplePackages } from '../services/seedData';
import { useSettings } from '../context/SettingsContext';

export const WishlistPage: React.FC = () => {
  const { policies } = useSettings();
  const savedHotels = sampleHotels.slice(0, 2);
  const savedPackages = samplePackages.slice(0, 1);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-red-500 mb-1">
            <Heart className="w-5 h-5 fill-red-500" />
            <span className="text-xs font-bold uppercase tracking-wider">My Saved Escapes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Wishlist & Saved Properties</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Revisit your favorite luxury resorts, boutique villas, and tour packages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedHotels.map((hotel) => (
            <Link
              key={hotel.id}
              to={`/hotels/${hotel.id}`}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-lg transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="aspect-16/10 bg-slate-100 overflow-hidden relative">
                  <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-red-500 shadow-xs">
                    <Heart className="w-4 h-4 fill-red-500" />
                  </div>
                </div>
                <div className="p-5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{hotel.destinationCity}</span>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition line-clamp-1">{hotel.name}</h3>
                </div>
              </div>
              <div className="p-5 pt-0 flex justify-between items-center border-t border-slate-100 mt-2">
                <span className="text-base font-black text-slate-900">{policies.currencySymbol}{hotel.minPrice.toLocaleString()} / night</span>
                <span className="text-xs font-bold text-orange-600">View Hotel →</span>
              </div>
            </Link>
          ))}

          {savedPackages.map((pkg) => (
            <Link
              key={pkg.id}
              to={`/packages/${pkg.id}`}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-lg transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="aspect-16/10 bg-slate-100 overflow-hidden relative">
                  <img src={pkg.images[0]} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-red-500 shadow-xs">
                    <Heart className="w-4 h-4 fill-red-500" />
                  </div>
                </div>
                <div className="p-5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{pkg.durationDays}D / {pkg.durationNights}N</span>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition line-clamp-1">{pkg.title}</h3>
                </div>
              </div>
              <div className="p-5 pt-0 flex justify-between items-center border-t border-slate-100 mt-2">
                <span className="text-base font-black text-slate-900">{policies.currencySymbol}{pkg.pricePerTraveller.toLocaleString()}</span>
                <span className="text-xs font-bold text-orange-600">View Plan →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
