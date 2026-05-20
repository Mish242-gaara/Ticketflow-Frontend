import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Camera, RefreshCw, ScanLine, Shield, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { verifyTicket } from '../services/api';

// Chargement dynamique de ZXing pour éviter les conflits
let BrowserQRCodeReader;

const RESULT_CONFIG = {
  VALID: {
    bg: 'rgba(16, 185, 129, 0.12)',
    border: '#10B981',
    text: '#10B981',
    icon: CheckCircle,
    label: 'VALIDE'
  },
  USED: {
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
  const [reloadKey, setReloadKey] = useState(0); // Clé pour forcer le rechargement

  // Références
  const scannerRef = useRef(null);
  const verifyingRef = useRef(false);
  const cooldownRef = useRef(false);
  const mountedRef = useRef(true);
  const codeReaderRef = useRef(null);
  const videoRef = useRef(null);

  // Initialisation et nettoyage
  useEffect(() => {
    mountedRef.current = true;

    // Charger ZXing dynamiquement
    const loadZXing = async () => {
      try {
        const { BrowserQRCodeReader: QRCodeReader } = await import('@zxing/library');
        BrowserQRCodeReader = QRCodeReader;
        codeReaderRef.current = new QRCodeReader();
      } catch (err) {
        console.error("Échec du chargement de ZXing:", err);
        if (mountedRef.current) setCamError("Erreur : bibliothèque de scan introuvable.");
      }
    };

    loadZXing();

    return () => {
      mountedRef.current = false;
      _forceStop(); // Nettoyer avant le démontage
    };
  }, []);

  // Nettoyage complet du scanner et de la caméra
  const _forceStop = async () => {
    // Arrêter le scanner ZXing
    if (scannerRef.current) {
      try {
        await scannerRef.current?.reset?.();
      } catch (e) {
        console.error("Erreur lors de l'arrêt du scanner:", e);
      }
      scannerRef.current = null;
    }

    // Libérer la caméra
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {
          console.error("Erreur lors de l'arrêt de la track:", e);
        }
      });
      videoRef.current.srcObject = null;
    }

    // Réinitialiser toutes les références
    codeReaderRef.current = null;
    if (mountedRef.current) setScanning(false);
  };

  // Gestion du succès de scan
  const handleScanSuccess = async (qrData) => {
    if (cooldownRef.current || verifyingRef.current) return;

    cooldownRef.current = true;
    verifyingRef.current = true;
    setVerifying(true);

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
          duration: 2000,
        });
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Erreur de vérification';
      if (mountedRef.current) {
        setResult({ type: 'INVALID', message: msg, ticket: null });
        toast.error(msg, { duration: 2000 });
      }
    } finally {
      verifyingRef.current = false;
      if (mountedRef.current) setVerifying(false);
      setTimeout(() => { cooldownRef.current = false; }, 1000);
    }
  };

  // Démarrer le scanner avec ZXing
  const startScanner = async () => {
    setCamError(null);
    setResult(null);
    cooldownRef.current = false;
    verifyingRef.current = false;

    await _forceStop();
    setReloadKey(prev => prev + 1); // Force le rechargement du conteneur

    const container = document.getElementById(SCANNER_ID);
    if (!container) {
      setCamError("Erreur interne : conteneur introuvable.");
      return;
    }

    try {
      // Créer un élément vidéo pour la caméra
      const videoElement = document.createElement('video');
      videoElement.id = 'qr-video';
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.style.objectFit = 'cover';
      videoElement.playsInline = true;
      videoElement.muted = true;
      videoElement.autoplay = true;

      // Ajouter la vidéo au conteneur
      container.innerHTML = '';
      container.appendChild(videoElement);
      videoRef.current = videoElement;

      // Démarrer la caméra
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      videoElement.srcObject = stream;

      // Attendre que la vidéo soit prête
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play().then(resolve).catch(resolve);
        };
      });

      // Démarrer la détection avec ZXing
      const codeReader = codeReaderRef.current;
      if (!codeReader) {
        throw new Error("Bibliothèque ZXing non chargée");
      }

      scannerRef.current = codeReader;

      await codeReader.decodeFromVideoDevice(
        undefined,
        videoElement,
        (result, error) => {
          if (result) {
            handleScanSuccess(result.getText());
          }
          if (error && error.name !== 'NotFoundException') {
            console.warn("Erreur de scan:", error);
          }
        }
      );

      setScanning(true);

    } catch (err) {
      console.error('[Scanner] Erreur de démarrage:', err);
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

  const stopScanner = async () => {
    await _forceStop();
  };

  const reset = () => {
    setResult(null);
    setCamError(null);
    cooldownRef.current = false;
  };

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
              transition={{ duration: 0.3 }}
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
              transition={{ duration: 0.2 }}
            >
              {/* Conteneur du scanner avec une clé unique pour forcer le rechargement */}
              <div
                className="rounded-2xl overflow-hidden mb-4 relative"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  height: '280px',
                  width: '100%',
                }}
              >
                <div
                  key={reloadKey} // ✅ Force le rechargement du conteneur
                  id={SCANNER_ID}
                  style={{ width: '100%', height: '100%' }}
                />

                {/* État initial (caméra non démarrée) */}
                {!scanning && !camError && (
                  <div className="absolute inset-0 p-6 flex flex-col items-center justify-center gap-4">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{
                        background: 'var(--input-bg)',
                        border: '2px dashed var(--border-strong)'
                      }}
                    >
                      <Camera size={28} style={{ color: 'var(--text-muted)' }} />
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
                  <div className="absolute inset-0 p-6 flex flex-col items-center justify-center gap-3 text-center">
                    <XCircle size={32} style={{ color: '#C0392B' }} />
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
                    {['top-4 left-4 border-t-[2px] border-l-[2px] rounded-tl-xl',
                      'top-4 right-4 border-t-[2px] border-r-[2px] rounded-tr-xl',
                      'bottom-4 left-4 border-b-[2px] border-l-[2px] rounded-bl-xl',
                      'bottom-4 right-4 border-b-[2px] border-r-[2px] rounded-br-xl',
                    ].map((cls, i) => (
                      <div
                        key={i}
                        className={`absolute w-6 h-6 ${cls}`}
                        style={{ borderColor: 'var(--brand)' }}
                      />
                    ))}
                    <motion.div
                      animate={{ top: ['15%', '85%', '15%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      style={{
                        position: 'absolute',
                        left: '10%',
                        right: '10%',
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
                        Alignez le QR code
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
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      style={{ display: 'flex' }}
                    >
                      <ScanLine size={36} style={{ color: 'var(--accent)' }} />
                    </motion.div>
                    <p className="font-bold text-sm text-white tracking-wide">
                      Vérification...
                    </p>
                  </div>
                )}
              </div>

              {/* Boutons de contrôle */}
              {scanning ? (
                <button
                  onClick={stopScanner}
                  className="btn-secondary w-full flex items-center justify-center gap-2 py-3"
                >
                  <X size={16} /> Fermer la caméra
                </button>
              ) : (
                <button
                  onClick={startScanner}
                  disabled={verifying}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base shadow-lg"
                >
                  <Camera size={18} /> Démarrer le scanner
                </button>
              )}

              {/* Infos utilisateur */}
              <div
                className="mt-4 p-3 rounded-xl text-xs text-center space-y-1"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                <p>💡 Connexion HTTPS requise</p>
                <p>📱 Autorisez l'accès à la caméra</p>
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
                transition={{ duration: 0.2 }}
              >
                <div
                  className="rounded-2xl p-6 mb-4 text-center"
                  style={{ background: cfg.bg, border: `2px solid ${cfg.border}` }}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -25 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, delay: 0.05 }}
                    className="mb-4"
                  >
                    <cfg.icon size={60} style={{ color: cfg.text, margin: '0 auto' }} />
                  </motion.div>

                  <h2
                    className="font-display text-3xl tracking-widest mb-2"
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
                      transition={{ delay: 0.1, duration: 0.2 }}
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
                            className="font-bold text-base"
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
                  className="btn-secondary w-full flex items-center justify-center gap-2 py-3"
                >
                  <RefreshCw size={16} /> Suivant
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