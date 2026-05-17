import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, ArrowRight, Zap, Shield, Smartphone } from 'lucide-react';
import { getEvents } from '../services/api';
import EventCard from '../components/EventCard';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvents()
      .then(r => setEvents(r.data.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* HERO — Reste sombre et immersif dans les deux thèmes pour un rendu premium */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16" style={{ backgroundColor: '#050C18' }}>
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#050C18] via-[#0D1B2E] to-[#050C18]" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, #C0392B33 0%, transparent 50%), radial-gradient(circle at 80% 20%, #3B82F633 0%, transparent 40%)'
        }} />
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, #ffffff08 40px, #ffffff08 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #ffffff08 40px, #ffffff08 41px)' }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 border text-xs font-bold px-4 py-2 rounded-full mb-6 tracking-widest"
              style={{ backgroundColor: 'rgba(192, 57, 43, 0.2)', borderColor: 'rgba(192, 57, 43, 0.3)', color: '#F1948A' }}>
              <Zap size={12} /> TICKETFLOW — POINTE-NOIRE
            </div>

            <h1 className="font-display text-6xl md:text-8xl lg:text-9xl tracking-widest text-white mb-4 leading-none">
              VOS TICKETS<br />
              <span style={{ color: 'var(--brand)' }}>EN LIGNE</span>
            </h1>

            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Réservez vos billets pour les événements ESTAM et bien plus encore.
              QR code sécurisé, paiement Mobile Money, téléchargement instantané.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/events" className="btn-primary flex items-center justify-center gap-2 text-lg px-8 py-4">
                Voir les événements <ArrowRight size={18} />
              </Link>
              <Link to="/scanner" className="btn-secondary flex items-center justify-center gap-2 text-lg px-8 py-4">
                Scanner QR <Smartphone size={18} />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 text-xs">
          <span>DÉFILER</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-px h-8 bg-white/20" />
        </div>
      </section>

      {/* EVENTS PREVIEW — S'adapte dynamiquement au thème */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--brand)' }}>Prochains événements</p>
            <h2 className="font-display text-4xl md:text-5xl tracking-wide text-primary">À NE PAS MANQUER</h2>
          </div>
          <Link to="/events" className="hidden md:flex items-center gap-2 text-sm font-bold transition-colors hover:opacity-80"
            style={{ color: 'var(--accent)' }}>
            Tous les événements <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card h-72 animate-pulse">
                <div className="h-44 rounded-t-2xl" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                <div className="p-4 space-y-3">
                  <div className="h-4 rounded w-3/4" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                  <div className="h-3 rounded w-1/2" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.slice(0, 6).map((ev, i) => <EventCard key={ev.id} event={ev} index={i} />)}
          </div>
        ) : (
          <div className="text-center py-20 text-muted">
            <Ticket size={48} className="mx-auto mb-4 opacity-30" />
            <p>Aucun événement disponible pour l'instant.</p>
          </div>
        )}
      </section>

      {/* FEATURES — S'adapte dynamiquement au thème */}
      <section className="py-20 surface">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-display text-4xl tracking-wide text-center text-primary mb-14">POURQUOI TICKETFLOW ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'QR Sécurisé', desc: 'Chaque ticket génère un QR code unique cryptographiquement signé. Impossible à falsifier.' },
              { icon: Smartphone, title: 'Mobile Money', desc: 'Paiement via Airtel Money et MTN Mobile Money. Rapide, simple, sans carte bancaire.' },
              { icon: Ticket, title: 'Ticket PDF', desc: 'Téléchargez votre ticket en PDF. Présentez-le à l\'entrée, en ligne ou imprimé.' },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} viewport={{ once: true }}
                className="card card-hover p-6 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(192, 57, 43, 0.1)' }}>
                  <f.icon size={24} style={{ color: 'var(--brand)' }} />
                </div>
                <h3 className="font-bold text-primary text-lg mb-2">{f.title}</h3>
                <p className="text-secondary text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="divider border-t py-8 px-4 text-center text-muted text-sm">
        <p>© {new Date().getFullYear()} TicketFlow — ESTAM BDE · Pointe-Noire, Congo</p>
      </footer>
    </div>
  );
}