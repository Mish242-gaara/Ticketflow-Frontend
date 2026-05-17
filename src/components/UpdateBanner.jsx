import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

export default function UpdateBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    window.addEventListener('sw-update', () => setShow(true));
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -60 }} animate={{ y: 0 }} exit={{ y: -60 }}
        className="fixed top-16 left-0 right-0 z-50 flex justify-center px-4 pt-2">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 20px rgba(59,130,246,0.4)' }}>
          <RefreshCw size={14} />
          <span>Mise à jour disponible !</span>
          <button onClick={() => window.location.reload()}
            className="ml-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-bold transition-colors">
            Actualiser
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
