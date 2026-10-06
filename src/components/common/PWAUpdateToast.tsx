import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export const PWAUpdateToast: React.FC = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    // Only register service worker in production builds to prevent dev-server cache conflicts
    if (import.meta.env.PROD && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      import('virtual:pwa-register')
        .then(({ registerSW }) => {
          const update = registerSW({
            onNeedRefresh() {
              setNeedRefresh(true);
            },
            onOfflineReady() {
              console.log('ILLUSION PWA is offline-ready.');
            },
          });
          setUpdateSW(() => update);
        })
        .catch(() => {
          // Virtual import skipped if sw not built yet
        });
    }
  }, []);

  if (!needRefresh) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-2xl bg-slate-900 border border-slate-700 text-white p-4 shadow-2xl animate-in slide-in-from-top-4">
      <div>
        <p className="text-xs font-bold">New Version Available</p>
        <p className="text-[11px] text-slate-400">An update with fresh deals is ready.</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => updateSW?.()}
          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload</span>
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          className="p-1 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
