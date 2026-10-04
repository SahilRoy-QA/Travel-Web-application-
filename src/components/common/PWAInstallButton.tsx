import React, { useState } from 'react';
import { Download, Share2, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'banner' | 'drawer' }> = ({
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = () => {
    if (isInstallable) {
      install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {/* Drawer Variant (For Mobile Hamburger Menu) */}
      {variant === 'drawer' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Download className="w-5 h-5" />
            <span>Install Travelly App</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md font-semibold">
            Free App
          </span>
        </button>
      )}

      {/* Banner Variant (For In-Page Cards) */}
      {variant === 'banner' && (
        <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <img
              src="/icons/icon-192.png"
              alt="Travelly"
              className="w-12 h-12 rounded-xl shrink-0 shadow-sm border border-slate-700/60"
              width="48"
              height="48"
            />
            <div>
              <h4 className="font-bold text-sm sm:text-base">Install Travelly App</h4>
              <p className="text-xs text-slate-300">
                Fast, offline-ready booking on your home screen with zero app store delays.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Install App</span>
          </button>
        </div>
      )}

      {/* Header Compact Variant (Desktop Header Bar) */}
      {variant === 'header' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition-all cursor-pointer"
          title="Install Travelly App"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      )}

      {/* Cross-Platform Installation Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <img
                  src="/icons/icon-192.png"
                  alt="Travelly"
                  className="w-10 h-10 rounded-xl shadow-xs"
                  width="40"
                  height="40"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Install Travelly</h3>
                  <p className="text-[11px] text-slate-400">Add to your device home screen</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 mb-5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl">
                <p className="flex items-start gap-2">
                  <span className="font-bold text-sky-600 dark:text-sky-400 shrink-0">1.</span>
                  <span>
                    Tap the <strong>Share</strong> button (square with arrow up) in Safari.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-sky-600 dark:text-sky-400 shrink-0">2.</span>
                  <span>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-sky-600 dark:text-sky-400 shrink-0">3.</span>
                  <span>
                    Tap <strong>Add</strong> to launch Travelly instantly anytime!
                  </span>
                </p>
              </div>
            ) : (
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 mb-5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl">
                <p className="flex items-start gap-2">
                  <span className="font-bold text-sky-600 dark:text-sky-400 shrink-0">1.</span>
                  <span>
                    Tap your browser menu (the <strong>⋮</strong> icon in Chrome or browser menu).
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-sky-600 dark:text-sky-400 shrink-0">2.</span>
                  <span>
                    Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-sky-600 dark:text-sky-400 shrink-0">3.</span>
                  <span>Enjoy fast, offline-capable travel booking right from your home screen!</span>
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full rounded-xl bg-sky-600 hover:bg-sky-500 text-white py-2.5 text-xs font-bold transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
