import React, { useRef } from 'react';
import { Crosshair } from 'lucide-react';

interface FocalPointPickerProps {
  imageUrl: string;
  focalX: number;
  focalY: number;
  onChange: (x: number, y: number) => void;
}

export const FocalPointPicker: React.FC<FocalPointPickerProps> = ({
  imageUrl,
  focalX,
  focalY,
  onChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));
    const yPercent = Math.max(0, Math.min(100, Math.round((clickY / rect.height) * 100)));

    onChange(xPercent, yPercent);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-sky-500" />
            <span>Focal Point Picker (Click to adjust center of interest)</span>
          </label>
          <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
            X: {focalX}% · Y: {focalY}%
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
          Click anywhere on the photo to ensure the key subject stays visible across phone and desktop screens.
        </p>

        {/* Interactive Click Canvas */}
        <div
          ref={containerRef}
          onClick={handleClick}
          className="relative aspect-16/9 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-crosshair group select-none shadow-inner"
        >
          <img
            src={imageUrl}
            alt="Focal point reference"
            className="w-full h-full object-cover pointer-events-none"
          />

          {/* Target Reticle */}
          <div
            className="absolute w-8 h-8 -ml-4 -mt-4 border-2 border-white rounded-full shadow-lg pointer-events-none flex items-center justify-center bg-sky-500/30 backdrop-blur-xs transition-all duration-75"
            style={{ left: `${focalX}%`, top: `${focalY}%` }}
          >
            <div className="w-2 h-2 rounded-full bg-white shadow-xs" />
          </div>

          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] text-white font-mono pointer-events-none">
            Click to pin focus
          </div>
        </div>
      </div>

      {/* Live Responsive Crop Previews */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
            Desktop Preview (16:9 Landscape)
          </span>
          <div className="aspect-16/9 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <img
              src={imageUrl}
              alt="Desktop crop preview"
              className="w-full h-full object-cover"
              style={{ objectPosition: `${focalX}% ${focalY}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
            Mobile Preview (Portrait Crop)
          </span>
          <div className="aspect-4/3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <img
              src={imageUrl}
              alt="Mobile crop preview"
              className="w-full h-full object-cover"
              style={{ objectPosition: `${focalX}% ${focalY}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
