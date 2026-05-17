import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';

/**
 * Bannière d'installation PWA
 * Apparaît automatiquement quand le navigateur supporte l'installation
 */
export default function InstallPWA() {
  const [prompt, setPrompt]     = useState(null);
  const [show, setShow]         = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS]       = useState(false);
  const [showIOS, setShowIOS]   = useState(false);

  useEffect(() => {
    // Détecter iOS (Safari ne supporte pas beforeinstallprompt)
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsIOS(ios);

    if (standalone) { setInstalled(true); return; }

    // iOS : afficher les instructions manuelles
    if (ios && !standalone) {
      const dismissed = sessionStorage.getItem('pwa-ios-dismissed');
      if (!dismissed) setTimeout(() => setShowIOS(true), 3000);
      return;
    }

    // Android / Chrome / Edge : écouter l'événement d'installation
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      const dismissed = localStorage.getItem('pwa-dismissed');
      if (!dismissed) setTimeout(() => setShow(true), 2000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setInstalled(true); setShow(false); });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setShow(false);
    setPrompt(null);
  };

  const dismiss = () => {
    setShow(false);
    setShowIOS(false);
    localStorage.setItem('pwa-dismissed', '1');
    sessionStorage.setItem('pwa-ios-dismissed', '1');
  };

  if (installed) return null;

  return (
    <>
      {/* Android / Chrome install banner */}
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
            }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--brand)', fontSize: '24px' }}>
              🎟️
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                Installer TicketFlow
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Accès rapide, fonctionne hors ligne
              </p>
            </div>
            <button onClick={handleInstall}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--brand)', color: '#fff' }}>
              <Download size={13} /> Installer
            </button>
            <button onClick={dismiss} className="p-1.5 rounded-lg flex-shrink-0"
              style={{ color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS instructions */}
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
            }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Smartphone size={18} style={{ color: 'var(--accent)' }} />
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Installer sur iPhone / iPad
                </p>
              </div>
              <button onClick={dismiss} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
            </div>
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
