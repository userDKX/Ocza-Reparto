import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Rutas - Optimizador de Entregas',
        short_name: 'Rutas',
        description: 'Optimización de rutas de entrega para El Pedregal',
        theme_color: '#1e40af',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'es',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            // CartoDB Positron tiles (map)
            urlPattern: /^https:\/\/[abc]\.basemaps\.cartocdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 60 }, // 60 days
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Client photos (Supabase storage)
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/client-photos\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'client-photos',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 60 }, // 60 days
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // OSRM + Google routing APIs
            urlPattern: /^https:\/\/(router\.project-osrm\.org|maps\.googleapis\.com\/maps\/api\/directions)\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'routing-api',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 days
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
