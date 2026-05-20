import { motion } from 'framer-motion';
import { Ticket, Users, Target, ShieldCheck } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div className="max-w-4xl mx-auto">
        
        {/* Titre avec animation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-display mb-6">À PROPOS DE <span style={{ color: '#E50914' }}>TICKETFLOW</span></h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Révolutionner l'expérience événementielle à Pointe-Noire, une billetterie à la fois.
          </p>
        </motion.div>

        {/* Section Mission */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Target className="text-[#E50914]" /> Notre Mission
          </h2>
          <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            TicketFlow est né d'un constat simple : accéder aux meilleurs événements à Pointe-Noire devrait être aussi simple que quelques clics. 
            Nous avons créé une plateforme sécurisée qui fait le pont entre les organisateurs passionnés et le public, 
            en éliminant les files d'attente et en simplifiant le processus de paiement grâce au Mobile Money.
          </p>
        </section>

        {/* Section Valeurs */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {[
            { icon: ShieldCheck, title: "Sécurité Totale", desc: "Chaque billet est unique, vérifié et infalsifiable." },
            { icon: Users, title: "Proximité", desc: "Une solution pensée par et pour les acteurs culturels congolais." },
          ].map((item, idx) => (
            <div key={idx} className="p-6 rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
              <item.icon className="text-[#E50914] mb-4" size={32} />
              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Section Équipe / Contact */}
        <section className="text-center p-10 rounded-2xl" style={{ backgroundColor: 'var(--bg-elevated)' }}>
          <h2 className="text-2xl font-bold mb-4">Envie de collaborer ?</h2>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            Vous organisez un événement et vous souhaitez utiliser TicketFlow ? Contactez-nous dès maintenant.
          </p>
          <a 
            href="mailto:contact@ticketflow.cg" 
            className="inline-block bg-[#E50914] hover:bg-[#B81D1D] text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Nous contacter
          </a>
        </section>
      </div>
    </div>
  );
}