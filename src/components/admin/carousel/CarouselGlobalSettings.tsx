import React from 'react';
import {
  Clock,
  Eye,
  Grid,
  Moon,
  MoveHorizontal,
  Shuffle,
  Sliders,
  Sparkles,
  Sun,
  ZoomIn,
} from 'lucide-react';
import { CarouselConfig } from '../../../types/carousel';

interface CarouselGlobalSettingsProps {
  config: CarouselConfig;
  onChange: (updated: CarouselConfig) => void;
}

export const CarouselGlobalSettings: React.FC<CarouselGlobalSettingsProps> = ({
  config,
  onChange,
}) => {
  const update = (patch: Partial<CarouselConfig>) => {
    onChange({ ...config, ...patch });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-500" />
            <span>Carousel Engine & Transition Settings</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure rotation timings, animation curves, and readability gradient scrims.
          </p>
        </div>

        {/* Master Enabled Switch */}
        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
          <span>Carousel Enabled</span>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
            className="w-5 h-5 accent-sky-600 rounded-md"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transition Style Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Transition Effect
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'fade', label: 'Crossfade', icon: Sparkles },
              { id: 'slide', label: 'Slide Right', icon: MoveHorizontal },
              { id: 'kenburns', label: 'Ken Burns Zoom', icon: ZoomIn },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = config.transitionType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => update({ transitionType: t.id as any })}
                  className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-500 text-sky-600 dark:text-sky-400 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px]">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Rotation Interval */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Rotation Interval</span>
            </span>
            <span className="font-mono text-sky-600 dark:text-sky-400">
              {(config.intervalMs / 1000).toFixed(1)} seconds
            </span>
          </div>
          <input
            type="range"
            min={2000}
            max={15000}
            step={500}
            value={config.intervalMs}
            onChange={(e) => update({ intervalMs: Number(e.target.value) })}
            className="w-full accent-sky-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>2.0s (Fast)</span>
            <span>5.0s (Default)</span>
            <span>15.0s (Slow)</span>
          </div>
        </div>

        {/* Transition Duration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Animation Duration</span>
            <span className="font-mono text-sky-600 dark:text-sky-400">
              {(config.transitionMs / 1000).toFixed(1)} seconds
            </span>
          </div>
          <input
            type="range"
            min={300}
            max={2000}
            step={100}
            value={config.transitionMs}
            onChange={(e) => update({ transitionMs: Number(e.target.value) })}
            className="w-full accent-sky-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>0.3s (Snappy)</span>
            <span>1.0s (Smooth)</span>
            <span>2.0s (Cinematic)</span>
          </div>
        </div>

        {/* Overlay Switches */}
        <div className="space-y-2">
          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Navigation & Captions
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showCaptions}
                onChange={(e) => update({ showCaptions: e.target.checked })}
                className="w-4 h-4 accent-sky-600 rounded-sm"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Show Place Caption</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showDots}
                onChange={(e) => update({ showDots: e.target.checked })}
                className="w-4 h-4 accent-sky-600 rounded-sm"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Dot Indicators</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showArrows}
                onChange={(e) => update({ showArrows: e.target.checked })}
                className="w-4 h-4 accent-sky-600 rounded-sm"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Prev/Next Arrows</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={config.shuffle}
                onChange={(e) => update({ shuffle: e.target.checked })}
                className="w-4 h-4 accent-sky-600 rounded-sm"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Shuffle Sequence</span>
            </label>
          </div>
        </div>
      </div>

      {/* Scrim Opacity & Dotted Pattern Settings */}
      <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Readability Scrim & Brand Dotted Pattern</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Light Mode Scrim */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light Mode Scrim</span>
              </span>
              <span className="font-mono text-sky-600 dark:text-sky-400">
                {Math.round(config.scrimOpacityLight * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={0.9}
              step={0.05}
              value={config.scrimOpacityLight}
              onChange={(e) => update({ scrimOpacityLight: Number(e.target.value) })}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">Keeps dark text and search widget readable</p>
          </div>

          {/* Dark Mode Scrim */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span>Dark Mode Scrim</span>
              </span>
              <span className="font-mono text-sky-600 dark:text-sky-400">
                {Math.round(config.scrimOpacityDark * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.2}
              max={1.0}
              step={0.05}
              value={config.scrimOpacityDark}
              onChange={(e) => update({ scrimOpacityDark: Number(e.target.value) })}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">Deepens surfaces for white headline text</p>
          </div>

          {/* Dotted Pattern Overlay */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs font-bold">
              <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 cursor-pointer">
                <Grid className="w-3.5 h-3.5 text-sky-500" />
                <span>Brand Dotted Pattern</span>
              </label>
              <input
                type="checkbox"
                checked={config.patternOverlayEnabled}
                onChange={(e) => update({ patternOverlayEnabled: e.target.checked })}
                className="w-4 h-4 accent-sky-600 rounded-sm"
              />
            </div>
            <input
              type="range"
              min={0.05}
              max={0.5}
              step={0.05}
              disabled={!config.patternOverlayEnabled}
              value={config.patternOpacity}
              onChange={(e) => update({ patternOpacity: Number(e.target.value) })}
              className="w-full accent-sky-600 disabled:opacity-30 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              Radial grid layer rendered with brand primary token
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
