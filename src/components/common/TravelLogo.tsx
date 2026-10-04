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
      {/* Travelly Official Compass + Airplane Brand Symbol */}
      <div className="relative w-10 h-10 rounded-2xl p-0.5 shadow-xs flex items-center justify-center shrink-0">
        <img
          src="/brand/travelly-symbol.svg"
          alt="Travelly"
          className="w-10 h-10 object-contain drop-shadow-xs"
          width="40"
          height="40"
        />
      </div>

      {/* Brand Typography: Travelly */}
      {!compact && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-lg sm:text-xl font-black tracking-tight font-sans ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Travelly
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 tracking-wider uppercase">
              Travel
            </span>
          </div>
          {showTagline && (
            <span className="text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-400 -mt-0.5">
              Your global journey awaits
            </span>
          )}
        </div>
      )}
    </div>
  );
};
