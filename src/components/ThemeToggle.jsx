import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useThemeStore from '../store/themeStore';

const THEMES = [
  { id: 'system', label: 'Système',  Icon: Monitor },
  { id: 'dark',   label: 'Sombre',   Icon: Moon    },
  { id: 'light',  label: 'Clair',    Icon: Sun     },
];

export default function ThemeToggle({ compact = false }) {
  const { theme, setTheme } = useThemeStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = THEMES.find(t => t.id === theme) || THEMES[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (compact) {
    // Bouton icon only — cycle entre les thèmes
    const cycle = () => {
      const idx  = THEMES.findIndex(t => t.id === theme);
      const next = THEMES[(idx + 1) % THEMES.length];
      setTheme(next.id);
    };
    return (
      <button onClick={cycle} title={`Thème: ${current.label}`}
        className="p-2 rounded-xl transition-all duration-200 hover:scale-110"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
        <current.Icon size={16} />
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
        <current.Icon size={14} />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50 min-w-[140px]"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
            }}>
            {THEMES.map(t => (
              <button key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-all text-left"
                style={{
                  color: theme === t.id ? 'var(--accent)' : 'var(--text-secondary)',
                  background: theme === t.id ? 'rgba(59,130,246,0.08)' : 'transparent',
                }}>
                <t.Icon size={14} />
                {t.label}
                {theme === t.id && <span className="ml-auto text-xs">✓</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
