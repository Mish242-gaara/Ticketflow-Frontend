import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Mail, Phone, MessageSquare, Send, X,
  Loader2, Search, CheckSquare, Square, ArrowLeft, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function AdminUsers() {
  const [users, setUsers]           = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(new Set());
  const [showModal, setShowModal]   = useState(false);
  const [sending, setSending]       = useState(false);
  const [channel, setChannel]       = useState('whatsapp');
  const [announcement, setAnn]      = useState({ title: '', message: '' });
  const [waLinks, setWaLinks]       = useState([]);
  const [emailList, setEmailList]   = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [history, setHistory]       = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/admin/users'),
      api.get('/admin/announcements'),
    ]).then(([u, a]) => {
      setUsers(u.data.users || []);
      setFiltered(u.data.users || []);
      setHistory(a.data.announcements || []);
    }).catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(users); return; }
    const q = search.toLowerCase();
    setFiltered(users.filter(u =>
      u.fullname?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    ));
  }, [search, users]);

  const toggleUser   = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll    = () => setSelected(new Set(filtered.map(u => u.id)));
  const clearAll     = () => setSelected(new Set());
  const isAllSel     = filtered.length > 0 && filtered.every(u => selected.has(u.id));

  const handleSend = async () => {
    if (!announcement.title.trim() || !announcement.message.trim())
      return toast.error('Titre et message requis');
    setSending(true);
    try {
      const res = await api.post('/admin/announcements', {
        title:    announcement.title,
        message:  announcement.message,
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

  const openAll = () => {
    waLinks.forEach((l, i) => setTimeout(() => window.open(l.url, `_wa_${i}`), i * 800));
  };

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
                  {['Utilisateur', 'Email', 'Téléphone', 'Tickets', 'Connexion', 'Inscrit le'].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
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
                      onClick={() => toggleUser(u.id)}
                      className="cursor-pointer transition-colors hover:bg-[var(--bg-elevated)]"
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                      }}>
                      <td className="py-3 px-4">
                        <div className={`w-4 h-4 rounded flex items-center justify-center transition-all ${isSelected ? 'bg-[var(--accent)]' : 'border'}`}
                             style={{ borderColor: isSelected ? 'var(--accent)' : 'var(--border-strong)' }}>
                          {isSelected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
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
                      <td className="py-3 px-3 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{u.phone || '—'}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-xs" style={{ color: 'var(--accent)' }}>{u.tickets_count || 0}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${u.provider === 'google' ? 'bg-blue-500/15 text-blue-400' : 'bg-white/8 text-white/40'}`}>
                          {u.provider === 'google' ? 'Google' : 'Email'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
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
            <h2 className="font-display text-2xl tracking-wide mb-4" style={{ color: 'var(--text-primary)' }}>HISTORIQUE DES ANNONCES</h2>
            <div className="space-y-3">
              {history.map((a, i) => (
                <div key={i} className="card p-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.channel === 'whatsapp' ? 'bg-green-500/15 text-green-400' : 'bg-blue-500/15 text-blue-400'}`}>
                        {a.channel === 'whatsapp' ? '📱 WhatsApp' : '📧 Email'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.sent_count} destinataire(s)</span>
                    </div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{a.message}</p>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleDateString('fr-FR')}</span>
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