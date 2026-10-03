import React from 'react';

interface TravelLogoProps {
  className?: string;
  isDark?: boolean;
  showTagline?: boolean;
  compact?: boolean;
}

export const TravelLogo: React.FC<TravelLogoProps> = ({
  className = '',
  isDark = false,
  showTagline = true,
  compact = false,
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Travel Icon: Globe + Compass Rose + Ascending Airplane Motif */}
      <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 p-0.5 shadow-md shadow-sky-500/20 flex items-center justify-center shrink-0">
        <div className="w-full h-full rounded-[14px] bg-slate-950/20 backdrop-blur-xs flex items-center justify-center relative overflow-hidden">
          {/* Subtle Latitude/Longitude Ring Arc */}
          <svg
            className="absolute inset-0 w-full h-full text-white/20"
            viewBox="0 0 40 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <circle cx="20" cy="20" r="14" strokeDasharray="2 3" />
            <ellipse cx="20" cy="20" rx="6" ry="14" />
            <line x1="6" y1="20" x2="34" y2="20" />
          </svg>

          {/* Soaring Jet/Airplane Icon */}
          <svg
            className="w-5 h-5 text-white drop-shadow-sm transform -rotate-12 group-hover:rotate-0 transition-transform duration-300"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>

          {/* Compass North Star Dot */}
          <div className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8] animate-pulse" />
        </div>
      </div>

      {/* Brand Typography */}
      {!compact && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-lg sm:text-xl font-black tracking-wider uppercase font-sans ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              ILLUSION
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 tracking-wider uppercase">
              Travel
            </span>
          </div>
          {showTagline && (
            <span className="text-[10px] font-medium tracking-widest text-slate-400 uppercase -mt-0.5">
              Luxury Stays & Escapes
            </span>
          )}
        </div>
      )}
    </div>
  );
};
