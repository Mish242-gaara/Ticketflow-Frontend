import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Mail, Phone, MessageSquare, Send, X, Trash2, Clock, Ban, History,
  Loader2, Search, CheckSquare, Square, ArrowLeft, ExternalLink, MoreVertical, Pencil, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function AdminUsers() {
  // États existants
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [channel, setChannel] = useState('whatsapp');
  const [announcement, setAnn] = useState({ title: '', message: '' });
  const [waLinks, setWaLinks] = useState([]);
  const [emailList, setEmailList] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [history, setHistory] = useState([]);

  // ✅ Nouveaux états pour les modales de suppression/blocage
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeleteHistoryModal, setShowDeleteHistoryModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToBlock, setUserToBlock] = useState(null);
  const [blockDuration, setBlockDuration] = useState('7'); // ✅ Durée de blocage par défaut (7 jours)
  const [actionLoading, setActionLoading] = useState(false);

  // ✅ Récupère les utilisateurs et l'historique
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersRes, announcementsRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/announcements'),
        ]);

        // CORRECTION : Accéder à la bonne clé de réponse du backend
        const userData = usersRes.data.users || [];
        const historyData = announcementsRes.data.announcements || [];

        console.log("Utilisateurs reçus:", userData);
        console.log("Annonces reçues:", historyData);

        setUsers(userData);
        setFiltered(userData);
        setHistory(historyData);
      } catch (err) {
        console.error("Erreur de récupération:", err);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ Filtre les utilisateurs
  useEffect(() => {
    if (!search.trim()) { setFiltered(users); return; }
    const q = search.toLowerCase();
    setFiltered(users.filter(u =>
      u.fullname?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    ));
  }, [search, users]);

  // ✅ Gestion de la sélection
  const toggleUser = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = () => setSelected(new Set(filtered.map(u => u.id)));
  const clearAll = () => setSelected(new Set());
  const isAllSel = filtered.length > 0 && filtered.every(u => selected.has(u.id));

  // ✅ Envoyer une annonce
  const handleSend = async () => {
    if (!announcement.title.trim() || !announcement.message.trim())
      return toast.error('Titre et message requis');
    setSending(true);
    try {
      const res = await api.post('/admin/announcements', {
        title: announcement.title,
        message: announcement.message,
        channel,
        user_ids: selected.size > 0 ? [...selected] : [],
      });
      const { whatsappLinks, emailList: emails, count } = res.data;
      setWaLinks(whatsappLinks || []);
      setEmailList(emails || []);
      setShowModal(false);
      setShowResults(true);
      toast.success(`Annonce préparée pour ${count} utilisateur(s) !`);

      const h = await api.get('/admin/announcements');
      setHistory(h.data.announcements || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur envoi');
    } finally { setSending(false); }
  };

  // ✅ Ouvrir tous les liens WhatsApp
  const openAll = () => {
    waLinks.forEach((l, i) => setTimeout(() => window.open(l.url, `_wa_${i}`), i * 800));
  };

  // ✅ Supprimer un utilisateur
  const handleDeleteUser = async (userId) => {
    setActionLoading(true);
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('Utilisateur supprimé avec succès !');
      // ✅ Recharge les utilisateurs
      const res = await api.get('/admin/users');
      setUsers(res.data.users || []);
      setFiltered(res.data.users || []);
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ Bloquer/Débloquer un utilisateur
  const handleBlockUser = async (userId, durationDays) => {
    setActionLoading(true);
    try {
      const action = userToBlock.is_blocked ? 'unblock' : 'block';
      const res = await api.post(`/admin/users/${userId}/${action}`, {
        duration: durationDays
      });
      toast.success(`Utilisateur ${action === 'block' ? 'bloqué' : 'débloqué'} avec succès !`);
      // ✅ Recharge les utilisateurs
      const usersRes = await api.get('/admin/users');
      setUsers(usersRes.data.users || []);
      setFiltered(usersRes.data.users || []);
      setShowBlockModal(false);
      setUserToBlock(null);
    } catch (err) {
      toast.error(err.response?.data?.error || `Erreur lors du ${userToBlock.is_blocked ? 'débloquage' : 'blocage'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ Supprimer une annonce de l'historique
  const handleDeleteAnnouncement = async (announcementId) => {
    setActionLoading(true);
    try {
      await api.delete(`/admin/announcements/${announcementId}`);
      toast.success('Annonce supprimée de l\'historique avec succès !');
      // ✅ Recharge l'historique
      const res = await api.get('/admin/announcements');
      setHistory(res.data.announcements || []);
      setShowDeleteHistoryModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ Supprimer tout l'historique
  const handleDeleteAllHistory = async () => {
    setActionLoading(true);
    try {
      await api.delete('/admin/announcements');
      toast.success('Historique des annonces supprimé avec succès !');
      setHistory([]);
      setShowDeleteHistoryModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ Ouvrir la modale de suppression d'un utilisateur
  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // ✅ Ouvrir la modale de blocage/débloquage d'un utilisateur
  const openBlockModal = (user) => {
    setUserToBlock(user);
    setBlockDuration('7'); // ✅ Réinitialise la durée
    setShowBlockModal(true);
  };

  // ✅ Ouvrir la modale de suppression de l'historique
  const openDeleteHistoryModal = (announcement = null) => {
    setUserToDelete(announcement); // ✅ Réutilise userToDelete pour stocker l'annonce
    setShowDeleteHistoryModal(true);
  };

  // ✅ Calcul du nombre total d'utilisateurs non-admin
  const globalTargetCount = users.filter(u => u.role !== 'admin').length;
  const formattedEmailsText = emailList.map(e => `${e.name} <${e.email}>`).join('\n');
  const emailsClipboardText = emailList.map(e => `${e.name} <${e.email}>`).join(', ');

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
    </div>
  );

  return (
    <div className="min-h-screen pt-20 pb-20 px-4" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-6xl mx-auto mt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="transition-colors" style={{ color: 'var(--text-secondary)' }}>
              <ArrowLeft size={20} className="hover:text-[var(--text-primary)]" />
            </Link>
            <div>
              <h1 className="font-display text-4xl tracking-wide" style={{ color: 'var(--text-primary)' }}>UTILISATEURS</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{users.length} compte(s) inscrit(s)</p>
            </div>
          </div>
          <button type="button" onClick={() => { setShowModal(true); setAnn({ title: '', message: '' }); }}
            className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
            <Send size={14} /> Envoyer une annonce
          </button>
        </div>

        {/* Search + select toolbar */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input className="input-field pl-9 text-sm" placeholder="Rechercher par nom, email, téléphone…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button type="button" onClick={isAllSel ? clearAll : selectAll}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid var(--border)', color: 'var(--accent)' }}>
            {isAllSel ? <CheckSquare size={14} /> : <Square size={14} />}
            {isAllSel ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
          {selected.size > 0 && (
            <span className="flex items-center px-3 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--success)' }}>
              {selected.size} sélectionné(s)
            </span>
          )}
        </div>

        {/* Users table */}
        <div className="card overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  <th className="w-10 py-3 px-4 text-left"></th>
                  <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Utilisateur</th>
                  <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Email</th>
                  <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Téléphone</th>
                  <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tickets</th>
                  <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Statut</th>
                  <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Inscrit le</th>
                  <th className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const isSelected = selected.has(u.id);
                  return (
                    <motion.tr key={u.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="cursor-pointer transition-colors hover:bg-[var(--bg-elevated)]"
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                      }}>
                      <td className="py-3 px-4">
                        <div className={`w-4 h-4 rounded flex items-center justify-center transition-all ${isSelected ? 'bg-[var(--accent)]' : 'border'}`}
                             style={{ borderColor: isSelected ? 'var(--accent)' : 'var(--border-strong)' }}
                             onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleUser(u.id)}
                            className="w-4 h-4 accent-[var(--accent)]"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                                 style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent)' }}>
                              {u.fullname?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-xs leading-tight" style={{ color: 'var(--text-primary)' }}>{u.fullname}</p>
                            {u.role === 'admin' && <span className="text-xs font-bold" style={{ color: 'var(--brand)' }}>admin</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td className="py-3 px-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{u.phone || '—'}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-xs" style={{ color: 'var(--accent)' }}>{u.tickets_count || 0}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          u.is_blocked
                            ? 'bg-red-500/15 text-red-400'
                            : u.provider === 'google'
                              ? 'bg-blue-500/15 text-blue-400'
                              : 'bg-white/8 text-white/40'
                        }`}>
                          {u.is_blocked ? 'Bloqué' : u.provider === 'google' ? 'Google' : 'Email'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                      {/* ✅ Nouveaux boutons d'action */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); openBlockModal(u); }}
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]"
                            title={u.is_blocked ? 'Débloquer' : 'Bloquer'}
                            style={{ color: u.is_blocked ? 'var(--success)' : 'var(--warning)' }}
                          >
                            {u.is_blocked ? <CheckSquare size={14} /> : <Ban size={14} />}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openDeleteModal(u); }}
                            className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                            title="Supprimer"
                            style={{ color: 'var(--brand)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                <Users size={32} className="mx-auto mb-3 opacity-30" />
                <p>Aucun utilisateur trouvé.</p>
              </div>
            )}
          </div>
        </div>

        {/* Historique annonces */}
        {history.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl tracking-wide" style={{ color: 'var(--text-primary)' }}>HISTORIQUE DES ANNONCES</h2>
              <button
                onClick={() => openDeleteHistoryModal()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors hover:bg-red-500/10"
                style={{ color: 'var(--brand)' }}
                title="Supprimer tout l'historique"
              >
                <History size={14} /> Supprimer l'historique
              </button>
            </div>
            <div className="space-y-3">
              {history.map((a, i) => (
                <div key={i} className="card p-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        a.channel === 'whatsapp' ? 'bg-green-500/15 text-green-400' : 'bg-blue-500/15 text-blue-400'
                      }`}>
                        {a.channel === 'whatsapp' ? '📱 WhatsApp' : '📧 Email'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.sent_count} destinataire(s)</span>
                    </div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{a.message}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleDateString('fr-FR')}</span>
                    <button
                      onClick={() => openDeleteHistoryModal(a)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                      title="Supprimer cette annonce"
                      style={{ color: 'var(--brand)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL ANNONCE ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="card w-full max-w-lg p-6 space-y-4" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>📢 Nouvelle annonce</h3>
                <button type="button" onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }} className="hover:text-[var(--text-primary)]"><X size={20}/></button>
              </div>

              {/* Destinataires */}
              <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid var(--border)' }}>
                <p className="font-bold" style={{ color: 'var(--accent)' }}>
                  {selected.size > 0
                    ? `📋 ${selected.size} utilisateur(s) sélectionné(s)`
                    : `📋 Tous les utilisateurs (${globalTargetCount} personnes)`}
                </p>
              </div>

              {/* Canal */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>Canal d'envoi</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'whatsapp', label: '📱 WhatsApp', desc: 'Liens individuels' },
                    { id: 'email',    label: '📧 Email',    desc: 'Liste des emails' },
                  ].map(c => (
                    <button key={c.id} type="button" onClick={() => setChannel(c.id)}
                      className="py-3 px-3 rounded-xl text-left transition-all"
                      style={{
                        border: channel === c.id ? '2px solid var(--accent)' : '2px solid var(--border)',
                        background: channel === c.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                      }}>
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{c.label}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Titre de l'annonce</label>
                <input className="input-field" placeholder="Ex: Rappel — Événement à venir"
                  value={announcement.title} onChange={e => setAnn(a => ({...a, title: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Message</label>
                <textarea className="input-field resize-none" style={{ height: '120px' }}
                  placeholder="Écrivez votre message ici…"
                  value={announcement.message} onChange={e => setAnn(a => ({...a, message: e.target.value}))} />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Annuler</button>
                <button type="button" onClick={handleSend} disabled={sending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {sending ? 'Traitement...' : 'Préparer l\'envoi'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODALE DE SUPPRESSION D'UN UTILISATEUR ──────────────────────── */}
      <AnimatePresence>
        {showDeleteModal && userToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card w-full max-w-md p-6 space-y-4"
              style={{ background: 'var(--bg-card)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-red-500">⚠️ Supprimer un utilisateur</h3>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  style={{ color: 'var(--text-muted)' }}
                  className="hover:text-[var(--text-primary)]"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                <p className="text-sm text-red-500">
                  Vous êtes sur le point de supprimer définitivement l'utilisateur :
                </p>
                <div className="mt-3 flex items-center gap-3">
                  {userToDelete.avatar_url ? (
                    <img src={userToDelete.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                         style={{ background: 'rgba(229, 9, 20, 0.15)', color: 'var(--brand)' }}>
                      {userToDelete.fullname?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{userToDelete.fullname}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{userToDelete.email}</p>
                  </div>
                </div>
                <p className="text-xs mt-3 text-red-500">
                  ⚠️ Cette action est <strong>irréversible</strong>. Tous ses tickets et données associées seront également supprimés.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
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
                  type="button"
                  onClick={() => handleDeleteUser(userToDelete.id)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white disabled:opacity-70"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Supprimer définitivement
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODALE DE BLOCAGE/DÉBLOCAGE D'UN UTILISATEUR ──────────────── */}
      <AnimatePresence>
        {showBlockModal && userToBlock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowBlockModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card w-full max-w-md p-6 space-y-4"
              style={{ background: 'var(--bg-card)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-amber-500">
                  {userToBlock.is_blocked ? '✅ Débloquer un utilisateur' : '⚠️ Bloquer un utilisateur'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  style={{ color: 'var(--text-muted)' }}
                  className="hover:text-[var(--text-primary)]"
                >
                  <X size={20} />
                </button>
              </div>

              <div className={`rounded-lg p-4 border ${
                userToBlock.is_blocked
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                <p className="text-sm">
                  {userToBlock.is_blocked
                    ? 'Vous êtes sur le point de débloquer l\'utilisateur :'
                    : 'Vous êtes sur le point de bloquer l\'utilisateur :'
                  }
                </p>
                <div className="mt-3 flex items-center gap-3">
                  {userToBlock.avatar_url ? (
                    <img src={userToBlock.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                         style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
                      {userToBlock.fullname?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{userToBlock.fullname}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{userToBlock.email}</p>
                  </div>
                </div>
                {!userToBlock.is_blocked && (
                  <div className="mt-3">
                    <label className="text-xs font-bold mb-2 block" style={{ color: 'var(--text-muted)' }}>
                      Durée du blocage (en jours)
                    </label>
                    <select
                      value={blockDuration}
                      onChange={(e) => setBlockDuration(e.target.value)}
                      className="input-field"
                      style={{ width: '100%' }}
                    >
                      <option value="1">1 jour</option>
                      <option value="7">7 jours</option>
                      <option value="30">30 jours</option>
                      <option value="90">90 jours</option>
                      <option value="365">1 an</option>
                      <option value="permanent">Permanent</option>
                    </select>
                  </div>
                )}
                <p className="text-xs mt-3">
                  {userToBlock.is_blocked
                    ? 'L\'utilisateur pourra à nouveau se connecter.'
                    : 'L\'utilisateur ne pourra plus se connecter pendant la durée spécifiée.'
                  }
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
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
                  type="button"
                  onClick={() => handleBlockUser(userToBlock.id, blockDuration)}
                  disabled={actionLoading}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
                    userToBlock.is_blocked
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-amber-500 hover:bg-amber-600 text-white'
                  } disabled:opacity-70`}
                >
                  {actionLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : userToBlock.is_blocked ? (
                    <CheckSquare size={14} />
                  ) : (
                    <Ban size={14} />
                  )}
                  {userToBlock.is_blocked ? 'Débloquer' : 'Bloquer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODALE DE SUPPRESSION DE L'HISTORIQUE ──────────────────────── */}
      <AnimatePresence>
        {showDeleteHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowDeleteHistoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card w-full max-w-md p-6 space-y-4"
              style={{ background: 'var(--bg-card)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-red-500">
                  {userToDelete ? '⚠️ Supprimer une annonce' : '⚠️ Supprimer tout l\'historique'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDeleteHistoryModal(false)}
                  style={{ color: 'var(--text-muted)' }}
                  className="hover:text-[var(--text-primary)]"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                {userToDelete ? (
                  <>
                    <p className="text-sm text-red-500">
                      Vous êtes sur le point de supprimer définitivement cette annonce :
                    </p>
                    <div className="mt-3">
                      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{userToDelete.title}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{userToDelete.message}</p>
                      <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                        Envoyée le {new Date(userToDelete.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-red-500">
                    Vous êtes sur le point de supprimer <strong>tout l'historique des annonces</strong>.
                    <br />
                    Cette action est <strong>irréversible</strong>.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteHistoryModal(false)}
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
                  type="button"
                  onClick={() => userToDelete ? handleDeleteAnnouncement(userToDelete.id) : handleDeleteAllHistory()}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white disabled:opacity-70"
                >
                  {actionLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  {userToDelete ? 'Supprimer cette annonce' : 'Supprimer tout l\'historique'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RÉSULTATS ENVOI ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showResults && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="card w-full max-w-xl p-6 space-y-4 max-h-[85vh] flex flex-col" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {channel === 'whatsapp' ? '📱 Liens WhatsApp générés' : '📧 Liste emails'}
                </h3>
                <button type="button" onClick={() => setShowResults(false)} style={{ color: 'var(--text-muted)' }} className="hover:text-[var(--text-primary)]"><X size={20}/></button>
              </div>

              {channel === 'whatsapp' && waLinks.length > 0 && (
                <>
                  <button type="button" onClick={openAll}
                    className="btn-primary flex items-center justify-center gap-2 w-full">
                    <ExternalLink size={16} />
                    Ouvrir tous les {waLinks.length} liens WhatsApp
                  </button>
                  <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>Les liens s'ouvriront à 0.8s d'intervalle pour éviter le blocage</p>
                  <div className="overflow-y-auto flex-1 space-y-2">
                    {waLinks.map((l, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg p-2.5"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{l.name}</p>
                          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{l.phone}</p>
                        </div>
                        <a href={l.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all"
                          style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366' }}
                          onClick={e => e.stopPropagation()}>
                          <ExternalLink size={11} /> Ouvrir
                        </a>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {channel === 'email' && emailList.length > 0 && (
                <>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Copiez cette liste dans votre client email (Gmail, etc.) :</p>
                  <div className="rounded-xl p-3 font-mono text-xs overflow-y-auto flex-1 whitespace-pre-wrap select-all"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', minHeight: '120px', color: 'var(--success)' }}>
                    {formattedEmailsText}
                  </div>
                  <button type="button" onClick={() => {
                    navigator.clipboard.writeText(emailsClipboardText);
                    toast.success('Copié dans le presse-papiers !');
                  }} className="btn-secondary flex items-center justify-center gap-2">
                    📋 Copier la liste
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}