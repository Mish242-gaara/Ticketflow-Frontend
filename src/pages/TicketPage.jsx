import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Calendar, MapPin, User, Phone, CheckCircle, XCircle, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTicket, downloadTicket } from '../services/api';

const statusConfig = {
  active:  { label: 'Valide', color: 'var(--success)', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', icon: CheckCircle },
  used:    { label: 'Déjà scanné', color: 'var(--brand)', bg: 'rgba(192,57,43,0.1)', border: 'rgba(192,57,43,0.25)', icon: XCircle },
  pending: { label: 'En attente paiement', color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', icon: Clock },
};

export default function TicketPage() {
  const { uuid } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    getTicket(uuid)
      .then(r => setTicket(r.data.ticket))
      .catch(() => toast.error('Ticket introuvable'))
      .finally(() => setLoading(false));
  }, [uuid]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await downloadTicket(uuid);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${uuid.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Ticket téléchargé !');
    } catch {
      toast.error('Erreur lors du téléchargement');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
        Ticket introuvable.
      </div>
    );
  }

  const status = statusConfig[ticket.status] || statusConfig.active;
  const date = ticket.event_date ? new Date(ticket.event_date) : null;
  const catColor = ticket.color || 'var(--accent)';

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 flex items-start justify-center" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div className="w-full max-w-md">
        <Link to="/my-tickets" className="flex items-center gap-2 text-sm mb-6 transition-colors" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={14} /> Mes tickets
        </Link>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          
          {/* Status badge */}
          <div 
            className="flex items-center gap-2 border rounded-xl px-4 py-3 mb-4"
            style={{ backgroundColor: status.bg, borderColor: status.border }}>
            <status.icon size={16} style={{ color: status.color }} />
            <span className="font-bold text-sm" style={{ color: status.color }}>{status.label}</span>
          </div>

          {/* Ticket card */}
          <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            
            {/* Top colored bar */}
            <div className="h-2" style={{ background: catColor }} />

            <div className="p-6 space-y-4">
              {/* Event title & category */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>Événement</p>
                <h2 className="font-bold text-xl leading-tight" style={{ color: 'var(--text-primary)' }}>{ticket.event_title}</h2>
                <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: catColor + '25', color: catColor }}>
                  {ticket.category_name}
                </span>
              </div>

              <div className="border-t" style={{ borderColor: 'var(--border)' }} />

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {date && (
                  <>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--text-secondary)' }}><Calendar size={11} /> Date</div>
                      <p className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--text-secondary)' }}><Clock size={11} /> Heure</div>
                      <p className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </>
                )}
                <div>
                  <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--text-secondary)' }}><MapPin size={11} /> Lieu</div>
                  <p className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{ticket.event_location}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--text-secondary)' }}><User size={11} /> Participant</div>
                  <p className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{ticket.holder_name}</p>
                </div>
                {ticket.holder_phone && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--text-secondary)' }}><Phone size={11} /> Téléphone</div>
                    <p className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{ticket.holder_phone}</p>
                  </div>
                )}
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Montant</div>
                  <p className="font-bold text-xs" style={{ color: catColor }}>
                    {parseFloat(ticket.price) === 0 ? 'GRATUIT' : `${parseInt(ticket.price).toLocaleString()} FCFA`}
                  </p>
                </div>
              </div>

              {/* Dashed separator with ticket notches */}
              <div className="border-t border-dashed relative" style={{ borderColor: 'var(--border-strong)' }}>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-9 w-6 h-6 rounded-full" style={{ background: 'var(--bg-base)' }} />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-9 w-6 h-6 rounded-full" style={{ background: 'var(--bg-base)' }} />
              </div>

              {/* QR Code section */}
              {ticket.qr_code && (
                <div className="flex flex-col items-center py-4">
                  <div className="bg-white p-3 rounded-xl shadow-inner">
                    <img src={ticket.qr_code} alt="QR Code" className="w-40 h-40" />
                  </div>
                  <p className="text-xs mt-3 font-mono tracking-wider" style={{ color: 'var(--text-secondary)' }}>{ticket.ticket_uuid.toUpperCase().slice(0, 20)}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>ADMIT ONE · VALIDE 1 PERSONNE</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <button 
            type="button"
            onClick={handleDownload} 
            disabled={downloading || ticket.status === 'pending'}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-4">
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {downloading ? 'Téléchargement...' : 'Télécharger le PDF'}
          </button>

          {/* Payment Warning Text */}
          {ticket.status === 'pending' && (
            <p className="text-xs text-center mt-3 font-semibold" style={{ color: 'var(--warning)' }}>
              ⚠️ En attente de confirmation du paiement
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}