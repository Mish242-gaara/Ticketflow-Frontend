import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // ✅ Assure la compatibilité avec React 18
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
    }),
  ],
  // ✅ Base path pour Vercel
  base: '/',
  // ✅ Configuration du serveur de développement
  server: {
    port: 5173,
    // ✅ Désactive le proxy pour les routes OAuth
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
  // ✅ Optimisation des dépendances
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['html5-qrcode'],
  },
  // ✅ Configuration du build
  build: {
    emptyOutDir: true,
    // ✅ Désactive les chunks manuels (problématique avec Vercel)
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    // ✅ Augmente la limite de taille des chunks
    chunkSizeWarningLimit: 1000,
  },
  // ✅ Définition des variables globales
  define: {
    global: 'window',
  },
});