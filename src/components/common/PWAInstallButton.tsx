import React, { useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'banner' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div>
            <h4 className="font-semibold text-sm sm:text-base">Install ILLUSION App</h4>
            <p className="text-xs text-slate-300">Fast, offline-ready booking on your home screen with zero app store delays.</p>
          </div>
          <button
            onClick={install}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all shadow-md shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Install App
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-all cursor-pointer"
        title="Install ILLUSION Web App"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2.5 py-1 text-xs font-medium transition cursor-pointer"
        >
          <Share2 className="w-3 h-3 text-orange-600" />
          <span>Add to Home Screen</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Install on iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                1. Tap the <strong>Share button</strong> (square with arrow up) at the bottom of Safari.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
                3. Tap <strong>Add</strong> to launch ILLUSION like a native iOS app.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-2.5 text-sm font-semibold transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
