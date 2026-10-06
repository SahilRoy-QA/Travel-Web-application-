import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon.png',
          'icon.svg',
          'icons/favicon.ico',
          'icons/apple-touch-icon.png',
          'icons/favicon-16.png',
          'icons/favicon-32.png',
          'icons/icon-192.png',
          'icons/icon-512.png',
          'icons/maskable-192.png',
          'icons/maskable-512.png',
        ],
        manifest: {
          id: '/',
          name: 'Travelly',
          short_name: 'Travelly',
          description: 'Your global journey awaits',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          categories: ['travel'],
          shortcuts: [
            {
              name: 'My Trips',
              short_name: 'Trips',
              description: 'View your upcoming and past bookings',
              url: '/trips',
              icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
            },
            {
              name: 'Search Hotels',
              short_name: 'Hotels',
              description: 'Find and book hotels across top destinations',
              url: '/hotels',
              icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
            },
          ],
          icons: [
            {"src":"/icons/icon-48.png","sizes":"48x48","type":"image/png","purpose":"any"},
            {"src":"/icons/icon-72.png","sizes":"72x72","type":"image/png","purpose":"any"},
            {"src":"/icons/icon-96.png","sizes":"96x96","type":"image/png","purpose":"any"},
            {"src":"/icons/icon-128.png","sizes":"128x128","type":"image/png","purpose":"any"},
            {"src":"/icons/icon-144.png","sizes":"144x144","type":"image/png","purpose":"any"},
            {"src":"/icons/icon-152.png","sizes":"152x152","type":"image/png","purpose":"any"},
            {"src":"/icons/icon-192.png","sizes":"192x192","type":"image/png","purpose":"any"},
            {"src":"/icons/icon-256.png","sizes":"256x256","type":"image/png","purpose":"any"},
            {"src":"/icons/icon-384.png","sizes":"384x384","type":"image/png","purpose":"any"},
            {"src":"/icons/icon-512.png","sizes":"512x512","type":"image/png","purpose":"any"},
            {"src":"/icons/maskable-192.png","sizes":"192x192","type":"image/png","purpose":"maskable"},
            {"src":"/icons/maskable-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,webmanifest}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'unsplash-images',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
