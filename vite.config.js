import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Ajout du base path pour garantir que les scripts se chargent depuis la racine
  base: '/', 
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api':     { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
  optimizeDeps: {
    exclude: ['html5-qrcode'],
  },
  build: {
    // Nettoyage du dossier de build avant chaque nouvelle génération
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:  ['react', 'react-dom', 'react-router-dom'],
          motion:  ['framer-motion'],
          charts:  ['recharts'],
          qrcode:  ['html5-qrcode'],
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
  // Correction : définition de global pour le navigateur
  define: {
    global: 'window',
  },
  resolve: {
    alias: {
      // Assure que le code pointe bien vers les bonnes dépendances
      '@': '/src',
    },
  },
});