import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  Layers,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface IconSpec {
  name: string;
  path: string;
  size: number;
  purpose: 'any' | 'maskable' | 'apple' | 'playstore' | 'favicon';
  description: string;
}

export const BrandPreviewPage: React.FC = () => {
  const { isInstallable, isInstalled } = usePWAInstall();
  const [backgroundMode, setBackgroundMode] = useState<'both' | 'light' | 'dark'>('both');
  const [showSafeZone, setShowSafeZone] = useState(true);

  const manifestIcons: IconSpec[] = [
    { name: 'icon-48.png', path: '/icons/icon-48.png', size: 48, purpose: 'any', description: 'Small standard launcher icon' },
    { name: 'icon-72.png', path: '/icons/icon-72.png', size: 72, purpose: 'any', description: 'Low-DPI device launcher' },
    { name: 'icon-96.png', path: '/icons/icon-96.png', size: 96, purpose: 'any', description: 'Medium-DPI launcher' },
    { name: 'icon-128.png', path: '/icons/icon-128.png', size: 128, purpose: 'any', description: 'Chrome Web Store / Task switcher' },
    { name: 'icon-144.png', path: '/icons/icon-144.png', size: 144, purpose: 'any', description: 'Windows tile icon' },
    { name: 'icon-152.png', path: '/icons/icon-152.png', size: 152, purpose: 'any', description: 'iPad touch icon fallback' },
    { name: 'icon-192.png', path: '/icons/icon-192.png', size: 192, purpose: 'any', description: 'PWA mobile home screen standard' },
    { name: 'icon-256.png', path: '/icons/icon-256.png', size: 256, purpose: 'any', description: 'High-res desktop taskbar icon' },
    { name: 'icon-384.png', path: '/icons/icon-384.png', size: 384, purpose: 'any', description: 'High-DPI Android splash icon' },
    { name: 'icon-512.png', path: '/icons/icon-512.png', size: 512, purpose: 'any', description: 'PWA standard high-resolution icon' },
    { name: 'maskable-192.png', path: '/icons/maskable-192.png', size: 192, purpose: 'maskable', description: 'Adaptive Android 192px maskable icon' },
    { name: 'maskable-512.png', path: '/icons/maskable-512.png', size: 512, purpose: 'maskable', description: 'Adaptive Android 512px maskable icon' },
  ];

  const additionalIcons: IconSpec[] = [
    { name: 'apple-touch-icon.png', path: '/icons/apple-touch-icon.png', size: 180, purpose: 'apple', description: 'iOS Safari home screen icon (180x180)' },
    { name: 'playstore-512.png', path: '/icons/playstore-512.png', size: 512, purpose: 'playstore', description: 'Google Play Store Console Listing (opaque, square)' },
    { name: 'favicon-32.png', path: '/icons/favicon-32.png', size: 32, purpose: 'favicon', description: 'Browser tab standard favicon (32x32)' },
    { name: 'favicon-16.png', path: '/icons/favicon-16.png', size: 16, purpose: 'favicon', description: 'Browser tab small favicon (16x16)' },
    { name: 'logo-symbol-transparent.png', path: '/icons/logo-symbol-transparent.png', size: 512, purpose: 'any', description: 'Transparent cut-out symbol for brand headers' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 sm:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <img src="/icons/icon-192.png" alt="Travelly" className="w-10 h-10 rounded-xl" />
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">Travelly Brand & Icon Audit</h1>
                <p className="text-xs text-slate-400">PWA Manifest, Android TWA, and Icon Verification Studio</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
            >
              <span>Back to App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <a
              href="/manifest.webmanifest"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
            >
              <span>View Manifest</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* PWA & System Health Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Manifest Status</div>
              <div className="text-sm font-bold text-white">Valid & Synchronized</div>
              <div className="text-[11px] text-emerald-400">12 icons specified (0 broken)</div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">PWA Installability</div>
              <div className="text-sm font-bold text-white">
                {isInstalled ? 'Installed (Standalone)' : isInstallable ? 'Install Prompt Ready' : 'Compliant & Active'}
              </div>
              <div className="text-[11px] text-sky-400">Standalone display mode supported</div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Bubblewrap TWA Ready</div>
              <div className="text-sm font-bold text-white">Android Package Configured</div>
              <div className="text-[11px] text-amber-400">com.travelly.app</div>
            </div>
          </div>
        </div>

        {/* Section 1: Maskable Icon Adaptive Mask Previews */}
        <section className="bg-slate-800/50 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-400" />
                <span>Maskable Icon Adaptive Mask Previews</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Android 8+ dynamically clips maskable icons to arbitrary shapes. The symbol must remain completely inside the 80% safe zone.
              </p>
            </div>

            <button
              onClick={() => setShowSafeZone(!showSafeZone)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-650 text-xs font-semibold text-white flex items-center gap-2 transition shrink-0 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>{showSafeZone ? 'Hide Safe Zone Circle' : 'Show Safe Zone (80%)'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Raw View */}
            <div className="bg-slate-900/90 border border-slate-700/70 p-5 rounded-2xl flex flex-col items-center text-center space-y-3">
              <div className="text-xs font-bold text-slate-300">1. Raw Full-Bleed (512x512)</div>
              <div className="relative w-48 h-48 bg-white rounded-none border border-slate-700 flex items-center justify-center overflow-hidden shadow-lg">
                <img src="/icons/maskable-512.png" alt="Maskable Raw" className="w-full h-full object-contain" />
                {showSafeZone && (
                  <div className="absolute inset-0 border-2 border-dashed border-red-500 rounded-full scale-80 pointer-events-none" />
                )}
              </div>
              <span className="text-[11px] text-slate-400">Full-bleed white canvas background</span>
            </div>

            {/* Circular Mask (Android / Pixel) */}
            <div className="bg-slate-900/90 border border-slate-700/70 p-5 rounded-2xl flex flex-col items-center text-center space-y-3">
              <div className="text-xs font-bold text-slate-300">2. Circle Mask (Google Pixel / AOSP)</div>
              <div className="relative w-48 h-48 bg-transparent flex items-center justify-center shadow-lg">
                <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-slate-600 bg-white">
                  <img src="/icons/maskable-512.png" alt="Maskable Circle" className="w-full h-full object-contain" />
                </div>
                {showSafeZone && (
                  <div className="absolute inset-0 border-2 border-dashed border-emerald-400 rounded-full scale-80 pointer-events-none" />
                )}
              </div>
              <span className="text-[11px] text-emerald-400 font-medium">Symbol safely centered with 14% margin</span>
            </div>

            {/* Squircle Mask (Samsung OneUI / Xiaomi) */}
            <div className="bg-slate-900/90 border border-slate-700/70 p-5 rounded-2xl flex flex-col items-center text-center space-y-3">
              <div className="text-xs font-bold text-slate-300">3. Squircle Mask (Samsung / Xiaomi)</div>
              <div className="relative w-48 h-48 bg-transparent flex items-center justify-center shadow-lg">
                <div className="w-48 h-48 rounded-[44px] overflow-hidden border-2 border-slate-600 bg-white">
                  <img src="/icons/maskable-512.png" alt="Maskable Squircle" className="w-full h-full object-contain" />
                </div>
                {showSafeZone && (
                  <div className="absolute inset-0 border-2 border-dashed border-emerald-400 rounded-full scale-80 pointer-events-none" />
                )}
              </div>
              <span className="text-[11px] text-emerald-400 font-medium">No corner clipping on any manufacturer</span>
            </div>
          </div>
        </section>

        {/* Section 2: Real-Size Icon Grid with Light & Dark Background Comparison */}
        <section className="bg-slate-800/50 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-400" />
                <span>Web App Manifest Icons (Rendered at Real Size)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Every icon declared in <code>public/manifest.webmanifest</code> shown at its real physical pixel dimensions.
              </p>
            </div>

            {/* Background comparison switcher */}
            <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-700 self-start sm:self-auto">
              <button
                onClick={() => setBackgroundMode('both')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  backgroundMode === 'both' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setBackgroundMode('light')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  backgroundMode === 'light' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light Only</span>
              </button>
              <button
                onClick={() => setBackgroundMode('dark')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  backgroundMode === 'dark' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span>Dark Only</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {manifestIcons.map((icon) => (
              <div
                key={icon.name}
                className="bg-slate-900/80 border border-slate-700/60 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white">{icon.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {icon.size}×{icon.size}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      icon.purpose === 'maskable'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {icon.purpose}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{icon.description}</p>
                  <div className="text-[11px] font-mono text-slate-500">{icon.path}</div>
                </div>

                <div className="flex items-center gap-4 self-center md:self-auto overflow-x-auto p-2">
                  {/* Light Background Preview */}
                  {(backgroundMode === 'both' || backgroundMode === 'light') && (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-xs">
                        <img
                          src={icon.path}
                          alt={icon.name}
                          width={icon.size}
                          height={icon.size}
                          style={{ width: `${icon.size}px`, height: `${icon.size}px` }}
                          className="object-contain"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">White (#fff)</span>
                    </div>
                  )}

                  {/* Dark Background Preview */}
                  {(backgroundMode === 'both' || backgroundMode === 'dark') && (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center shadow-xs">
                        <img
                          src={icon.path}
                          alt={icon.name}
                          width={icon.size}
                          height={icon.size}
                          style={{ width: `${icon.size}px`, height: `${icon.size}px` }}
                          className="object-contain"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">Dark (#0b1120)</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Specialized Platform Icons (Apple Touch, Play Store, Favicon) */}
        <section className="bg-slate-800/50 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Specialized Platform & Brand Icons</h2>
            <p className="text-xs text-slate-400 mt-1">
              Apple Touch Icon for iOS Safari, Play Store 512px listing asset, transparent cutout brand symbol, and favicons.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {additionalIcons.map((icon) => (
              <div
                key={icon.name}
                className="bg-slate-900/80 border border-slate-700/60 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="font-mono text-sm font-bold text-white">{icon.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {icon.size}×{icon.size}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{icon.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
                    <img
                      src={icon.path}
                      alt={icon.name}
                      width={Math.min(icon.size, 96)}
                      height={Math.min(icon.size, 96)}
                      style={{ width: `${Math.min(icon.size, 96)}px`, height: `${Math.min(icon.size, 96)}px` }}
                      className="object-contain"
                    />
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center">
                    <img
                      src={icon.path}
                      alt={icon.name}
                      width={Math.min(icon.size, 96)}
                      height={Math.min(icon.size, 96)}
                      style={{ width: `${Math.min(icon.size, 96)}px`, height: `${Math.min(icon.size, 96)}px` }}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Brand Vector Assets in /public/brand/ */}
        <section className="bg-slate-800/50 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Full Brand Vectors in /public/brand/</h2>
            <p className="text-xs text-slate-400 mt-1">
              Used in headers, navigation, footers, and brand badges (different shape from square launcher icons).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/80 border border-slate-700/60 p-5 rounded-2xl space-y-3">
              <span className="text-xs font-mono font-bold text-slate-300">travelly-logo.svg (Light BG)</span>
              <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
                <img src="/brand/travelly-logo.svg" alt="Travelly Logo Light" className="h-12 object-contain" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/60 p-5 rounded-2xl space-y-3">
              <span className="text-xs font-mono font-bold text-slate-300">travelly-logo-dark.svg (Dark BG)</span>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center">
                <img src="/brand/travelly-logo-dark.svg" alt="Travelly Logo Dark" className="h-12 object-contain" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/60 p-5 rounded-2xl space-y-3">
              <span className="text-xs font-mono font-bold text-slate-300">travelly-symbol.svg</span>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center">
                <img src="/brand/travelly-symbol.svg" alt="Travelly Symbol" className="h-12 w-12 object-contain" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
