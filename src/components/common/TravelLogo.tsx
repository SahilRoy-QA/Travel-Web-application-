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
    <div className={`flex items-center gap-2 sm:gap-2.5 select-none shrink-0 ${className}`}>
      {/* Travelly Official Compass + Airplane Brand Symbol */}
      <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl p-0.5 shadow-xs flex items-center justify-center shrink-0">
        <img
          src="/brand/travelly-symbol.svg"
          alt="Travelly"
          className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-xs"
          width="40"
          height="40"
        />
      </div>

      {/* Brand Typography: Travelly */}
      {!compact && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span
              className={`text-base sm:text-lg lg:text-xl font-black tracking-tight font-sans ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Travelly
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 tracking-wider uppercase">
              Travel
            </span>
          </div>
          {showTagline && (
            <span className="hidden sm:block text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-400 -mt-0.5 truncate max-w-[160px]">
              Your global journey awaits
            </span>
          )}
        </div>
      )}
    </div>
  );
};
