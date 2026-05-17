import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import useThemeStore from './store/themeStore';

// Initialiser le thème au démarrage
const { initTheme, setTheme } = useThemeStore.getState();
initTheme();

// Écouter les changements du thème système
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const { theme } = useThemeStore.getState();
  if (theme === 'system') setTheme('system'); // re-appliquer
});

// Enregistrer le Service Worker
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
            // Notifier l'utilisateur d'une mise à jour disponible
            window.dispatchEvent(new CustomEvent('sw-update'));
          }
        });
      });
    } catch (err) {
      console.warn('[PWA] Service Worker non enregistré:', err);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
