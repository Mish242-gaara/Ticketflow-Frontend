import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// ✅ Enregistre le Service Worker UNIQUEMENT en production
// (et uniquement si le navigateur le supporte)
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // ✅ Attend que la page soit complètement chargée
    setTimeout(() => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[PWA] Service Worker enregistré:', registration.scope);

          // ✅ Vérifie les mises à jour
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                console.log('[PWA] Nouvelle version disponible');
                // ✅ Ne pas forcer le rechargement (évite les conflits)
              }
            });
          });
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker non enregistré:', err);
        });
    }, 1000); // ✅ Délai pour éviter les conflits avec le chargement initial
  });
}

// ✅ Montage de l'application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);