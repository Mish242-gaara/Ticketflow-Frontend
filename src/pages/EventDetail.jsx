import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, Users, ChevronRight, X, Loader2, Phone, CheckCircle2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEvent, reserveTicket } from '../services/api';

const API_URL = 'http://localhost:5000';

// ⚠️ MODIFIE CES NUMÉROS AVEC TES VRAIS NUMÉROS DE RÉCEPTION MOMO / AIRTEL / WHATSAPP
const MOMO_NUMBER_MTN = "+242 06 414 91 49";
const MOMO_NUMBER_AIRTEL = "+242 05 509 58 63";
const WHATSAPP_ADMIN_PHONE = "242064149149"; // Format international sans le "+" pour l'URL WhatsApp

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
  const [momoRef, setMomoRef] = useState(''); // 🆕 Stocke la référence saisie par l'utilisateur
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

      // Option 3 : Paiement requis — basculer sur l'écran d'instructions manuelles
      setPaymentInfo(payment || ticket); 
      setWaitingPayment(true);
      toast.success('📱 Réservation enregistrée ! Suivez les instructions pour payer.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  // 🆕 Génère le message et redirige l'utilisateur vers WhatsApp pour t'avertir
  const handleSendWhatsAppNotification = () => {
    const txRef = paymentInfo?.txRef || 'Non spécifiée';
    const price = parseInt(selectedCat.price).toLocaleString();
    const networkName = form.payment_method === 'mtn' ? 'MTN MoMo' : 'Airtel Money';

    const message = `Bonjour, je viens de réserver un ticket pour l'événement *${event.title}*.\n\n` +
                    `👤 *Nom :* ${form.holder_name}\n` +
                    `📞 *Téléphone :* ${form.holder_phone}\n` +
                    `🎟️ *Catégorie :* ${selectedCat.name} (${price} FCFA)\n` +
                    `🟡 *Mode :* ${networkName}\n` +
                    `🆔 *Référence Système :* ${txRef}\n` +
                    `🧾 *Référence Transaction MoMo :* ${momoRef.trim() || 'Non fournie'}\n\n` +
                    `Merci de valider mon ticket !`;

    const whatsappUrl = `https://wa.me/${WHATSAPP_ADMIN_PHONE}?text=${encodeURIComponent(message)}`;
    
    // Ouvrir WhatsApp dans un nouvel onglet
    window.open(whatsappUrl, '_blank');
    toast.success('💬 Notification WhatsApp ouverte !');
    
    // Fermer la modale et rediriger l'utilisateur vers son espace de suivi
    setShowForm(false);
    setSelectedCat(null);
    setWaitingPayment(false);
    setMomoRef('');
  };

  const closeModal = () => {
    setShowForm(false);
    setSelectedCat(null);
    setPaymentInfo(null);
    setWaitingPayment(false);
    setMomoRef('');
  };

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <Loader2 size={40} className="animate-spin text-brand-500" />
    </div>
  );
  if (!event) return (
    <div className="min-h-screen pt-24 flex items-center justify-center text-white/50">
      Événement introuvable.
    </div>
  );

  const date = new Date(event.date);
  const validCategories = (event.categories || []).filter(c => c && c.id);

  return (
    <div className="min-h-screen pt-20 pb-20">
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
          style={{ background: 'linear-gradient(to top, #0D1B2E 0%, rgba(13,27,46,0.5) 50%, transparent 100%)' }} />
        <div className="absolute bottom-6 left-6 right-6">
          <span className="bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider mb-3 inline-block">
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
                <div className="flex items-center gap-1.5 text-white/40 text-xs mb-1">
                  <d.icon size={11} /> {d.label}
                </div>
                <p className="text-white font-semibold text-sm leading-snug">{d.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {(event.long_description || event.description) && (
            <div className="card p-6">
              <h2 className="font-bold text-white text-lg mb-3">À propos</h2>
              <p className="text-white/60 leading-relaxed text-sm">
                {event.long_description || event.description}
              </p>
            </div>
          )}
        </div>

        {/* Ticket selector */}
        <div className="space-y-4">
          <h2 className="font-display text-2xl tracking-wide text-white">CHOISIR UN TICKET</h2>

          {validCategories.length === 0 ? (
            <div className="card p-6 text-center text-white/40 text-sm">
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
                  className={`w-full card p-4 text-left transition-all ${
                    !isFull ? 'hover:border-white/20 cursor-pointer' : 'opacity-40 cursor-not-allowed'
                  }`}
                  style={{ border: selectedCat?.id === cat.id ? `2px solid ${cat.color}` : '2px solid transparent' }}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <span className="font-bold text-white text-sm">{cat.name}</span>
                    <span className="font-display text-lg leading-none" style={{ color: cat.color }}>
                      {isFree ? 'GRATUIT' : `${parseInt(cat.price).toLocaleString()} F`}
                    </span>
                  </div>
                  {cat.description && (
                    <p className="text-white/40 text-xs mb-2 leading-relaxed">{cat.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-white/30">
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
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              className="card w-full max-w-md p-6 space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-lg">
                  {waitingPayment ? 'Instructions de Paiement' : `Réserver — ${selectedCat.name}`}
                </h3>
                <button onClick={closeModal} className="text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Summary */}
              <div className="rounded-xl p-3 flex justify-between items-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <p className="text-white/60 text-xs">{event.title}</p>
                  <p className="text-white font-semibold text-sm mt-0.5">{selectedCat.name}</p>
                </div>
                <span className="font-display text-xl" style={{ color: selectedCat.color }}>
                  {parseFloat(selectedCat.price) === 0 ? 'GRATUIT' : `${parseInt(selectedCat.price).toLocaleString()} FCFA`}
                </span>
              </div>

              {waitingPayment ? (
                /* 🆕 OPTION 3 : INTERFACE D'INSTRUCTIONS ET VALIDATION MANUELLE */
                <div className="space-y-4 py-2">
                  <div className="rounded-xl p-4 space-y-3 bg-neutral-900 border border-neutral-800 text-sm">
                    <p className="text-white/90 font-medium">
                      Pour activer votre ticket, effectuez le transfert manuel suivant :
                    </p>
                    <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                      <p className="text-white/50 text-xs">Montant exact à envoyer :</p>
                      <p className="text-xl font-bold text-brand-400">{parseInt(selectedCat.price).toLocaleString()} FCFA</p>
                      <p className="text-white/50 text-xs pt-1">Vers le numéro de l'organisateur :</p>
                      <p className="text-base font-mono font-bold text-white">
                        {form.payment_method === 'mtn' ? `🟡 MTN : ${MOMO_NUMBER_MTN}` : `🔴 Airtel : ${MOMO_NUMBER_AIRTEL}`}
                      </p>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">
                      💡 Une fois le transfert Mobile Money complété, copiez la référence de la transaction reçue par SMS ci-dessous, puis cliquez sur le bouton vert pour m'envoyer la demande de validation.
                    </p>
                  </div>

                  {/* Saisie Référence MoMo */}
                  <div>
                    <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">
                      Id / Référence de la transaction MoMo (Optionnel)
                    </label>
                    <input 
                      className="input-field font-mono" 
                      placeholder="Ex: MP260519.1102.A00123"
                      value={momoRef} 
                      onChange={e => setMomoRef(e.target.value)} 
                    />
                  </div>

                  {/* Bouton de soumission WhatsApp */}
                  <button 
                    onClick={handleSendWhatsAppNotification}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                  >
                    <MessageSquare size={16} />
                    J'ai payé — Envoyer sur WhatsApp
                  </button>
                </div>
              ) : (
                /* Formulaire de saisie classique (Étape 1) */
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">Nom complet *</label>
                    <input className="input-field" placeholder="Jean-Paul Mbemba"
                      value={form.holder_name} onChange={e => setForm(f => ({ ...f, holder_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">Téléphone *</label>
                    <input className="input-field" placeholder="+242 06 XXX XX XX" type="tel"
                      value={form.holder_phone} onChange={e => setForm(f => ({ ...f, holder_phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">Email (optionnel)</label>
                    <input className="input-field" placeholder="email@exemple.com" type="email"
                      value={form.holder_email} onChange={e => setForm(f => ({ ...f, holder_email: e.target.value }))} />
                  </div>

                  {parseFloat(selectedCat.price) > 0 && (
                    <div>
                      <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">
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
                              border: form.payment_method === m.id ? '2px solid #3B82F6' : '2px solid rgba(255,255,255,0.08)',
                              background: form.payment_method === m.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                              color: form.payment_method === m.id ? '#fff' : 'rgba(255,255,255,0.4)',
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
                    : `💳 Réserver et voir les instructions`}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}