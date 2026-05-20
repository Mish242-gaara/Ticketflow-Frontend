import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, Ticket, Maximize2, X } from 'lucide-react';

// URL de base pour les images (à adapter selon ton environnement)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function EventCard({ event, index = 0 }) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageError, setImageError] = useState(false); // État pour gérer les erreurs de chargement
  const date = new Date(event?.date);

  // Calcul de la disponibilité en pourcentage
  const availPct = event?.total_tickets > 0
    ? Math.round((event.available_tickets / event.total_tickets) * 100)
    : 0;

  // Calcul du prix minimum
  const minPrice = event?.categories
    ?.filter(c => c && c.id)
    .reduce((min, c) => {
      const p = parseFloat(c.price);
      return !isNaN(p) && p < min ? p : min;
    }, Infinity);

  const hasFree = minPrice === 0;

  // Construction de l'URL de l'image avec gestion des cas
  const getImageUrl = () => {
    if (!event?.banner_url) return null;

    // Si l'URL est déjà complète (commence par http:// ou https://)
    if (event.banner_url.startsWith('http://') || event.banner_url.startsWith('https://')) {
      return event.banner_url;
    }

    // Sinon, construire l'URL complète à partir de API_URL
    return `${API_URL.replace(/\/$/, '')}/${event.banner_url.replace(/^\//, '')}`;
  };

  const fullImageUrl = getImageUrl();

  // Ouvre l'image en plein écran
  const openLightbox = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLightboxOpen(true);
  };

  if (!event) return null;

  return (
    <>
      {/* Carte d'événement */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.4 }}
        whileHover={{ y: -4 }}
        className="card card-hover overflow-hidden group cursor-pointer"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <Link to={`/events/${event.slug}`}>
          {/* Bannière de l'événement */}
          <div className="relative h-44 overflow-hidden bg-gray-800">
            {/* Afficher l'image si elle existe et qu'il n'y a pas d'erreur */}
            {fullImageUrl && !imageError ? (
              <>
                <img
                  src={fullImageUrl}
                  alt={event.title || 'Affiche de l\'événement'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={() => setImageError(true)} // Marque l'erreur si l'image ne charge pas
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
              // Fallback si pas d'image ou erreur de chargement
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <span className="font-display text-4xl tracking-widest text-white/20">
                  {event.title ? event.title.slice(0, 2).toUpperCase() : 'EV'}
                </span>
              </div>
            )}

            {/* Dégradé pour ombrager le bas de la bannière */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }}
            />

            {/* Badge de date (rouge Tikerama) */}
            <div
              className="absolute top-3 left-3 text-white text-xs font-bold px-2 py-1 rounded-lg tracking-wide"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              {!isNaN(date.getTime()) ? date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).toUpperCase() : 'ND'}
            </div>

            {/* Organisateur */}
            {event.organizer && (
              <div
                className="absolute top-3 right-3 backdrop-blur-sm text-white/80 text-xs font-semibold px-2 py-1 rounded-lg"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
              >
                {event.organizer}
              </div>
            )}

            {/* Barre de disponibilité (rouge/vert/jaune) */}
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${availPct}%`,
                  background: availPct > 50
                    ? 'var(--success)'
                    : availPct > 20
                      ? 'var(--warning)'
                      : 'var(--brand)',
                }}
              />
            </div>
          </div>

          {/* Corps de la carte */}
          <div className="p-4">
            <h3
              className="font-bold text-lg leading-tight mb-2 group-hover:text-[var(--brand)] transition-colors"
              style={{ color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {event.title}
            </h3>

            {/* Détails de l'événement */}
            <div className="flex flex-col gap-1.5 mb-3">
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <Calendar size={11} className="flex-shrink-0" style={{ color: 'var(--brand)' }} />
                <span>
                  {!isNaN(date.getTime())
                    ? date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                    : 'Date non définie'}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <MapPin size={11} className="flex-shrink-0" style={{ color: 'var(--brand)' }} />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <Users size={11} className="flex-shrink-0" style={{ color: 'var(--brand)' }} />
                <span>
                  {event.available_tickets > 0
                    ? `${event.available_tickets} place${event.available_tickets > 1 ? 's' : ''} restante${event.available_tickets > 1 ? 's' : ''}`
                    : <span style={{ color: 'var(--brand)' }}>Complet</span>}
                </span>
              </div>
            </div>

            {/* Pied de la carte */}
            <div className="flex items-center justify-between pt-2 divider" style={{ borderTopColor: 'var(--border)' }}>
              <div>
                {hasFree ? (
                  <span className="font-bold text-sm flex items-center gap-1" style={{ color: 'var(--success)' }}>
                    🎓 Accès gratuit
                  </span>
                ) : minPrice !== Infinity ? (
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    Dès <span className="font-bold" style={{ color: 'var(--brand)' }}>{parseInt(minPrice).toLocaleString()} FCFA</span>
                  </span>
                ) : null}
              </div>
              <span
                className="text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-lg transition-colors"
                style={{
                  backgroundColor: 'rgba(229, 9, 20, 0.1)',
                  color: 'var(--brand)',
                }}
              >
                <Ticket size={10} /> Réserver
              </span>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Lightbox (modale plein écran) */}
      <AnimatePresence>
        {isLightboxOpen && fullImageUrl && (
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
                alt={event.title || 'Affiche de l\'événement'}
                className="w-full h-full object-contain max-h-[85vh]"
                onError={() => setIsLightboxOpen(false)} // Ferme la lightbox si l'image ne charge pas
              />

              {/* Infos au bas de l'image zoomée */}
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