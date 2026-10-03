import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Heart,
  Luggage,
  MapPin,
  Share2,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { db } from '../services/firebase';
import { useSettings } from '../context/SettingsContext';
import { samplePackages } from '../services/seedData';
import { TourPackage } from '../types';

export const PackageDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { policies, branding } = useSettings();

  const [pkg, setPkg] = useState<TourPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [travellersCount, setTravellersCount] = useState<number>(2);
  const [openDay, setOpenDay] = useState<number>(1);
  const [selectedImage, setSelectedImage] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const docRef = doc(db, 'packages', id);
    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as TourPackage;
          setPkg(data);
          if (data.departureDates?.[0]) setSelectedDate(data.departureDates[0]);
          if (data.images?.[0]) setSelectedImage(data.images[0]);
          document.title = `${data.title} - ${branding.brandName}`;
        } else {
          const sample = samplePackages.find((p) => p.id === id);
          if (sample) {
            setPkg(sample);
            if (sample.departureDates?.[0]) setSelectedDate(sample.departureDates[0]);
            if (sample.images?.[0]) setSelectedImage(sample.images[0]);
          }
        }
        setLoading(false);
      },
      () => {
        const sample = samplePackages.find((p) => p.id === id);
        if (sample) setPkg(sample);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [id, branding.brandName]);

  const handleBookNow = () => {
    if (!pkg) return;
    const params = new URLSearchParams({
      type: 'package',
      itemId: pkg.id,
      departureDate: selectedDate,
      guestsCount: travellersCount.toString(),
    });
    navigate(`/book?${params.toString()}`);
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse bg-slate-200 h-96 rounded-3xl" />;
  }

  if (!pkg) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Package Not Found</h2>
        <Link to="/packages" className="px-5 py-2.5 bg-orange-600 text-white font-bold text-sm rounded-xl">
          Browse Tour Packages
        </Link>
      </div>
    );
  }

  const basePrice = pkg.pricePerTraveller * travellersCount;
  const taxes = Math.round((basePrice * policies.standardTaxPercent) / 100);
  const totalAmount = basePrice + taxes;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Link to="/" className="hover:text-slate-900">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/packages" className="hover:text-slate-900">Tour Packages</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-semibold truncate">{pkg.title}</span>
        </div>

        {/* Title & Quick Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-xs">
              <span className="bg-orange-50 text-orange-700 font-bold px-2.5 py-0.5 rounded-lg border border-orange-200">
                {pkg.durationDays} Days / {pkg.durationNights} Nights
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                {pkg.destinationName}
              </span>
              {pkg.agentName && (
                <>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">Curated by {pkg.agentName}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900">
              {pkg.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (navigator.share) navigator.share({ title: pkg.title, url: window.location.href });
                else navigator.clipboard.writeText(window.location.href);
              }}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-red-500 cursor-pointer">
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* High-res Photos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
          <div className="lg:col-span-2 aspect-16/10 rounded-3xl overflow-hidden shadow-md bg-slate-900 relative">
            <img
              src={selectedImage || pkg.images?.[0]}
              alt={pkg.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            {pkg.images?.slice(0, 2).map((img, i) => (
              <div
                key={i}
                onClick={() => setSelectedImage(img)}
                className={`relative aspect-16/10 rounded-2xl overflow-hidden cursor-pointer border-2 ${
                  selectedImage === img ? 'border-orange-500 shadow-md' : 'border-transparent opacity-85 hover:opacity-100'
                }`}
              >
                <img src={img} alt="preview" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Content & Booking Sticky Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-10">
            {/* Day-Wise Itinerary Accordion */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span>Day-Wise Tour Itinerary</span>
              </h2>

              <div className="space-y-4">
                {pkg.itinerary?.map((day) => {
                  const isOpen = openDay === day.day;
                  return (
                    <div
                      key={day.day}
                      className="border border-slate-200 rounded-2xl overflow-hidden transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenDay(isOpen ? 0 : day.day)}
                        className="w-full p-4 flex items-center justify-between text-left bg-slate-50/50 hover:bg-slate-100/50 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-orange-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                            D{day.day}
                          </span>
                          <span className="font-bold text-sm text-slate-900">{day.title}</span>
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>

                      {isOpen && (
                        <div className="p-4 pt-2 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-white space-y-3">
                          <p>{day.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-xs pt-2 border-t border-slate-100 text-slate-500">
                            {day.meals && day.meals.length > 0 && (
                              <span><strong>Meals:</strong> {day.meals.join(', ')}</span>
                            )}
                            {day.hotelStay && (
                              <span><strong>Stay:</strong> {day.hotelStay}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inclusions & Exclusions */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <h2 className="text-xl font-bold text-slate-900 mb-6">What's Included & Excluded</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">
                    Package Inclusions
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {pkg.inclusions?.map((inc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3">
                    Package Exclusions
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {pkg.exclusions?.map((exc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Booking Widget */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[11px] text-slate-400 block font-medium">Price per traveller</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {policies.currencySymbol}{pkg.pricePerTraveller.toLocaleString()}
                  </span>
                  {pkg.originalPrice && (
                    <span className="text-sm text-slate-400 line-through">
                      {policies.currencySymbol}{pkg.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Departure Date Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">Select Departure Date</label>
                <div className="space-y-2">
                  {pkg.departureDates?.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDate(d)}
                      className={`w-full p-2.5 text-xs font-bold rounded-xl border flex items-center justify-between transition cursor-pointer ${
                        selectedDate === d
                          ? 'border-orange-600 bg-orange-50 text-orange-900'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        {new Date(d).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      {selectedDate === d && <span className="text-[10px] text-orange-600">✓ Selected</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Travellers */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">Travellers</span>
                  <span className="text-[11px] text-slate-400">Total persons joining</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={travellersCount <= 1}
                    onClick={() => setTravellersCount(travellersCount - 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold disabled:opacity-30"
                  >
                    -
                  </button>
                  <span className="font-bold w-4 text-center">{travellersCount}</span>
                  <button
                    disabled={travellersCount >= pkg.maxGroupSize}
                    onClick={() => setTravellersCount(travellersCount + 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Summary Calculation */}
              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span>
                    {policies.currencySymbol}{pkg.pricePerTraveller.toLocaleString()} × {travellersCount} Travellers
                  </span>
                  <span className="font-semibold text-slate-900">
                    {policies.currencySymbol}{basePrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GST & Service Taxes ({policies.standardTaxPercent}%)</span>
                  <span>{policies.currencySymbol}{taxes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total Amount</span>
                  <span className="text-orange-600 text-base">
                    {policies.currencySymbol}{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleBookNow}
                className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Book This Tour Package</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Certified Tour Specialist Guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
