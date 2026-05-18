import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api':     { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
    },
    // Filtre pour masquer les avertissements de sourcemaps manquants
    sourcemapIgnoreList: (sourcePath) => sourcePath.includes('node_modules'),
  },
  optimizeDeps: {
    // Exclure html5-qrcode de l'optimisation pour éviter les problèmes
    exclude: ['html5-qrcode'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:  ['react', 'react-dom', 'react-router-dom'],
          motion:  ['framer-motion'],
          charts:  ['recharts'],
          qrcode:  ['html5-qrcode'], // Chunk séparé pour html5-qrcode
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
  // Désactiver les avertissements de React Router v7
  esbuild: {
    define: {
      global: 'window',
    },
  },
});