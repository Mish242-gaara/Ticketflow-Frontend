import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, Calendar, MapPin, QrCode, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyTickets, downloadTicket } from '../services/api';

const statusBadge = {
  active:  { label: '✅ Valide',            cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  used:    { label: '🔵 Scanné',            cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  pending: { label: '⏳ Paiement en attente', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
};

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    getMyTickets()
      .then(r => setTickets(r.data.tickets || []))
      .catch(() => toast.error('Erreur chargement tickets'))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (uuid) => {
    setDownloading(uuid);
    try {
      const res = await downloadTicket(uuid);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; 
      a.download = `ticket-${uuid.slice(0, 8)}.pdf`; 
      a.click();
      URL.revokeObjectURL(url);
    } catch { 
      toast.error('Erreur téléchargement'); 
    } finally { 
      setDownloading(null); 
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-5xl tracking-wide text-primary mb-2">MES TICKETS</h1>
          <p className="text-muted text-sm mb-8">Tous vos billets et réservations</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--brand)' }} />
          </div>
        ) : tickets.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Ticket size={48} className="mx-auto mb-4 text-muted" />
            <p className="text-muted mb-6">Vous n'avez pas encore de tickets.</p>
            <Link to="/events" className="btn-primary inline-flex items-center gap-2">
              Voir les événements
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {tickets.map((t, i) => {
              const status = statusBadge[t.status] || statusBadge.active;
              const date = t.event_date ? new Date(t.event_date) : null;
              const currentUuid = t.ticket_uuid || t.uuid;

              return (
                <motion.div 
                  key={currentUuid || i} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.07 }}
                  className="card overflow-hidden flex">
                  
                  {/* Bandeau de couleur associé à la catégorie */}
                  <div className="w-1.5 flex-shrink-0" style={{ background: t.color || 'var(--accent)' }} />

                  <div className="flex-1 p-4 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-primary">{t.event_title}</h3>
                        <span className={`badge border text-xs px-2 py-0.5 ${status.cls}`}>{status.label}</span>
                      </div>
                      
                      <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-2"
                        style={{ background: (t.color || '#3B82F6') + '25', color: t.color || 'var(--accent)' }}>
                        {t.category_name}
                      </span>
                      
                      <div className="flex flex-wrap gap-3 text-secondary text-xs">
                        {date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        )}
                        {t.event_location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} /> {t.event_location}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link to={`/ticket/${currentUuid}`}
                        className="flex items-center gap-1.5 text-secondary hover:text-primary px-3 py-2 rounded-lg text-xs font-bold transition-all"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                        <QrCode size={13} /> Voir QR
                      </Link>
                      
                      {t.status !== 'pending' && (
                        <button 
                          type="button"
                          onClick={() => handleDownload(currentUuid)} 
                          disabled={downloading === currentUuid}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                          style={{ 
                            background: 'rgba(59, 130, 246, 0.1)', 
                            color: 'var(--accent)' 
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}>
                          {downloading === currentUuid ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Download size={13} />
                          )}
                          PDF
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}