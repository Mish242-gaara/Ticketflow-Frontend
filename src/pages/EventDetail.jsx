import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, Users, ChevronRight, X, Loader2, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEvent, reserveTicket, checkPayment } from '../services/api';

const API_URL = 'http://localhost:5000';

export default function EventDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [event, setEvent]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [selectedCat, setSelectedCat] = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [waitingPayment, setWaitingPayment] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [form, setForm] = useState({
    holder_name: '', holder_phone: '', holder_email: '', payment_method: 'mtn',
  });

  useEffect(() => {
    getEvent(slug)
      .then(r => setEvent(r.data.event))
      .catch(() => toast.error('Événement introuvable'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleReserve = async () => {
    if (!form.holder_name.trim()) return toast.error('Nom requis');
    if (!form.holder_phone.trim()) return toast.error('Téléphone requis');
    setSubmitting(true);
    try {
      const res = await reserveTicket({
        event_id: event.id,
        category_id: selectedCat.id,
        holder_name: form.holder_name.trim(),
        holder_phone: form.holder_phone.trim(),
        holder_email: form.holder_email.trim() || undefined,
        payment_method: form.payment_method,
      });

      const { ticket, payment_required, payment } = res.data;

      if (!payment_required) {
        toast.success('🎉 Ticket réservé avec succès !');
        navigate(`/ticket/${ticket.ticket_uuid}`);
        return;
      }

      // Paiement requis — attendre confirmation
      setPaymentInfo(payment);
      setWaitingPayment(true);
      toast('📱 Confirmez le paiement sur votre téléphone…', { icon: '⏳', duration: 6000 });

      let attempts = 0;
      const maxAttempts = 90; // 3 minutes
      const poll = setInterval(async () => {
        attempts++;
        try {
          const check = await checkPayment(payment.txRef);
          const { payment: pay, ticket: t } = check.data;
          if (pay?.payment_status === 'success' && t) {
            clearInterval(poll);
            setWaitingPayment(false);
            toast.success('✅ Paiement confirmé !');
            navigate(`/ticket/${t.ticket_uuid}`);
          }
        } catch {}
        if (attempts >= maxAttempts) {
          clearInterval(poll);
          setWaitingPayment(false);
          toast.error('Délai expiré. Vérifiez votre WhatsApp ou contactez-nous.', { duration: 8000 });
        }
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    if (waitingPayment) return; // Empêcher fermeture pendant paiement
    setShowForm(false);
    setSelectedCat(null);
    setPaymentInfo(null);
  };

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Loader2 size={40} className="animate-spin" style={{ color: 'var(--brand)' }} />
    </div>
  );
  if (!event) return (
    <div className="min-h-screen pt-24 flex items-center justify-center text-muted" style={{ backgroundColor: 'var(--bg-base)' }}>
      Événement introuvable.
    </div>
  );

  const date = new Date(event.date);
  const validCategories = (event.categories || []).filter(c => c && c.id);

  return (
    <div className="min-h-screen pt-20 pb-20 transition-colors duration-200" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* Banner hero */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        {event.banner_url ? (
          <img src={`${API_URL}${event.banner_url}`} alt={event.title}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1C3050 0%, #0D1B2E 100%)' }}>
            <span className="font-display text-9xl tracking-widest text-white/5">
              {event.title.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, var(--bg-base) 0%, rgba(5,12,24,0.4) 50%, transparent 100%)' }} />
        <div className="absolute bottom-6 left-6 right-6">
          <span className="text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider mb-3 inline-block" style={{ backgroundColor: 'var(--brand)' }}>
            {event.organizer}
          </span>
          <h1 className="font-display text-4xl md:text-6xl tracking-wide text-white leading-tight">
            {event.title}
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Meta card */}
          <div className="card p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Calendar, label: 'Date', value: date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) },
              { icon: Clock,    label: 'Heure', value: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) },
              { icon: MapPin,   label: 'Lieu', value: event.location || '—' },
              { icon: Users,    label: 'Places restantes', value: `${event.available_tickets}` },
            ].map((d, i) => (
              <div key={i}>
                <div className="flex items-center gap-1.5 text-secondary text-xs mb-1">
                  <d.icon size={11} /> {d.label}
                </div>
                <p className="text-primary font-semibold text-sm leading-snug">{d.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {(event.long_description || event.description) && (
            <div className="card p-6">
              <h2 className="font-bold text-primary text-lg mb-3">À propos</h2>
              <p className="text-secondary leading-relaxed text-sm">
                {event.long_description || event.description}
              </p>
            </div>
          )}
        </div>

        {/* Ticket selector */}
        <div className="space-y-4">
          <h2 className="font-display text-2xl tracking-wide text-primary">CHOISIR UN TICKET</h2>

          {validCategories.length === 0 ? (
            <div className="card p-6 text-center text-muted text-sm">
              Aucune catégorie disponible.
            </div>
          ) : (
            validCategories.map(cat => {
              const isFull = cat.available_quantity <= 0;
              const isFree = parseFloat(cat.price) === 0;
              return (
                <button key={cat.id}
                  onClick={() => { if (!isFull) { setSelectedCat(cat); setShowForm(true); } }}
                  disabled={isFull}
                  className={`w-full card card-hover p-4 text-left transition-all ${
                    !isFull ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'
                  }`}
                  style={{ border: selectedCat?.id === cat.id ? `2px solid ${cat.color}` : '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <span className="font-bold text-primary text-sm">{cat.name}</span>
                    <span className="font-display text-lg leading-none" style={{ color: cat.color || 'var(--accent)' }}>
                      {isFree ? 'GRATUIT' : `${parseInt(cat.price).toLocaleString()} F`}
                    </span>
                  </div>
                  {cat.description && (
                    <p className="text-secondary text-xs mb-2 leading-relaxed">{cat.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{isFull ? '⛔ Complet' : `${cat.available_quantity} place${cat.available_quantity > 1 ? 's' : ''} restante${cat.available_quantity > 1 ? 's' : ''}`}</span>
                    {!isFull && <ChevronRight size={14} />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── CHECKOUT MODAL ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && selectedCat && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              className="card w-full max-w-md p-6 space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary text-lg">Réserver — {selectedCat.name}</h3>
                {!waitingPayment && (
                  <button onClick={closeModal} className="text-muted hover:text-primary transition-colors">
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Summary */}
              <div className="rounded-xl p-3 flex justify-between items-center border"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-secondary text-xs">{event.title}</p>
                  <p className="text-primary font-semibold text-sm mt-0.5">{selectedCat.name}</p>
                </div>
                <span className="font-display text-xl" style={{ color: selectedCat.color || 'var(--accent)' }}>
                  {parseFloat(selectedCat.price) === 0 ? 'GRATUIT' : `${parseInt(selectedCat.price).toLocaleString()} FCFA`}
                </span>
              </div>

              {waitingPayment ? (
                /* Waiting for payment */
                <div className="py-6 flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(59,130,246,0.15)', border: '2px solid rgba(59,130,246,0.3)' }}>
                      <Phone size={28} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Loader2 size={12} className="animate-spin text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-primary font-bold mb-1">En attente de paiement</p>
                    <p className="text-secondary text-sm">Vérifiez votre téléphone</p>
                    <p className="text-muted text-xs mt-1 font-mono">{form.holder_phone}</p>
                  </div>
                  {paymentInfo?.mode === 'simulation' && (
                    <div className="rounded-lg p-3 text-center w-full"
                      style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                      <p className="text-yellow-500 dark:text-yellow-400 text-xs font-bold">🔧 MODE DEV — Activation automatique dans 4 secondes</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Form */
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-secondary font-bold uppercase tracking-wider mb-1.5 block">Nom complet *</label>
                    <input className="input-field" placeholder="Jean-Paul Mbemba"
                      value={form.holder_name} onChange={e => setForm(f => ({ ...f, holder_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-secondary font-bold uppercase tracking-wider mb-1.5 block">Téléphone *</label>
                    <input className="input-field" placeholder="+242 06 XXX XX XX" type="tel"
                      value={form.holder_phone} onChange={e => setForm(f => ({ ...f, holder_phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-secondary font-bold uppercase tracking-wider mb-1.5 block">Email (optionnel)</label>
                    <input className="input-field" placeholder="email@exemple.com" type="email"
                      value={form.holder_email} onChange={e => setForm(f => ({ ...f, holder_email: e.target.value }))} />
                  </div>

                  {parseFloat(selectedCat.price) > 0 && (
                    <div>
                      <label className="text-xs text-secondary font-bold uppercase tracking-wider mb-1.5 block">
                        Méthode de paiement
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'mtn',    label: '🟡 MTN MoMo' },
                          { id: 'airtel', label: '🔴 Airtel Money' },
                        ].map(m => (
                          <button key={m.id} type="button"
                            onClick={() => setForm(f => ({ ...f, payment_method: m.id }))}
                            className="py-2.5 rounded-xl text-sm font-bold transition-all"
                            style={{
                              border: form.payment_method === m.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                              background: form.payment_method === m.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                              color: form.payment_method === m.id ? 'var(--text-primary)' : 'var(--text-muted)',
                            }}>
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!waitingPayment && (
                <button onClick={handleReserve} disabled={submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2">
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting
                    ? 'Traitement...'
                    : parseFloat(selectedCat.price) === 0
                    ? '🎟️ Réserver gratuitement'
                    : `💳 Payer ${parseInt(selectedCat.price).toLocaleString()} FCFA`}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}