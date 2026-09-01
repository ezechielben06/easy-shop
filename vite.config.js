import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/favicon.ico',
        'icons/icon-64x64.png',
        'icons/icon-192x192.png',
        'icons/icon-512x512.png',
        'icons/maskable-icon-192x192.png',
        'icons/maskable-icon-512x512.png',
        'icons/apple-touch-icon-180x180.png'
      ],
      manifest: {
        name: 'Easy-Shop - Gestion Commerciale',
        short_name: 'Easy-Shop',
        description: 'Application de gestion commerciale pour votre boutique',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icons/icon-64x64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/maskable-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icons/apple-touch-icon-180x180.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Inclure les fichiers générés par Vite
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2}',
          '**/index.html'
        ],
        // Ignorer les fichiers trop volumineux
        globIgnores: [
          '**/node_modules/**/*',
          '**/dist/**/*'
        ],
        // Stratégies de cache
        runtimeCaching: [
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 an
              }
            }
          },
          {
            // Google Fonts static
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            // Supabase API
            urlPattern: /^https:\/\/zmnxspjznkwvxgiltqcg\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24h
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            // Images Supabase Storage
            urlPattern: /^https:\/\/zmnxspjznkwvxgiltqcg\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 jours
              }
            }
          }
        ],
        // Navigation fallback
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/_/,
          /^\/api/,
          /^\/@/
        ]
      },
      // Activer en développement pour tester
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
        suppressWarnings: true
      }
    })
  ],
  // Optimiser les dépendances pour le build
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'recharts',
      'react-hot-toast',
      '@supabase/supabase-js',
      'date-fns'
    ]
  },
  server: {
    port: 3000
  },
  build: {
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Garder pour le debug
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'recharts', 'react-hot-toast'],
          'supabase-vendor': ['@supabase/supabase-js']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})