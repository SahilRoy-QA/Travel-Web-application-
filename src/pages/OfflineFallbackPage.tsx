import React from 'react';
import { Link } from 'react-router-dom';
import { Luggage, RotateCcw, WifiOff } from 'lucide-react';

export const OfflineFallbackPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center p-4 text-center transition-colors">
      <div className="max-w-md bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
        <div className="flex flex-col items-center justify-center gap-2">
          <img
            src="/icons/icon-192.png"
            alt="Travelly"
            className="w-16 h-16 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800"
            width="64"
            height="64"
          />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-semibold">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Connection Offline</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Travelly is Offline</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            It looks like your internet connection is unavailable. Don't worry, your app shell and cached bookings remain accessible.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <Link
            to="/trips"
            className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <Luggage className="w-4 h-4" />
            <span>Open Cached My Trips & Vouchers</span>
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    </div>
  );
};
