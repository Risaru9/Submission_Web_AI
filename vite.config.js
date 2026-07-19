import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      includeAssets: [
        'model/model.json',
        'model/metadata.json',
        'model/weights.bin',
        'icons/icon-192x192.png',
        'icons/icon-512x512.png',
        'screenshots/screenshot-desktop.png',
        'screenshots/screenshot-mobile.png'
      ],
      manifest: {
        name: 'Root Fact App - AI Sayuran',
        short_name: 'RootFact',
        lang: 'id',
        description:
          'Asisten web yang mengenali sayuran melalui kamera dan membuat fun fact dengan AI lokal.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#15803d',
        orientation: 'portrait-primary',
        categories: ['education', 'food', 'utilities'],
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: '/screenshots/screenshot-desktop.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Root Fact App desktop'
          },
          {
            src: '/screenshots/screenshot-mobile.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Root Fact App mobile'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,png,ico,webmanifest,json,bin}'],
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tfjs-cdn-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/huggingface\.co\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'transformers-model-cache',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  build: {
    sourcemap: false
  }
});
