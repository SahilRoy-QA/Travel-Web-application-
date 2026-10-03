import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Info,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { CarouselSlide } from '../../../types/carousel';

interface CarouselRecommendationsProps {
  slides: CarouselSlide[];
}

export const CarouselRecommendations: React.FC<CarouselRecommendationsProps> = ({ slides }) => {
  const activeCount = slides.filter((s) => s.active).length;
  const isOptimalCount = activeCount >= 3 && activeCount <= 6;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-sky-500" />
        <span>Performance & Image Guidelines</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Recommended Aspect Ratio */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white">
            <Maximize2 className="w-3.5 h-3.5 text-sky-500" />
            <span>Optimal Dimensions</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Landscape <strong>16:9</strong> (1920×1080px or minimum 1600px wide). The system automatically crops portrait-friendly WebP for phones.
          </p>
        </div>

        {/* Slide Count Check */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
            <span className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-sky-500" />
              <span>Slide Density</span>
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
              isOptimalCount
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'
            }`}>
              {activeCount} Active
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Best practice is <strong>4 to 6 slides</strong>. Too many slides increases initial memory footprint without additional user views.
          </p>
        </div>

        {/* Core Web Vitals & LCP Protection */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white">
            <HardDrive className="w-3.5 h-3.5 text-sky-500" />
            <span>LCP & Caching Engine</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            The first slide is preloaded with <code>fetchpriority="high"</code> to keep mobile LCP under 2.5s. All slides are cached for offline PWA visits.
          </p>
        </div>
      </div>
    </div>
  );
};
