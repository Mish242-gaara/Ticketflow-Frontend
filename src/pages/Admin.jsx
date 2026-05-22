import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  Ticket, Users, DollarSign, ScanLine, Plus, Download,
  Pencil, Trash2, Eye, CheckCircle, Clock, Check, X, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getAdminStats, getAttendees } from '../services/api';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeEvent, setActiveEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [pendingTickets, setPendingTickets] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHardDeleteModal, setShowHardDeleteModal] = useState(false);
  const [selectedTxRef, setSelectedTxRef] = useState(null);
  const [attendeeToDelete, setAttendeeToDelete] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();

  // ✅ Fonction asynchrone pour charger les données
  const loadData = async () => {
    try {
      const [statsRes, eventsRes, pendingRes] = await Promise.all([
        getAdminStats(),
        api.get('/admin/events'),
        api.get('/admin/tickets/pending').catch(() => ({ data: { tickets: [] } })),
      ]);
      setStats(statsRes.data.stats);
      setEvents(eventsRes.data.events || []);
      setPendingTickets(pendingRes.data.tickets || []);
    } catch (error) {
      console.error("Erreur chargement données:", error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ✅ Fonction pour ouvrir la modale de validation
  const openConfirmModal = (txRef) => {
    if (!txRef) {
      toast.error('Référence de paiement manquante.');
      return;
    }
    setSelectedTxRef(txRef);
    setShowConfirmModal(true);
  };

  // ✅ Fonction asynchrone pour valider un paiement
  const handleValidate = async () => {
    if (!selectedTxRef) {
      toast.error("Référence de paiement manquante. Impossible de valider.");
      return;
    }
    setIsValidating(true);
    try {
      await api.post(`/admin/tickets/validate/${selectedTxRef}`, { action: 'approve' });
      toast.success("✅ Paiement validé avec succès !");
      await loadData();
      setShowConfirmModal(false);
      setSelectedTxRef(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de la validation");
    } finally {
      setIsValidating(false);
    }
  };

  // ✅ Fonction asynchrone pour charger les participants
  const loadAttendees = async (eventId) => {
    setActiveEvent(eventId);
    setActiveTab('attendees');
    try {
      const res = await getAttendees(eventId);
      setAttendees(res.data.attendees || []);
      setSearchTerm("");
      setFilterCategory("");
      setFilterStatus("");
      setFilterPayment("");
    } catch (error) {
      console.error("Erreur chargement participants:", error);
      toast.error('Erreur lors du chargement des participants');
    }
  };

  // ✅ Fonction pour ouvrir la modale de suppression définitive
  const openHardDeleteModal = (attendee) => {
    setAttendeeToDelete(attendee);
    setShowHardDeleteModal(true);
  };

  // ✅ Fonction asynchrone pour supprimer définitivement un participant
  const handleHardDeleteAttendee = async () => {
    if (!attendeeToDelete || !activeEvent) {
      toast.error("Aucun participant sélectionné");
      return;
    }

    try {
      const response = await api.delete(`/events/${activeEvent}/attendees/${attendeeToDelete.ticket_id}/hard`);
      if (response.data.success) {
        toast.success(response.data.message);
        setShowHardDeleteModal(false);
        setAttendeeToDelete(null);
        // Recharge les participants et les stats
        const res = await getAttendees(activeEvent);
        setAttendees(res.data.attendees || []);
        await loadData(); // Rafraîchit le dashboard
      } else {
        toast.error(response.data.error || "Erreur lors de la suppression");
      }
    } catch (err) {
      console.error("Erreur suppression participant:", err);
      toast.error(err.response?.data?.error || "Erreur réseau");
    }
  };

  // ✅ Fonction asynchrone pour supprimer un événement
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Supprimer "${title}" ? Cette action est irréversible.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/events/${id}`);
      toast.success('Événement supprimé');
      setEvents(evs => evs.filter(e => e.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ Fonction asynchrone pour annuler un participant (Soft Delete)
  const handleCancelAttendee = async (attendee) => {
    if (!window.confirm(`Annuler le participant "${attendee.holder_name}" ? Sa place sera libérée.`)) return;
    try {
      const res = await api.delete(`/events/${activeEvent}/attendees/${attendee.ticket_id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        const updatedAttendees = await getAttendees(activeEvent);
        setAttendees(updatedAttendees.data.attendees || []);
        await loadData(); // Rafraîchit le dashboard
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur");
    }
  };

  const exportCSV = () => {
    if (!attendees.length) return;
    const headers = 'Nom,Téléphone,Email,Catégorie,Statut,Paiement,Date réservation\n';
    const rows = attendees.map(a =>
      `"${a.holder_name}","${a.holder_phone || ''}","${a.holder_email || ''}","${a.category_name}","${a.status}","${a.payment_status || '—'}","${new Date(a.created_at).toLocaleString('fr-FR')}"`
    ).join('\n');
    const blob = new Blob(['\ufeff' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `participants-event-${activeEvent}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--brand)' }} />
    </div>
  );

  const statCards = [
    {
      label: 'Total tickets',
      value: stats?.total || 0,
      icon: Ticket,
      color: 'text-blue-500',
      bg: 'rgba(59, 130, 246, 0.1)'
    },
    {
      label: 'Actifs / Valides',
      value: stats?.active || 0,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bg: 'rgba(16, 185, 129, 0.1)'
    },
    {
      label: 'Scannés',
      value: stats?.scanned || 0,
      icon: ScanLine,
      color: 'text-amber-500',
      bg: 'rgba(245, 158, 11, 0.1)'
    },
    {
      label: 'Revenus',
      value: `${(stats?.revenue || 0).toLocaleString()} FCFA`,
      icon: DollarSign,
      color: 'text-rose-500',
      bg: 'rgba(244, 63, 94, 0.1)'
    },
  ];

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'events', label: `Événements (${events.length})` },
    { id: 'attendees', label: 'Participants' },
    { id: 'pending', label: `Validations (${pendingTickets.length})` },
  ];

  const baseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';

  const getSelectedTicket = () => {
    return pendingTickets.find(t => t.tx_ref === selectedTxRef) || null;
  };

  return (
    <div className="min-h-screen pt-20 pb-20 px-4 transition-colors duration-200" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 mb-6 gap-4">
          <div>
            <h1 className="font-display text-4xl md:text-5xl tracking-wide" style={{ color: 'var(--text-primary)' }}>ADMIN</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Tableau de bord — TicketFlow</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link to="/scanner" className="btn-secondary flex items-center justify-center gap-2 py-2 px-3 sm:px-4 text-xs sm:text-sm flex-1 sm:flex-none">
              <ScanLine size={14} /> Scanner QR
            </Link>
            <Link to="/admin/users" className="btn-secondary flex items-center justify-center gap-2 py-2 px-3 sm:px-4 text-xs sm:text-sm flex-1 sm:flex-none">
              <Users size={14} /> Utilisateurs
            </Link>
            <Link to="/admin/create-event" className="btn-primary flex items-center justify-center gap-2 py-2 px-3 sm:px-4 text-xs sm:text-sm w-full sm:w-auto">
              <Plus size={14} /> Nouvel événement
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto pb-2 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
          <div className="flex gap-1 rounded-xl p-1 w-max sm:w-fit transition-colors"
               style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === t.id ? 'btn-primary text-white' : 'text-[var(--text-secondary)] hover:text-[var(--brand)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card p-5"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
                    <s.icon size={18} className={s.color} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                    {s.label}
                  </p>
                  <p className="font-display text-xl sm:text-2xl tracking-wide" style={{ color: 'var(--text-primary)' }}>
                    {s.value}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {stats?.by_category?.length > 0 && (
                <div className="card p-5 lg:col-span-2 overflow-hidden">
                  <h3 className="font-bold mb-4 text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                    Tickets par catégorie
                  </h3>
                  <div className="w-full overflow-x-auto">
                    <div className="min-w-[400px] h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.by_category} barSize={32}>
                          <XAxis
                            dataKey="name"
                            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border)',
                              borderRadius: 8,
                              color: 'var(--text-primary)'
                            }}
                            labelStyle={{ color: 'var(--text-primary)' }}
                          />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Tickets">
                            {stats.by_category.map((entry, i) => (
                              <Cell key={i} fill={entry.color || 'var(--brand)'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              <div className="card p-5">
                <h3 className="font-bold mb-4 text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                  Dernières réservations
                </h3>
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {stats?.recent_tickets?.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 py-1 border-b border-[var(--border)] last:border-0"
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: t.color || 'var(--brand)' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {t.holder_name}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                          {t.category}
                        </p>
                      </div>
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        t.status === 'active'
                          ? 'text-emerald-500 bg-emerald-500/10'
                          : t.status === 'used'
                          ? 'text-blue-500 bg-blue-500/10'
                          : 'text-amber-500 bg-amber-500/10'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                  {!stats?.recent_tickets?.length && (
                    <p className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>
                      Aucune réservation
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EVENTS CRUD */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
                <Ticket size={40} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--brand)' }} />
                <p className="text-sm">
                  Aucun événement.{' '}
                  <Link
                    to="/admin/create-event"
                    className="font-bold underline"
                    style={{ color: 'var(--brand)' }}
                  >
                    Créez-en un
                  </Link>.
                </p>
              </div>
            ) : (
              events.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card overflow-hidden flex flex-col sm:flex-row gap-0"
                >
                  <div
                    className="w-full sm:w-28 md:w-36 h-36 sm:h-auto flex-shrink-0 relative overflow-hidden"
                    style={{ background: 'rgba(0, 0, 0, 0.02)' }}
                  >
                    {ev.banner_url ? (
                      <img
                        src={`${baseUrl}${ev.banner_url}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <span className="font-display text-2xl" style={{ color: 'var(--brand)' }}>
                          {ev.title.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md ${
                      ev.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {ev.status === 'active' ? 'ACTIF' : 'ANNULÉ'}
                    </div>
                  </div>

                  <div className="flex-1 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="font-bold text-base md:text-lg truncate" style={{ color: 'var(--text-primary)' }}>
                        {ev.title}
                      </h3>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        📅 {new Date(ev.date).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' })}
                        {ev.location && ` · 📍 ${ev.location}`}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>
                          🎟 <b style={{ color: 'var(--text-primary)' }}>{ev.tickets_sold || 0}</b>/{ev.total_tickets}
                        </span>
                        <span style={{ color: 'var(--success)' }}>
                          ✅ {ev.tickets_scanned || 0} scannés
                        </span>
                        <span className="font-mono" style={{ color: 'var(--brand)' }}>
                          {parseInt(ev.revenue || 0).toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap md:justify-end w-full md:w-auto pt-2 md:pt-0 border-t border-[var(--border)] md:border-t-0">
                      <button
                        onClick={() => loadAttendees(ev.id)}
                        className="flex items-center justify-center gap-1.5 flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-bold transition-all"
                        style={{
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <Eye size={13} /> <span className="md:hidden lg:inline">Participants</span>
                      </button>
                      <button
                        onClick={() => navigate(`/admin/edit-event/${ev.id}`)}
                        className="flex items-center justify-center gap-1.5 flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-bold transition-all"
                        style={{
                          color: 'var(--brand)',
                          background: 'rgba(229, 9, 20, 0.1)',
                          border: '1px solid rgba(229, 9, 20, 0.2)'
                        }}
                      >
                        <Pencil size={13} /> Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(ev.id, ev.title)}
                        disabled={deletingId === ev.id}
                        className="flex items-center justify-center gap-1.5 flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        style={{
                          color: 'var(--brand)',
                          background: 'rgba(229, 9, 20, 0.1)',
                          border: '1px solid rgba(229, 9, 20, 0.2)'
                        }}
                      >
                        <Trash2 size={13} /> {deletingId === ev.id ? <Loader2 size={12} className="animate-spin" /> : 'Supprimer'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* ATTENDEES */}
        {activeTab === 'attendees' && (
          <div className="card p-4 sm:p-5">
            <div className="flex flex-col space-y-4 mb-5">
              {/* Barre de recherche et filtres */}
              <div className="flex flex-col md:flex-row md:items-end gap-3 mb-2">
                <input
                  type="text"
                  placeholder="Rechercher par nom, téléphone, email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="input w-full md:w-64"
                  style={{ border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                />
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="input"
                  style={{ border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                >
                  <option value="">Toutes catégories</option>
                  {[...new Set(attendees.map(a => a.category_name))].filter(Boolean).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="input"
                  style={{ border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                >
                  <option value="">Tous statuts</option>
                  <option value="active">Actif</option>
                  <option value="used">Utilisé</option>
                  <option value="pending">En attente</option>
                </select>
                <select
                  value={filterPayment}
                  onChange={e => setFilterPayment(e.target.value)}
                  className="input"
                  style={{ border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                >
                  <option value="">Tous paiements</option>
                  <option value="success">Payé</option>
                  <option value="pending">En attente</option>
                  <option value="">Non renseigné</option>
                </select>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Liste des participants</h3>
                  {attendees.length > 0 && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {attendees.length} participant(s) enregistré(s)
                    </p>
                  )}
                </div>
                {attendees.length > 0 && (
                  <button
                    onClick={exportCSV}
                    className="flex items-center gap-1.5 text-xs font-bold transition-all px-3 py-1.5 rounded-lg"
                    style={{
                      color: 'var(--brand)',
                      background: 'rgba(229, 9, 20, 0.1)',
                      border: '1px solid rgba(229, 9, 20, 0.2)'
                    }}
                  >
                    <Download size={12} /> <span className="hidden sm:inline">Exporter</span> CSV
                  </button>
                )}
              </div>

              <div className="flex gap-2 flex-wrap max-h-24 overflow-y-auto pr-1 pb-1">
                {events.map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => loadAttendees(ev.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all truncate max-w-[160px] sm:max-w-[200px] ${
                      activeEvent === ev.id ? 'btn-primary text-white' : 'text-[var(--text-secondary)] hover:text-[var(--brand)]'
                    }`}
                    style={{ background: activeEvent === ev.id ? '' : 'var(--bg-elevated)' }}
                  >
                    {ev.title}
                  </button>
                ))}
              </div>
            </div>

            {!activeEvent ? (
              <p className="text-sm py-10 text-center" style={{ color: 'var(--text-muted)' }}>
                Sélectionnez un événement pour afficher sa liste de présence.
              </p>
            ) : attendees.length === 0 ? (
              <p className="text-sm py-10 text-center" style={{ color: 'var(--text-muted)' }}>
                Aucun participant inscrit pour cet événement.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <table className="w-full text-sm min-w-[750px]">
                  <thead>
                    <tr
                      style={{ borderBottom: '1px solid var(--border)' }}
                      className="text-xs uppercase tracking-wider"
                    >
                      <th className="text-left pb-3 pr-4" style={{ color: 'var(--text-muted)' }}>Nom</th>
                      <th className="text-left pb-3 pr-4" style={{ color: 'var(--text-muted)' }}>Téléphone</th>
                      <th className="text-left pb-3 pr-4" style={{ color: 'var(--text-muted)' }}>Catégorie</th>
                      <th className="text-left pb-3 pr-4" style={{ color: 'var(--text-muted)' }}>Ticket</th>
                      <th className="text-left pb-3 pr-4" style={{ color: 'var(--text-muted)' }}>Paiement</th>
                      <th className="text-left pb-3" style={{ color: 'var(--text-muted)' }}>Date</th>
                      <th className="text-left pb-3" style={{ color: 'var(--text-muted)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {attendees
                      .filter(a =>
                        (!searchTerm ||
                          a.holder_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.holder_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.holder_email?.toLowerCase().includes(searchTerm.toLowerCase())
                        ) &&
                        (!filterCategory || a.category_name === filterCategory) &&
                        (!filterStatus || a.status === filterStatus) &&
                        (!filterPayment || a.payment_status === filterPayment)
                      )
                      .map((a, i) => (
                        <tr key={a.ticket_id || i} className="hover:bg-[var(--bg-elevated)] transition-colors">
                          <td className="py-3 pr-4 font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
                            {a.holder_name}
                          </td>
                          <td className="py-3 pr-4 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                            {a.holder_phone || '—'}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                              style={{
                                background: (a.color || '#E50914') + '20',
                                color: a.color || '#E50914'
                              }}
                            >
                              {a.category_name}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`text-[11px] font-bold flex items-center gap-1 ${
                              a.status === 'active'
                                ? 'text-emerald-500'
                                : a.status === 'used'
                                ? 'text-blue-500'
                                : 'text-amber-500'
                            }`}>
                              {a.status === 'active' ? (
                                <CheckCircle size={11} />
                              ) : a.status === 'used' ? (
                                <ScanLine size={11} />
                              ) : (
                                <Clock size={11} />
                              )}
                              {a.status}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`text-[11px] font-bold uppercase ${
                              a.payment_status === 'success'
                                ? 'text-emerald-500'
                                : a.payment_status === 'pending'
                                ? 'text-amber-500'
                                : 'text-[var(--text-muted)]'
                            }`}>
                              {a.payment_status || '—'}
                            </span>
                          </td>
                          <td className="py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                            {new Date(a.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          {/* ✅ Boutons d'action */}
                          <td className="py-3 text-xs">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCancelAttendee(a)} // ✅ Utilise la nouvelle fonction asynchrone
                                className="text-xs text-amber-600 hover:underline"
                                title="Annuler le participant (libère la place)"
                              >
                                Annuler
                              </button>
                              <button
                                onClick={() => a.status !== 'used' ? openHardDeleteModal(a) : toast.error("Impossible de supprimer un ticket déjà scanné.")}
                                className={`text-xs font-bold ${a.status === 'used' ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:underline'}`}
                                title={a.status === 'used' ? "Ticket déjà scanné" : "Supprimer définitivement"}
                                disabled={a.status === 'used'}
                              >
                                 Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* VALIDATIONS */}
        {activeTab === 'pending' && (
          <div className="card p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                Paiements en attente de validation
              </h3>
              {pendingTickets.length > 0 && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {pendingTickets.length} paiement(s) en attente
                </span>
              )}
            </div>

            {pendingTickets.length === 0 ? (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                <CheckCircle size={40} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--brand)' }} />
                <p className="text-sm">Aucun paiement en attente de validation.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTickets.map((ticket, index) => (
                  <motion.div
                    key={ticket.tx_ref || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)] gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(229, 9, 20, 0.1)' }}
                        >
                          <Ticket size={18} style={{ color: 'var(--brand)' }} />
                        </div>
                        <div>
                          <p className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
                            {ticket.holder_name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {ticket.event_title} · {ticket.category_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span>💰 {parseInt(ticket.amount || 0).toLocaleString()} FCFA</span>
                        <span>📱 {ticket.holder_phone}</span>
                        <span className="font-mono">🆔 {ticket.tx_ref}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openConfirmModal(ticket.tx_ref)}
                        className="btn-primary flex items-center gap-2 py-2 px-4 text-xs sm:text-sm"
                      >
                        <Check size={14} /> Valider
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODALE DE CONFIRMATION POUR LA VALIDATION DES PAIEMENTS */}
        <AnimatePresence>
          {showConfirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowConfirmModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                      Confirmer la validation
                    </h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      Êtes-vous sûr de vouloir valider ce paiement ?
                    </p>
                  </div>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {getSelectedTicket() && (
                  <div className="bg-[var(--bg-elevated)] rounded-lg p-4 mb-6 border border-[var(--border)]">
                    <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>
                      Détails du paiement
                    </p>
                    <div className="space-y-1 text-sm">
                      <p style={{ color: 'var(--text-primary)' }}>
                        <strong>Participant :</strong> {getSelectedTicket().holder_name}
                      </p>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        <strong>Événement :</strong> {getSelectedTicket().event_title}
                      </p>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        <strong>Montant :</strong> {parseInt(getSelectedTicket().amount || 0).toLocaleString()} FCFA
                      </p>
                      <p className="font-mono" style={{ color: 'var(--brand)' }}>
                        <strong>Référence :</strong> {selectedTxRef}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                    style={{
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleValidate}
                    disabled={isValidating}
                    className="btn-primary px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 disabled:opacity-70"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Validation en cours...
                      </>
                    ) : (
                      <>
                        <Check size={14} /> Confirmer
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODALE POUR LA SUPPRESSION DÉFINITIVE */}
        <AnimatePresence>
          {showHardDeleteModal && attendeeToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowHardDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-red-500">
                      ⚠️ Suppression définitive
                    </h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      Cette action est <strong>irréversible</strong>. Le participant et son ticket seront supprimés définitivement de la base de données.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowHardDeleteModal(false)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="bg-[var(--bg-elevated)] rounded-lg p-4 mb-6 border border-[var(--border)]">
                  <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>
                    Détails du participant
                  </p>
                  <div className="space-y-1 text-sm">
                    <p style={{ color: 'var(--text-primary)' }}>
                      <strong>Nom :</strong> {attendeeToDelete.holder_name}
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      <strong>Téléphone :</strong> {attendeeToDelete.holder_phone || '—'}
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      <strong>Email :</strong> {attendeeToDelete.holder_email || '—'}
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      <strong>Catégorie :</strong> {attendeeToDelete.category_name}
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      <strong>Statut :</strong> {attendeeToDelete.status}
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      <strong>Paiement :</strong> {attendeeToDelete.payment_status || '—'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowHardDeleteModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                    style={{
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleHardDeleteAttendee}
                    className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Trash2 size={14} /> Supprimer définitivement
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}