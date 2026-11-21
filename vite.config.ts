import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

const fromSrc = (path: string): string =>
  fileURLToPath(new URL(`./src/${path}`, import.meta.url));

const DAY_IN_SECONDS = 24 * 60 * 60;

// Ports propres à ParkFinder : une PWA a un service worker et des caches par origine.
// Sur le 5173 par défaut, ils seraient partagés avec les autres projets Vite (ex. havre).
const DEV_PORT = 5190;
const PREVIEW_PORT = 4190;

export default defineConfig({
  server: { port: DEV_PORT, strictPort: true },
  preview: { port: PREVIEW_PORT, strictPort: true },
  build: {
    rolldownOptions: {
      output: {
        // Bibliothèques lourdes dans leurs propres fichiers : mieux mises en cache entre deux versions.
        codeSplitting: {
          groups: [
            { name: 'maplibre-vendor', test: /node_modules[\\/]maplibre-gl[\\/]/, priority: 30 },
            { name: 'react-vendor', test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/, priority: 20 },
            { name: 'tanstack-vendor', test: /node_modules[\\/]@tanstack[\\/]/, priority: 20 },
          ],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      // Mode PWA aussi en dev : manifest, service worker et installation sur http://localhost:5173.
      // Le précache complet (hors ligne de toute l'app) ne se teste qu'avec `npm run preview:pwa`.
      devOptions: {
        enabled: true,
        type: 'classic',
      },
      manifest: {
        id: '/',
        scope: '/',
        name: 'ParkFinder',
        short_name: 'ParkFinder',
        description: 'Trouvez un parking gratuit près de vous.',
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#3B82F6',
        background_color: '#F9FAFB',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,mjs,css,html,svg,png,woff2}'],
        // Hors ligne en lecture seule (docs/decisions.md) : le service worker garde le shell,
        // les tuiles et les photos. Les données API passent par le cache TanStack Query.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname === 'tiles.openfreemap.org',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 3000, maxAgeSeconds: 30 * DAY_IN_SECONDS },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname === 'res.cloudinary.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'parking-photos',
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * DAY_IN_SECONDS },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@domain': fromSrc('domain'),
      '@application': fromSrc('application'),
      '@infrastructure': fromSrc('infrastructure'),
      '@ui': fromSrc('ui'),
      '@main': fromSrc('main'),
    },
  },
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
    environment: 'node',
    setupFiles: ['test/setup.ts'],
  },
});
