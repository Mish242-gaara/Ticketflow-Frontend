import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';

/**
 * Composant de bannière d'installation PWA
 * Affiche un logo professionnel et des instructions adaptées à l'appareil.
 * La pop-up réapparaît après un rafraîchissement si l'utilisateur ne l'a pas fermée manuellement.
 */
export default function InstallPWA() {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    // Détecter iOS (Safari ne supporte pas beforeinstallprompt)
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsIOS(ios);

    if (standalone) {
      setInstalled(true);
      return;
    }

    // iOS : afficher les instructions manuelles après 3 secondes
    if (ios && !standalone) {
      const dismissed = sessionStorage.getItem('pwa-ios-dismissed');
      if (!dismissed) setTimeout(() => setShowIOS(true), 3000);
      return;
    }

    // Récupérer l'événement stocké dans sessionStorage (si rafraîchissement)
    const savedPrompt = sessionStorage.getItem('pwa-prompt');
    if (savedPrompt) {
      try {
        // Note: On ne peut pas sérialiser l'événement beforeinstallprompt directement,
        // mais on peut stocker un flag pour indiquer qu'il a été déclenché.
        const wasPromptShown = sessionStorage.getItem('pwa-prompt-shown') === 'true';
        if (wasPromptShown) {
          setTimeout(() => setShow(true), 2000);
        }
      } catch (e) {
        console.error("Erreur lors de la récupération de l'événement PWA:", e);
      }
    }

    // Écouter l'événement d'installation
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      // Stocker un flag pour indiquer que l'événement a été déclenché
      sessionStorage.setItem('pwa-prompt-shown', 'true');
      const dismissed = localStorage.getItem('pwa-dismissed');
      if (!dismissed) setTimeout(() => setShow(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShow(false);
      // Nettoyer le sessionStorage après installation
      sessionStorage.removeItem('pwa-prompt-shown');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Gestion de l'installation
  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      // Nettoyer le sessionStorage après installation
      sessionStorage.removeItem('pwa-prompt-shown');
    }
    setShow(false);
    setPrompt(null);
  };

  // Fermer la bannière
  const dismiss = () => {
    setShow(false);
    setShowIOS(false);
    localStorage.setItem('pwa-dismissed', '1');
    sessionStorage.setItem('pwa-ios-dismissed', '1');
    // Nettoyer le flag si l'utilisateur ferme manuellement
    sessionStorage.removeItem('pwa-prompt-shown');
  };

  // Ne rien afficher si l'application est déjà installée
  if (installed) return null;

  // Composant SVG pour le logo TicketFlow
  const TicketLogo = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 4h16v2H4zm0 4h16v2H4zm0 4h16v2H4zm0 4h16v2H4zm0 4h16v2H4z"
        fill="white"
        stroke="white"
        strokeWidth="1.5"
      />
      <path
        d="M8 10h8M8 14h8"
        stroke="white"
        strokeWidth="1.5"
        strokeDasharray="2 2"
      />
      <text
        x="12"
        y="16"
        fontSize="8"
        fontWeight="bold"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
      >
        T
      </text>
    </svg>
  );

  return (
    <>
      {/* Bannière d'installation pour Android/Chrome */}
      <AnimatePresence>
        {show && !isIOS && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto rounded-2xl p-4 flex items-center gap-3"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            {/* Logo TicketFlow */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--brand)' }}
            >
              <TicketLogo />
            </div>

            {/* Texte de la bannière */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                Installer TicketFlow
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Accès rapide, fonctionne hors ligne
              </p>
            </div>

            {/* Boutons */}
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--brand)', color: '#fff' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download size={13} /> Installer
            </button>
            <button
              onClick={dismiss}
              className="p-1.5 rounded-lg flex-shrink-0"
              style={{ color: 'var(--text-muted)' }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions pour iOS */}
      <AnimatePresence>
        {showIOS && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl p-4"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            {/* En-tête avec icône et titre */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Smartphone size={18} style={{ color: 'var(--accent)' }} />
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Installer sur iPhone / iPad
                </p>
              </div>
              <button
                onClick={dismiss}
                style={{ color: 'var(--text-muted)' }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Instructions pas à pas */}
            <ol className="space-y-1.5" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              <li>1. Appuie sur <strong>⬆ Partager</strong> en bas de Safari</li>
              <li>2. Défile et choisis <strong>"Sur l'écran d'accueil"</strong></li>
              <li>3. Appuie sur <strong>Ajouter</strong> en haut à droite</li>
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}