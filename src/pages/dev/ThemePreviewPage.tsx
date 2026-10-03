import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  Hotel,
  Info,
  Luggage,
  MapPin,
  Monitor,
  Moon,
  Search,
  Shield,
  Star,
  Sun,
  User,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { TravelLogo } from '../../components/common/TravelLogo';

export const ThemePreviewPage: React.FC = () => {
  const { theme, resolvedTheme, isDark, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'all' | 'tokens' | 'forms' | 'cards' | 'feedback'>('all');
  const [sliderVal, setSliderVal] = useState(12000);
  const [checked, setChecked] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-8 lg:p-12 transition-colors">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-md">
                Developer Sandbox
              </span>
              <span className="text-xs text-slate-400">· Active Theme: {resolvedTheme} ({theme})</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Design Tokens & Theme Showcase
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Visual QA tool verifying WCAG AA contrast, surface elevation, form states, and dark mode tokens.
            </p>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          {(['all', 'tokens', 'forms', 'cards', 'feedback'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition capitalize cursor-pointer ${
                activeTab === tab
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 1. BRAND & SEMANTIC TOKENS SWATCHES */}
        {(activeTab === 'all' || activeTab === 'tokens') && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>1. Semantic Color & Surface Tokens</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="w-full h-10 rounded-xl bg-white border border-slate-200 mb-2" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">bg-background</p>
                <p className="text-[10px] text-slate-400">Canvas Base</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-2" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">bg-surface</p>
                <p className="text-[10px] text-slate-400">Card Base</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="w-full h-10 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">bg-elevated</p>
                <p className="text-[10px] text-slate-400">Popovers / Modals</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="w-full h-10 rounded-xl bg-sky-600 mb-2" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">brand-accent</p>
                <p className="text-[10px] text-slate-400">Primary Actions</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="w-full h-10 rounded-xl bg-emerald-500 mb-2" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">color-success</p>
                <p className="text-[10px] text-slate-400">Confirmed / Paid</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="w-full h-10 rounded-xl bg-red-500 mb-2" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">color-danger</p>
                <p className="text-[10px] text-slate-400">Cancelled / Alert</p>
              </div>
            </div>
          </section>
        )}

        {/* 2. FORM CONTROLS & STATES */}
        {(activeTab === 'all' || activeTab === 'forms') && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              2. Form Inputs, Buttons & Focus States
            </h2>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Standard Text Input
                  </label>
                  <input
                    type="text"
                    defaultValue="Grand Resort & Spa"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date Picker (color-scheme sync)
                  </label>
                  <input
                    type="date"
                    defaultValue="2026-10-15"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Dropdown
                  </label>
                  <select className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500">
                    <option>Deluxe Ocean Suite</option>
                    <option>Presidential Villa</option>
                    <option>Executive Penthouse</option>
                  </select>
                </div>
              </div>

              {/* Range Slider & Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Price Range Slider</span>
                    <span className="text-sky-600 dark:text-sky-400">₹{sliderVal.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="2000"
                    max="30000"
                    step="500"
                    value={sliderVal}
                    onChange={(e) => setSliderVal(Number(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setChecked(e.target.checked)}
                      className="w-4 h-4 accent-sky-600 rounded-sm"
                    />
                    <span>Free Breakfast Included</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 accent-sky-600 rounded-sm"
                    />
                    <span>Instant Confirmation</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition">
                  Primary Action
                </button>
                <button className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition">
                  Secondary Dark
                </button>
                <button className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition">
                  Outline / Muted
                </button>
                <button className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition">
                  Destructive
                </button>
                <button disabled className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold text-xs rounded-xl opacity-60 cursor-not-allowed">
                  Disabled
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 3. CARDS & ELEVATION */}
        {(activeTab === 'all' || activeTab === 'cards') && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              3. Cards, Elevation & Shimmer Loaders
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hotel Mockup Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-xl transition-all">
                <div className="relative aspect-16/10 bg-slate-100 dark:bg-slate-800">
                  <img
                    src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
                    alt="Sample Stay"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-xs text-xs font-black text-slate-900 dark:text-white">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>5.0</span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Goa Coastal Oasis</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    The Azure Bay Beach Resort & Villas
                  </h3>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Starting from</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white">₹16,500</span>
                    </div>

                    <span className="px-4 py-2 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-xs">
                      View Details
                    </span>
                  </div>
                </div>
              </div>

              {/* Shimmer Skeleton Loader (Demonstrates Light & Dark Shimmer) */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-pulse">
                <div className="aspect-16/10 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-20" />
                  <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-24" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 4. FEEDBACK & ALERT BANNERS */}
        {(activeTab === 'all' || activeTab === 'feedback') && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              4. Alerts, Badges & Accessible Feedback States
            </h2>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Booking #ILL-9824 confirmed. Instant payment verified via 3D Secure checkout.</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Only 2 oceanfront villas remaining for your selected dates in Goa.</span>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-sky-800 dark:text-sky-300 text-xs font-medium flex items-center gap-2.5">
                <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>Free cancellation allowed up to 24 hours prior to 2:00 PM check-in.</span>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
