import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'; // ✅ Plugin pour PWA (optionnel)

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
    }),
    // ✅ Plugin PWA (optionnel, mais recommandé pour une meilleure gestion)
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'manifest.json'],
      manifest: {
        name: 'TicketFlow',
        short_name: 'TicketFlow',
        description: 'Plateforme de gestion de tickets',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // ✅ Désactive le précaching des chunks JS
        globPatterns: ['**/*.{css,png,jpg,jpeg,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ticketflow-backend-9xkf\.onrender\.com\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60, // 1 heure
              },
            },
          },
        ],
      },
    }),
  ],
  base: '/',
  build: {
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
    // ✅ Copie sw.js dans dist/
    copyPublicDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        bypass: (req) => req.url.startsWith('/api/auth/google'),
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
      'react-hot-toast',
      'zustand',
    ],
    exclude: ['html5-qrcode'],
  },
  define: {
    global: 'window',
    'process.env': {},
  },
});