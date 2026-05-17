import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, Ticket, Maximize2, X } from 'lucide-react';

// CORRECTION : Utilisation de la variable d'environnement ou repli vers ton API Render en production
const API_URL = import.meta.env.VITE_API_URL || 'https://ton-api-backend.onrender.com';

export default function EventCard({ event, index = 0 }) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const date = new Date(event?.date);

  const availPct = event?.total_tickets > 0
    ? Math.round((event.available_tickets / event.total_tickets) * 100)
    : 0;

  const minPrice = event?.categories
    ?.filter(c => c && c.id)
    .reduce((min, c) => {
      const p = parseFloat(c.price);
      return !isNaN(p) && p < min ? p : min;
    }, Infinity);

  const hasFree = minPrice === 0;
  
  // Construit l'URL complète de l'image de manière sécurisée
  const fullImageUrl = event?.banner_url?.startsWith('http') 
    ? event.banner_url 
    : `${API_URL}${event?.banner_url || ''}`;

  // Ouvre l'image en plein écran sans déclencher le lien de la carte
  const openLightbox = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLightboxOpen(true);
  };

  if (!event) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.4 }}
        whileHover={{ y: -4 }}
        className="card card-hover overflow-hidden group cursor-pointer"
      >
        <Link to={`/events/${event.slug}`}>
          {/* Banner */}
          <div className="relative h-44 overflow-hidden" style={{ background: 'linear-gradient(135deg, #142338 0%, #1C3050 100%)' }}>
            {event.banner_url ? (
              <>
                <img
                  src={fullImageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { 
                    // Si l'image échoue, on affiche le bloc de texte de remplacement
                    e.target.style.display = 'none';
                    e.target.nextSibling?.classList.remove('hidden');
                  }}
                />
                {/* Bouton pour agrandir l'affiche */}
                <button
                  type="button"
                  onClick={openLightbox}
                  className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/70 text-white"
                  title="Voir l'affiche en taille réelle"
                >
                  <Maximize2 size={14} />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-display text-6xl tracking-widest text-muted opacity-20">
                  {event.title ? event.title.slice(0, 2).toUpperCase() : 'EV'}
                </span>
              </div>
            )}
            
            {/* Fallback au cas où l'image dynamique plante au chargement */}
            <div className="hidden absolute inset-0 flex items-center justify-center bg-slate-900">
              <span className="font-display text-6xl tracking-widest text-muted opacity-20">
                {event.title ? event.title.slice(0, 2).toUpperCase() : 'EV'}
              </span>
            </div>

            {/* Dégradé d'ombrage pour le bas de la bannière d'image */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(5,12,24,0.4) 0%, transparent 60%)' }} />

            {/* Date badge */}
            <div className="absolute top-3 left-3 bg-brand-500 text-white text-xs font-bold px-2 py-1 rounded-lg tracking-wide">
              {!isNaN(date.getTime()) ? date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).toUpperCase() : 'ND'}
            </div>

            {/* Organizer */}
            {event.organizer && (
              <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white/80 text-xs font-semibold px-2 py-1 rounded-lg">
                {event.organizer}
              </div>
            )}

            {/* Stock bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${availPct}%`,
                  background: availPct > 50 ? 'var(--success)' : availPct > 20 ? 'var(--warning)' : '#EF4444',
                }}
              />
            </div>
          </div>

          {/* Body */}
          <div className="p-4">
            <h3 className="font-bold text-primary text-lg leading-tight mb-2 group-hover:text-accent transition-colors"
              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {event.title}
            </h3>

            <div className="flex flex-col gap-1.5 mb-3">
              <div className="flex items-center gap-2 text-secondary text-xs">
                <Calendar size={11} className="flex-shrink-0" />
                <span>
                  {!isNaN(date.getTime()) 
                    ? date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                    : 'Date non définie'
                  }
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-secondary text-xs">
                  <MapPin size={11} className="flex-shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-secondary text-xs">
                <Users size={11} className="flex-shrink-0" />
                <span>
                  {event.available_tickets > 0
                    ? `${event.available_tickets} place${event.available_tickets > 1 ? 's' : ''} restante${event.available_tickets > 1 ? 's' : ''}`
                    : 'Complet'}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 divider border-t">
              <div>
                {hasFree ? (
                  <span className="font-bold text-sm flex items-center gap-1" style={{ color: 'var(--success)' }}>
                    🎓 Accès gratuit
                  </span>
                ) : minPrice !== Infinity ? (
                  <span className="text-primary font-semibold text-sm">
                    Dès <span className="font-bold" style={{ color: 'var(--accent)' }}>{parseInt(minPrice).toLocaleString()} FCFA</span>
                  </span>
                ) : null}
              </div>
              <span className="text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-lg"
                style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent)' }}>
                <Ticket size={10} /> Réserver
              </span>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* ── LIGHTBOX (MODALE PLEIN ÉCRAN) ───────────────────────────────── */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLightboxOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
          >
            {/* Bouton de fermeture */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors z-50"
            >
              <X size={24} />
            </button>

            {/* Conteneur de l'image */}
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-xl shadow-2xl border border-white/5 bg-neutral-900"
            >
              <img
                src={fullImageUrl}
                alt={event.title}
                className="w-full h-full object-contain max-h-[85vh]"
              />
              
              {/* Infos rapides au bas de l'image zoomée */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-bold text-lg">{event.title}</p>
                {event.organizer && <p className="text-white/60 text-xs">{event.organizer}</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}