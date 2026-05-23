import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Base path pour les assets (important pour Vercel)
  base: '/',

  plugins: [react()],

  // Configuration du serveur de développement
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  // Optimisation des dépendances
  optimizeDeps: {
    exclude: ['html5-qrcode'], // ✅ Exclut html5-qrcode (problématique avec Vite)
  },

  // Configuration du build
  build: {
    emptyOutDir: true, // ✅ Nettoie le dossier de build avant chaque génération
    chunkSizeWarningLimit: 1000, // ✅ Augmente la limite de taille des chunks (en Ko)
    rollupOptions: {
      // ✅ Désactive manualChunks personnalisé (cause de l'erreur)
      output: {
        // manualChunks: undefined, // ✅ Désactivé pour éviter l'erreur
      },
    },
  },

  // Définition des variables globales pour le navigateur
  define: {
    global: 'window',
  },

  // Alias pour les imports
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});