import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, ArrowRight, Shield, Smartphone, Facebook, Instagram, Linkedin } from 'lucide-react';
import { getEvents } from '../services/api';
import EventCard from '../components/EventCard';

// 1. Configuration des images (Mettez vos vrais chemins ici)
const HERO_IMAGES = [
  '/images/hero-bg.jpg',
  '/images/hero-bg.jpeg',
  // Vous pouvez ajouter d'autres images ici plus tard
];

// 2. Durée d'affichage d'une image avant le changement (en secondes)
const IMAGE_DURATION_SEC = 5; // Changement lent

// Variantes d'animation existantes (inchangées)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

const heroTextVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

const buttonVariants = {
  hover: { scale: 1.05, transition: { duration: 0.3, ease: "easeInOut" } },
  tap: { scale: 0.95 }
};

// --- FIN Variantes existantes ---

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 3. État pour gérer l'image de fond actuelle
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Charger les événements (inchangé)
  useEffect(() => {
    getEvents()
      .then(r => setEvents(r.data.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 4. Logique de défilement aléatoire et en boucle
  useEffect(() => {
    // Ne rien faire s'il n'y a pas assez d'images
    if (HERO_IMAGES.length < 2) return;

    // Fonction pour choisir la prochaine image de manière aléatoire mais différente
    const setNextRandomImage = () => {
      setCurrentImageIndex((prevIndex) => {
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * HERO_IMAGES.length);
        } while (nextIndex === prevIndex); // Assure que la nouvelle image est différente
        return nextIndex;
      });
    };

    // Initialiser le timer pour changer l'image
    const timer = setInterval(setNextRandomImage, IMAGE_DURATION_SEC * 1000);

    // Nettoyer le timer au démontage du composant
    return () => clearInterval(timer);
  }, []);

  // 5. Mémoriser les styles de fond pour la performance
  const backgroundStyle = useMemo(() => ({
    backgroundSize: "cover",
    backgroundPosition: "center",
  }), []);

  return (
    <div className="min-h-screen pt-16" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      
      {/* 6. HERO SECTION MODIFIÉE POUR LE FADE INTERNE */}
      <section
        className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden"
      >
        {/* 7. Conteneur des images de fond superposées (Fade interne) */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence initial={false}>
            <motion.div
              key={HERO_IMAGES[currentImageIndex]} // La clé force Framer Motion à recréer l'élément pour le fade
              className="absolute inset-0"
              style={{
                ...backgroundStyle,
                backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${HERO_IMAGES[currentImageIndex]}')`,
              }}
              // 8. Animation de transition douce (Fade lent)
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 2, // Durée du fade (2s pour la lenteur)
                ease: "easeInOut" 
              }}
            />
          </AnimatePresence>
        </div>

        {/* 9. Contenu texte (Z-index supérieur pour rester au-dessus) */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <motion.div variants={heroTextVariants} initial="hidden" animate="visible" className="space-y-6">
            <motion.h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wider mb-4 leading-tight" style={{ color: '#FFFFFF' }} variants={heroTextVariants}>
              TROUVEZ VOS BILLETS
            </motion.h1>
            <motion.span className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wider leading-tight block" style={{ color: '#E50914' }} variants={heroTextVariants}>
              POUR LES MEILLEURS ÉVÉNEMENTS
            </motion.span>
            <motion.p className="text-lg md:text-xl max-w-2xl mx-auto mb-10" style={{ color: 'rgba(255, 255, 255, 0.9)' }} variants={heroTextVariants}>
              Réservez en ligne, payez avec Mobile Money, téléchargez instantanément.
            </motion.p>
            
            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={containerVariants}>
              <motion.div variants={itemVariants}>
                <Link to="/events" className="bg-[#E50914] hover:bg-[#B81D1D] text-white font-bold py-4 px-8 rounded-lg flex items-center justify-center gap-2 transition-colors" variants={buttonVariants} whileHover="hover" whileTap="tap">
                  Voir les événements <ArrowRight size={18} />
                </Link>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Link to="/scanner" className="bg-transparent border-2 border-[#E50914] text-[#E50914] hover:bg-[#E50914] hover:text-white font-bold py-4 px-8 rounded-lg flex items-center justify-center gap-2 transition-colors" variants={buttonVariants} whileHover="hover" whileTap="tap">
                  Scanner QR <Smartphone size={18} />
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* EVENTS PREVIEW (inchangé) */}
      <motion.section className="max-w-7xl mx-auto px-4 py-20" style={{ backgroundColor: 'var(--bg-base)' }} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerVariants}>
        <motion.div className="flex items-end justify-between mb-10" variants={itemVariants}>
          <div>
            <motion.p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--brand)' }}>Prochains événements</motion.p>
            <motion.h2 className="font-display text-4xl md:text-5xl tracking-wide" style={{ color: 'var(--text-primary)' }}>À NE PAS MANQUER</motion.h2>
          </div>
          <Link to="/events" className="hidden md:flex items-center gap-2 text-sm font-bold transition-colors hover:opacity-80" style={{ color: 'var(--brand)' }}>
            Tous les événements <ArrowRight size={14} />
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-80 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--bg-elevated)' }} />)}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.slice(0, 6).map((ev, i) => <EventCard key={ev.id} event={ev} index={i} />)}
          </div>
        ) : (
          <div className="text-center py-20"><p style={{ color: 'var(--text-muted)' }}>Aucun événement disponible.</p></div>
        )}
      </motion.section>

      {/* FOOTER (inchangé, avecLinkedin et target="_blank") */}
      <motion.footer className="border-t py-12 px-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-base)' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Ticket size={24} style={{ color: 'var(--brand)' }} />
              <span className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>TICKETFLOW</span>
            </Link>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>La plateforme n°1 pour vos billets à Pointe-Noire.</p>
          </div>

          <div>
            <h4 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Liens rapides</h4>
            <ul className="space-y-2">
              <li><Link to="/events" className="text-sm" style={{ color: 'var(--text-secondary)' }}>Événements</Link></li>
              <li><Link to="/about" className="text-sm" style={{ color: 'var(--text-secondary)' }}>À propos</Link></li>
              <li><Link to="/contact" className="text-sm" style={{ color: 'var(--text-secondary)' }}>Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Réseaux sociaux</h4>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/share/1LBjudMkVw/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }}><Facebook size={20} /></a>
              <a href="https://instagram.com/votre_profil" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }}><Instagram size={20} /></a>
              <a href="https://linkedin.com/company/votre_profil" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }}><Linkedin size={20} /></a>
            </div>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-sm" style={{ borderColor: 'var(--border)' }}>
            <p style={{ color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} TicketFlow — ESTAM BDE · Pointe-Noire, Congo
            </p>
        </div>
      </motion.footer>
    </div>
  );
}