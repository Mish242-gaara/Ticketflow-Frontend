import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // ✅ Assure la compatibilité avec React 18
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      // ✅ Désactive le fast refresh en production (peut causer des problèmes)
      fastRefresh: process.env.NODE_ENV !== 'production',
    }),
  ],
  // ✅ Base path pour Vercel
  base: '/',
  // ✅ Désactive les chunks manuels (problématique avec Vercel)
  build: {
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined, // ✅ Désactive manualChunks
        // ✅ Optimise les noms des chunks
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
    // ✅ Augmente la limite de taille des chunks
    chunkSizeWarningLimit: 1000,
    // ✅ Désactive le minify en développement pour déboguer
    minify: process.env.NODE_ENV === 'production',
    // ✅ Exclut les fichiers problématiques
    sourcemap: true,
  },
  // ✅ Optimisation des dépendances
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
  // ✅ Configuration du serveur de développement
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        bypass: (req) => req.url.startsWith('/api/auth/google'),
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  // ✅ Définition des variables globales
  define: {
    global: 'window',
    'process.env': {}, // ✅ Évite les erreurs "process is not defined"
  },
  // ✅ Désactive le cache pour éviter les problèmes
  cacheDir: 'node_modules/.vite-cache',
});