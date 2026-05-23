import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="min-h-screen pt-20 px-4" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl tracking-widest mb-4" style={{ color: 'var(--text-primary)' }}>
            À PROPOS
          </h1>
          <p className="text-secondary">
            En savoir plus sur TicketFlow et notre équipe.
          </p>
        </div>

        <div className="card p-6 space-y-6">
          <section>
            <h2 className="font-bold text-2xl mb-4" style={{ color: 'var(--text-primary)' }}>Qu'est-ce que TicketFlow ?</h2>
            <p className="text-secondary">
              TicketFlow est une plateforme de gestion de tickets pour les événements universitaires.
              Elle permet aux étudiants de réserver des places, de suivre leurs réservations,
              et aux organisateurs de gérer les participants.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-2xl mb-4" style={{ color: 'var(--text-primary)' }}>Notre Équipe</h2>
            <p className="text-secondary">
              Nous sommes une équipe d'étudiants passionnés par la technologie et l'organisation d'événements.
            </p>
          </section>

          <div className="text-center mt-8">
            <Link
              to="/"
              className="btn-primary inline-flex items-center gap-2"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}