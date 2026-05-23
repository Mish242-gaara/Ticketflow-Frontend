import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// --- 1. Nettoyer le cache et les Service Workers avant rafraîchissement ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach(registration => registration.unregister());
  });
}

window.addEventListener('beforeunload', () => {
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
      });
    });
  }
});

// --- 2. Enregistrer le Service Worker (après nettoyage) ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('[PWA] Service Worker enregistré:', reg.scope);

      // Vérifier les mises à jour
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('sw-update'));
          }
        });
      });
    } catch (err) {
      console.warn('[PWA] Service Worker non enregistré:', err);
    }
  });
}

// --- 3. Montage unique de l'application ---
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);