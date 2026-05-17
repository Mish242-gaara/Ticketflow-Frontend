import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle, XCircle, AlertCircle, Camera, RefreshCw, ScanLine, Shield, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { verifyTicket } from '../services/api';
import useAuthStore from '../store/authStore';

const RESULT_CONFIG = {
  VALID:   { bg: 'rgba(16,185,129,0.12)', border: 'var(--success)', text: 'var(--success)', icon: CheckCircle,  label: 'VALIDE' },
  USED:    { bg: 'rgba(192,57,43,0.12)',  border: 'var(--brand)',   text: 'var(--brand)',   icon: XCircle,      label: 'DÉJÀ UTILISÉ' },
  INVALID: { bg: 'rgba(192,57,43,0.12)',  border: 'var(--brand)',   text: 'var(--brand)',   icon: AlertCircle,  label: 'INVALIDE' },
};

export default function Scanner() {
  const { user } = useAuthStore();
  const [scanning, setScanning]   = useState(false);
  const [result, setResult]       = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const html5QrRef = useRef(null);
  const cooldown   = useRef(false);

  const stopScanner = useCallback(async () => {
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop();
        await html5QrRef.current.clear();
      } catch {}
      html5QrRef.current = null;
    }
    setScanning(false);
  }, []);

  const handleScan = useCallback(async (qrData) => {
    if (cooldown.current || verifying) return;
    cooldown.current = true;
    setVerifying(true);
    await stopScanner();

    try {
      const res = await verifyTicket(qrData);
      const { result: r, message, ticket } = res.data;
      setResult({ type: r, message, ticket });
      if (r === 'VALID') setScanCount(c => c + 1);
      
      toast(message, {
        icon: r === 'VALID' ? '✅' : '❌',
        style: {
          background: r === 'VALID' ? 'rgba(16,185,129,0.2)' : 'rgba(192,57,43,0.2)',
          border: `1px solid ${r === 'VALID' ? 'var(--success)' : 'var(--brand)'}`,
          color: 'var(--text-primary)',
        },
      });
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur de vérification';
      setResult({ type: 'INVALID', message: msg, ticket: null });
      toast.error(msg);
    } finally {
      setVerifying(false);
      setTimeout(() => { cooldown.current = false; }, 2000);
    }
  }, [verifying, stopScanner]);

  const startScanner = async () => {
    setResult(null);
    setScanning(true);
    try {
      await new Promise(r => setTimeout(r, 100));
      const scanner = new Html5Qrcode('qr-reader-container');
      html5QrRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: (w, h) => ({ width: Math.min(w, h) * 0.7, height: Math.min(w, h) * 0.7 }),
          aspectRatio: 1,
        },
        handleScan,
        () => {} // Erreur silencieuse de frame manquante
      );
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      setScanning(false);
    }
  };

  const reset = () => { setResult(null); };

  useEffect(() => () => { stopScanner(); }, [stopScanner]);

  const cfg = result ? RESULT_CONFIG[result.type] : null;

  return (
    <div className="min-h-screen pt-20 pb-20 px-4" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-sm mx-auto mt-6">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield size={16} style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
              Admin · Contrôle d'accès
            </span>
          </div>
          <h1 className="font-display text-5xl tracking-widest text-primary">SCANNER</h1>
          <p className="text-muted text-sm mt-1">Vérification des tickets QR code</p>
        </div>

        {/* Session counter */}
        {scanCount > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 text-center">
            <span className="text-sm font-bold" style={{ color: 'var(--success)' }}>
              ✅ {scanCount} ticket{scanCount > 1 ? 's' : ''} validé{scanCount > 1 ? 's' : ''} cette session
            </span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* ── SCANNER VIEW ─────────────────────────────────────────── */}
          {!result && (
            <motion.div key="scanner"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}>

              <div className="rounded-2xl overflow-hidden mb-4 relative"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

                {/* QR Reader container */}
                <div id="qr-reader-container" style={{ width: '100%', minHeight: scanning ? '320px' : '0' }} />

                {/* Idle state */}
                {!scanning && (
                  <div className="p-10 flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-2xl flex items-center justify-center"
                      style={{ background: 'var(--input-bg)', border: '2px dashed var(--border-strong)' }}>
                      <Camera size={36} className="text-muted" />
                    </div>
                    <p className="text-secondary text-sm text-center leading-relaxed">
                      Appuyez sur <strong className="text-primary font-semibold">Démarrer</strong> pour activer la caméra et scanner un ticket.
                    </p>
                  </div>
                )}

                {/* Scan overlay */}
                {scanning && !verifying && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {[
                      'top-8 left-8 border-t-2 border-l-2 rounded-tl-lg',
                      'top-8 right-8 border-t-2 border-r-2 rounded-tr-lg',
                      'bottom-8 left-8 border-b-2 border-l-2 rounded-bl-lg',
                      'bottom-8 right-8 border-b-2 border-r-2 rounded-br-lg',
                    ].map((cls, i) => (
                      <div key={i} className={`absolute w-8 h-8 ${cls}`} style={{ borderColor: 'var(--brand)' }} />
                    ))}
                    {/* Scan line animated */}
                    <motion.div
                      animate={{ top: ['15%', '85%', '15%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                      className="absolute left-10 right-10 h-0.5"
                      style={{ 
                        background: 'linear-gradient(90deg, transparent, var(--brand), transparent)', 
                        boxShadow: '0 0 12px var(--brand)', 
                        position: 'absolute' 
                      }}
                    />
                  </div>
                )}

                {/* Verifying overlay */}
                {verifying && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                    style={{ background: 'rgba(13, 27, 46, 0.9)' }}>
                    <ScanLine size={40} className="animate-pulse" style={{ color: 'var(--accent)' }} />
                    <p className="text-secondary font-semibold">Vérification en cours…</p>
                  </div>
                )}
              </div>

              {scanning ? (
                <button type="button" onClick={stopScanner} className="btn-secondary w-full flex items-center justify-center gap-2">
                  <X size={16} /> Arrêter le scanner
                </button>
              ) : (
                <button type="button" onClick={startScanner} disabled={verifying}
                  className="btn-primary w-full flex items-center justify-center gap-2">
                  <Camera size={18} /> Démarrer le scanner
                </button>
              )}
            </motion.div>
          )}

          {/* ── RESULT VIEW ──────────────────────────────────────────── */}
          {result && cfg && (
            <motion.div key="result"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}>

              <div className="rounded-2xl p-6 mb-4 text-center"
                style={{ background: cfg.bg, border: `2px solid ${cfg.border}` }}>

                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                  className="mb-4">
                  <cfg.icon size={72} style={{ color: cfg.text, margin: '0 auto' }} />
                </motion.div>

                <h2 className="font-display text-4xl tracking-widest mb-2" style={{ color: cfg.text }}>
                  {cfg.label}
                </h2>
                <p className="text-secondary text-sm mb-4">{result.message}</p>

                {/* Ticket data block */}
                {result.ticket && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="rounded-xl p-4 text-left space-y-2 mt-2"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                    
                    {result.ticket.holder_name && (
                      <div>
                        <p className="text-muted text-xs">Participant</p>
                        <p className="text-primary font-bold text-lg">{result.ticket.holder_name}</p>
                      </div>
                    )}
                    
                    {result.ticket.holder_phone && (
                      <div>
                        <p className="text-muted text-xs">Téléphone</p>
                        <p className="text-secondary font-mono text-sm">{result.ticket.holder_phone}</p>
                      </div>
                    )}
                    
                    {result.ticket.category_name && (
                      <div>
                        <p className="text-muted text-xs">Catégorie</p>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-0.5"
                          style={{ background: (result.ticket.color || 'var(--accent)') + '25', color: result.ticket.color || 'var(--accent)' }}>
                          {result.ticket.category_name}
                        </span>
                      </div>
                    )}
                    
                    {result.ticket.scanned_at && (
                      <div>
                        <p className="text-muted text-xs">Scanné le</p>
                        <p className="text-secondary text-sm">{new Date(result.ticket.scanned_at).toLocaleString('fr-FR')}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              <button type="button" onClick={reset}
                className="btn-secondary w-full flex items-center justify-center gap-2">
                <RefreshCw size={16} /> Scanner un autre ticket
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-muted text-xs text-center mt-6">
          Réservé aux administrateurs · TicketFlow
        </p>
      </div>
    </div>
  );
}