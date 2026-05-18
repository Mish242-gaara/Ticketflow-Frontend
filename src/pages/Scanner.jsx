import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Camera, RefreshCw, ScanLine, Shield, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { verifyTicket } from '../services/api';

// Configuration des résultats de scan
const RESULT_CONFIG = {
  VALID:   {
    bg: 'rgba(16, 185, 129, 0.12)',
    border: '#10B981',
    text: '#10B981',
    icon: CheckCircle,
    label: 'VALIDE'
  },
  USED:    {
    bg: 'rgba(192, 57, 43, 0.12)',
    border: '#C0392B',
    text: '#C0392B',
    icon: XCircle,
    label: 'DÉJÀ UTILISÉ'
  },
  INVALID: {
    bg: 'rgba(192, 57, 43, 0.12)',
    border: '#C0392B',
    text: '#C0392B',
    icon: AlertCircle,
    label: 'INVALIDE'
  },
};

const SCANNER_ID = 'ticketflow-qr-region';

export default function Scanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [camError, setCamError] = useState(null);

  // Références
  const scannerRef = useRef(null);
  const verifyingRef = useRef(false);
  const cooldownRef = useRef(false);
  const mountedRef = useRef(true);
  const html5QrCodeRef = useRef(null);

  // Initialisation et nettoyage
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      _forceStop();
    };
  }, []);

  // Charger la bibliothèque html5-qrcode via un script externe
  useEffect(() => {
    const loadHtml5Qrcode = () => {
      // Vérifier si la bibliothèque est déjà chargée
      if (window.Html5Qrcode) {
        html5QrCodeRef.current = window.Html5Qrcode;
        return;
      }

      // Créer un script pour charger la bibliothèque depuis un CDN
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
      script.async = true;
      script.onload = () => {
        if (window.Html5Qrcode) {
          html5QrCodeRef.current = window.Html5Qrcode;
        } else {
          console.error("La bibliothèque html5-qrcode n'a pas été chargée correctement.");
          setCamError("Erreur : bibliothèque de scan introuvable. Veuillez rafraîchir la page.");
        }
      };
      script.onerror = () => {
        console.error("Échec du chargement du script html5-qrcode.");
        setCamError("Erreur : échec du chargement de la bibliothèque de scan.");
      };
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    };

    loadHtml5Qrcode();
  }, []);

  // Arrêter le scanner
  const _forceStop = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState?.();
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.error("Erreur lors de l'arrêt du scanner:", e);
      }
      scannerRef.current = null;
    }
    if (mountedRef.current) setScanning(false);
  };

  // Gestion du succès de scan
  const handleScanSuccess = async (qrData) => {
    if (cooldownRef.current || verifyingRef.current) return;

    cooldownRef.current = true;
    verifyingRef.current = true;
    if (mountedRef.current) setVerifying(true);

    await _forceStop();

    try {
      const res = await verifyTicket(qrData);
      const { result: r, message, ticket } = res.data;

      if (mountedRef.current) {
        setResult({ type: r, message, ticket });
        if (r === 'VALID') setScanCount(c => c + 1);

        toast(message, {
          icon: r === 'VALID' ? '✅' : '❌',
          style: {
            background: r === 'VALID' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(192, 57, 43, 0.15)',
            border: `1px solid ${r === 'VALID' ? '#10B981' : '#C0392B'}`,
            color: 'var(--text-primary)',
          },
        });
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Erreur de vérification';
      if (mountedRef.current) {
        setResult({ type: 'INVALID', message: msg, ticket: null });
        toast.error(msg);
      }
    } finally {
      verifyingRef.current = false;
      if (mountedRef.current) setVerifying(false);
      setTimeout(() => { cooldownRef.current = false; }, 2500);
    }
  };

  const onScanSuccessRef = useRef((qrData) => {
    handleScanSuccess(qrData);
  });

  // Démarrer le scanner
  const startScanner = async () => {
    setCamError(null);
    setResult(null);
    cooldownRef.current = false;
    verifyingRef.current = false;

    await _forceStop();
    await new Promise(r => setTimeout(r, 150));

    const container = document.getElementById(SCANNER_ID);
    if (!container) {
      setCamError("Erreur interne : conteneur introuvable.");
      return;
    }

    if (!html5QrCodeRef.current) {
      setCamError("Bibliothèque de scan non chargée. Veuillez rafraîchir la page.");
      return;
    }

    try {
      const Html5QrcodeClass = html5QrCodeRef.current;

      // Ne pas spécifier formatsToSupport pour éviter les erreurs
      const html5Qr = new Html5QrcodeClass(SCANNER_ID, {
        verbose: false,
        qrbox: (w, h) => {
          const size = Math.min(w, h) * 0.7;
          return { width: size, height: size };
        },
        aspectRatio: 1.0,
        // On ne spécifie pas formatsToSupport pour éviter l'erreur QR_CODE
      });

      scannerRef.current = html5Qr;

      setScanning(true);

      await html5Qr.start(
        { facingMode: 'environment' },
        {
          fps: 10,
        },
        onScanSuccessRef.current,
        () => { /* Échecs d'analyse de frames */ }
      );
    } catch (err) {
      console.error('[Scanner] Erreur de démarrage:', err);
      scannerRef.current = null;
      if (mountedRef.current) {
        setScanning(false);
        const msg = err?.message || String(err);
        if (msg.toLowerCase().includes('permission')) {
          setCamError("Permission caméra refusée. Autorisez l'accès dans les paramètres.");
        } else if (msg.toLowerCase().includes('notfound') || msg.toLowerCase().includes('no camera')) {
          setCamError("Aucune caméra détectée.");
        } else {
          setCamError(`Erreur caméra : ${msg}`);
        }
      }
    }
  };

  const stopScanner = async () => { await _forceStop(); };
  const reset = () => { setResult(null); setCamError(null); };

  const cfg = result ? RESULT_CONFIG[result.type] : null;

  return (
    <div className="min-h-screen pt-20 pb-20 px-4" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-sm mx-auto mt-6">
        {/* HEADER */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3 text-xs font-bold uppercase tracking-widest"
            style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)' }}
          >
            <Shield size={13} /> Admin · Contrôle d'accès
          </div>
          <h1 className="font-display text-5xl tracking-widest mb-1" style={{ color: 'var(--text-primary)' }}>
            SCANNER
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Vérification des tickets QR code
          </p>
        </div>

        {/* Compteur de scans */}
        <AnimatePresence>
          {scanCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 text-center"
            >
              <span
                className="text-sm font-bold px-4 py-2 rounded-full inline-block"
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.25)'
                }}
              >
                ✅ {scanCount} ticket{scanCount > 1 ? 's' : ''} validé{scanCount > 1 ? 's' : ''} cette session
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="scanner-view"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
            >
              <div
                className="rounded-2xl overflow-hidden mb-4 relative"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  minHeight: scanning ? '340px' : 'auto'
                }}
              >
                <div id={SCANNER_ID} style={{ width: '100%' }} />

                {/* État initial (caméra non démarrée) */}
                {!scanning && !camError && (
                  <div className="p-10 flex flex-col items-center gap-4">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="w-24 h-24 rounded-2xl flex items-center justify-center"
                      style={{
                        background: 'var(--input-bg)',
                        border: '2px dashed var(--border-strong)'
                      }}
                    >
                      <Camera size={36} style={{ color: 'var(--text-muted)' }} />
                    </motion.div>
                    <p
                      className="text-sm text-center leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Appuyez sur <strong style={{ color: 'var(--text-primary)' }}>Démarrer</strong> pour activer la caméra.
                    </p>
                  </div>
                )}

                {/* Erreur caméra */}
                {camError && (
                  <div className="p-6 flex flex-col items-center gap-3 text-center">
                    <XCircle size={40} style={{ color: '#C0392B' }} />
                    <p className="text-sm font-semibold" style={{ color: '#C0392B' }}>
                      {camError}
                    </p>
                    <button onClick={reset} className="btn-secondary text-sm px-4 py-2">
                      Réessayer
                    </button>
                  </div>
                )}

                {/* Scanner actif */}
                {scanning && !verifying && (
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                    {['top-6 left-6 border-t-[3px] border-l-[3px] rounded-tl-xl',
                      'top-6 right-6 border-t-[3px] border-r-[3px] rounded-tr-xl',
                      'bottom-6 left-6 border-b-[3px] border-l-[3px] rounded-bl-xl',
                      'bottom-6 right-6 border-b-[3px] border-r-[3px] rounded-br-xl',
                    ].map((cls, i) => (
                      <div
                        key={i}
                        className={`absolute w-8 h-8 ${cls}`}
                        style={{ borderColor: 'var(--brand)' }}
                      />
                    ))}
                    <motion.div
                      animate={{ top: ['18%', '82%', '18%'] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                      style={{
                        position: 'absolute',
                        left: '14%',
                        right: '14%',
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, var(--brand), transparent)',
                        boxShadow: '0 0 14px var(--brand)',
                      }}
                    />
                    <div className="absolute bottom-3 left-0 right-0 text-center">
                      <span
                        className="text-xs font-bold px-3 py-1 rounded-full"
                        style={{
                          background: 'rgba(0, 0, 0, 0.6)',
                          color: 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(4px)'
                        }}
                      >
                        Alignez le QR code dans le cadre
                      </span>
                    </div>
                  </div>
                )}

                {/* Vérification en cours */}
                {verifying && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                    style={{
                      background: 'rgba(0, 0, 0, 0.85)',
                      backdropFilter: 'blur(4px)',
                      zIndex: 20
                    }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <ScanLine size={44} style={{ color: 'var(--accent)' }} />
                    </motion.div>
                    <p className="font-bold text-sm text-white tracking-wide">
                      Vérification sur le serveur…
                    </p>
                  </div>
                )}
              </div>

              {/* Boutons de contrôle */}
              {scanning ? (
                <button
                  onClick={stopScanner}
                  className="btn-secondary w-full flex items-center justify-center gap-2 py-3.5"
                >
                  <X size={16} /> Fermer l'accès caméra
                </button>
              ) : (
                <button
                  onClick={startScanner}
                  disabled={verifying}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base shadow-lg"
                >
                  <Camera size={18} /> Démarrer le scanner
                </button>
              )}

              {/* Infos utilisateur */}
              <div
                className="mt-4 p-3 rounded-xl text-xs text-center space-y-1"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                <p>💡 Connexion sécurisée requise (<strong>HTTPS</strong> ou <strong>localhost</strong>)</p>
                <p>📱 Autorisez l'accès caméra si demandé</p>
              </div>
            </motion.div>
          ) : (
            /* VUE RÉSULTAT */
            cfg && (
              <motion.div
                key="result-view"
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              >
                <div
                  className="rounded-2xl p-6 mb-4 text-center"
                  style={{ background: cfg.bg, border: `2px solid ${cfg.border}` }}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -25 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 320, delay: 0.1 }}
                    className="mb-4"
                  >
                    <cfg.icon size={80} style={{ color: cfg.text, margin: '0 auto' }} />
                  </motion.div>

                  <h2
                    className="font-display text-4xl tracking-widest mb-2"
                    style={{ color: cfg.text }}
                  >
                    {cfg.label}
                  </h2>
                  <p
                    className="text-sm mb-4"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {result.message}
                  </p>

                  {/* Détails du ticket */}
                  {result.ticket && (
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="rounded-xl p-4 text-left space-y-3"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                    >
                      {result.ticket.holder_name && (
                        <div>
                          <p
                            className="text-xs font-bold uppercase tracking-wider mb-0.5"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Participant
                          </p>
                          <p
                            className="font-bold text-lg"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {result.ticket.holder_name}
                          </p>
                        </div>
                      )}
                      {result.ticket.holder_phone && (
                        <div>
                          <p
                            className="text-xs font-bold uppercase tracking-wider mb-0.5"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Téléphone
                          </p>
                          <p
                            className="font-mono text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {result.ticket.holder_phone}
                          </p>
                        </div>
                      )}
                      {result.ticket.category_name && (
                        <div>
                          <p
                            className="text-xs font-bold uppercase tracking-wider mb-0.5"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Catégorie
                          </p>
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-full inline-block"
                            style={{
                              background: (result.ticket.color || '#3B82F6') + '28',
                              color: result.ticket.color || '#3B82F6'
                            }}
                          >
                            {result.ticket.category_name}
                          </span>
                        </div>
                      )}
                      {result.ticket.event_title && (
                        <div>
                          <p
                            className="text-xs font-bold uppercase tracking-wider mb-0.5"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Événement
                          </p>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {result.ticket.event_title}
                          </p>
                        </div>
                      )}
                      {result.ticket.scanned_at && (
                        <div>
                          <p
                            className="text-xs font-bold uppercase tracking-wider mb-0.5"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Scanné le
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {new Date(result.ticket.scanned_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                <button
                  onClick={reset}
                  className="btn-secondary w-full flex items-center justify-center gap-2 py-3.5"
                >
                  <RefreshCw size={16} /> Suivant (Billet Suivant)
                </button>
              </motion.div>
            )
          )}
        </AnimatePresence>

        <p
          className="text-xs text-center mt-6"
          style={{ color: 'var(--text-muted)' }}
        >
          Réservé aux administrateurs · TicketFlow
        </p>
      </div>
    </div>
  );
}