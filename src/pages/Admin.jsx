import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  Ticket, Users, DollarSign, ScanLine, Plus, Download,
  Pencil, Trash2, Eye, CheckCircle, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getAdminStats, getAttendees } from '../services/api';

export default function Admin() {
  const [stats, setStats]         = useState(null);
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeEvent, setActiveEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [statsRes, eventsRes] = await Promise.all([
        getAdminStats(),
        api.get('/admin/events'),
      ]);
      setStats(statsRes.data.stats);
      setEvents(eventsRes.data.events || []);
    } catch { 
      toast.error('Erreur chargement'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadData(); }, []);

  const loadAttendees = async (eventId) => {
    setActiveEvent(eventId);
    setActiveTab('attendees');
    try {
      const res = await getAttendees(eventId);
      setAttendees(res.data.attendees || []);
    } catch { 
      toast.error('Erreur chargement participants'); 
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Supprimer "${title}" ? Cette action est irréversible.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/events/${id}`);
      toast.success('Événement supprimé');
      setEvents(evs => evs.filter(e => e.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur suppression');
    } finally { 
      setDeletingId(null); 
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
    const link = document.createElement('a'); link.href = url;
    link.download = `participants-event-${activeEvent}.csv`; link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const statCards = [
    { label: 'Total tickets', value: stats?.total || 0, icon: Ticket, color: 'text-accent-500', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Actifs / Valides', value: stats?.active || 0, icon: CheckCircle, color: 'text-emerald-500', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Scannés', value: stats?.scanned || 0, icon: ScanLine, color: 'text-amber-500', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Revenus', value: `${(stats?.revenue || 0).toLocaleString()} FCFA`, icon: DollarSign, color: 'text-red-500', bg: 'rgba(192,57,43,0.1)' },
  ];

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'events', label: `Événements (${events.length})` },
    { id: 'attendees', label: 'Participants' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-20 px-4 transition-colors duration-200" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mt-4 mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-4xl md:text-5xl tracking-wide text-primary">ADMIN</h1>
            <p className="text-secondary text-sm mt-1">Tableau de bord — TicketFlow</p>
          </div>
          <div className="flex gap-3">
            <Link to="/scanner" className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm">
              <ScanLine size={14} /> Scanner QR
            </Link>
            <Link to="/admin/users" className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm"><Users size={14} /> Utilisateurs</Link>
            <Link to="/admin/create-event" className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
              <Plus size={14} /> Nouvel événement
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl p-1 mb-6 w-fit transition-colors" 
             style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === t.id ? 'btn-primary text-white' : 'text-secondary hover:text-primary'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── DASHBOARD ─────────────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="card p-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
                    <s.icon size={18} className={s.color} />
                  </div>
                  <p className="text-secondary text-xs font-bold uppercase tracking-wider mb-1">{s.label}</p>
                  <p className="font-display text-2xl tracking-wide text-primary">{s.value}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bar chart */}
              {stats?.by_category?.length > 0 && (
                <div className="card p-5 lg:col-span-2">
                  <h3 className="font-bold text-primary mb-4">Tickets par catégorie</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.by_category} barSize={32}>
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }}
                        labelStyle={{ color: 'var(--text-primary)' }} cursor={{ fill: 'var(--input-bg)' }}
                      />
                      <Bar dataKey="count" radius={[6,6,0,0]} name="Tickets">
                        {stats.by_category.map((entry, i) => (
                          <Cell key={i} fill={entry.color || 'var(--accent)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Recent */}
              <div className="card p-5">
                <h3 className="font-bold text-primary mb-4">Dernières réservations</h3>
                <div className="space-y-3">
                  {stats?.recent_tickets?.map((t, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color || 'var(--accent)' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-primary text-xs font-semibold truncate">{t.holder_name}</p>
                        <p className="text-secondary text-xs">{t.category}</p>
                      </div>
                      <span className={`text-xs font-bold ${t.status === 'active' ? 'text-emerald-500' : t.status === 'used' ? 'text-accent-500' : 'text-amber-500'}`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                  {!stats?.recent_tickets?.length && <p className="text-muted text-sm">Aucune réservation</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── EVENTS CRUD ────────────────────────────────────────────────────── */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-16 text-muted">
                <Ticket size={40} className="mx-auto mb-3 opacity-30" />
                <p>Aucun événement. <Link to="/admin/create-event" className="font-bold" style={{ color: 'var(--accent)' }}>Créez-en un</Link>.</p>
              </div>
            ) : (
              events.map((ev, i) => (
                <motion.div key={ev.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="card overflow-hidden flex gap-0">
                  {/* Banner thumbnail */}
                  <div className="w-24 md:w-32 flex-shrink-0 relative overflow-hidden" style={{ background: 'var(--input-bg)' }}>
                    {ev.banner_url ? (
                      <img src={`http://localhost:5000${ev.banner_url}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-display text-3xl text-muted">{ev.title.slice(0,2).toUpperCase()}</span>
                      </div>
                    )}
                    {/* Status badge */}
                    <div className={`absolute top-2 left-2 text-xs font-bold px-1.5 py-0.5 rounded ${ev.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                      {ev.status === 'active' ? '●' : '✕'}
                    </div>
                  </div>

                  <div className="flex-1 p-4 flex flex-col md:flex-row md:items-center gap-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-primary text-sm md:text-base truncate">{ev.title}</h3>
                      <p className="text-secondary text-xs mt-0.5">
                        {new Date(ev.date).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}
                        {ev.location && ` · ${ev.location}`}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs">
                        <span className="text-secondary">🎟 {ev.tickets_sold || 0}/{ev.total_tickets} vendus</span>
                        <span className="text-emerald-500">✅ {ev.tickets_scanned || 0} scannés</span>
                        <span className="text-amber-500">💰 {parseInt(ev.revenue || 0).toLocaleString()} FCFA</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      <button onClick={() => loadAttendees(ev.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all text-secondary hover:text-primary"
                        style={{ background: 'var(--input-bg)' }}>
                        <Eye size={12} /> Participants
                      </button>
                      <button onClick={() => navigate(`/admin/edit-event/${ev.id}`)}
                        className="flex items-center gap-1.5 bg-accent-500/10 hover:bg-accent-500/20 text-accent-500 px-3 py-2 rounded-lg text-xs font-bold transition-all">
                        <Pencil size={12} /> Modifier
                      </button>
                      <button onClick={() => handleDelete(ev.id, ev.title)} disabled={deletingId === ev.id}
                        className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50">
                        <Trash2 size={12} /> {deletingId === ev.id ? '...' : 'Supprimer'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* ── ATTENDEES ──────────────────────────────────────────────────────── */}
        {activeTab === 'attendees' && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h3 className="font-bold text-primary text-lg">Liste des participants</h3>
                {attendees.length > 0 && (
                  <p className="text-secondary text-xs mt-0.5">{attendees.length} participant(s)</p>
                )}
              </div>
              <div className="flex gap-3 flex-wrap">
                {events.map(ev => (
                  <button key={ev.id} onClick={() => loadAttendees(ev.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeEvent === ev.id ? 'btn-primary text-white' : 'text-secondary hover:text-primary'}`}
                    style={{ background: activeEvent === ev.id ? '' : 'var(--input-bg)' }}>
                    {ev.title.length > 20 ? `${ev.title.slice(0, 20)}...` : ev.title}
                  </button>
                ))}
                {attendees.length > 0 && (
                  <button onClick={exportCSV} className="flex items-center gap-1.5 text-accent-500 text-xs font-bold hover:text-accent-600 transition-colors px-3 py-1.5 rounded-lg bg-accent-500/10">
                    <Download size={12} /> CSV
                  </button>
                )}
              </div>
            </div>

            {!activeEvent ? (
              <p className="text-muted text-sm py-8 text-center">Sélectionnez un événement ci-dessus.</p>
            ) : attendees.length === 0 ? (
              <p className="text-muted text-sm py-8 text-center">Aucun participant pour cet événement.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }} className="text-secondary text-xs uppercase tracking-wider">
                      <th className="text-left pb-3 pr-4">Nom</th>
                      <th className="text-left pb-3 pr-4">Téléphone</th>
                      <th className="text-left pb-3 pr-4">Catégorie</th>
                      <th className="text-left pb-3 pr-4">Ticket</th>
                      <th className="text-left pb-3 pr-4">Paiement</th>
                      <th className="text-left pb-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map((a, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-neutral-500/5 transition-colors">
                        <td className="py-2.5 pr-4 font-semibold text-primary text-xs">{a.holder_name}</td>
                        <td className="py-2.5 pr-4 text-secondary text-xs font-mono">{a.holder_phone || '—'}</td>
                        <td className="py-2.5 pr-4">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: (a.color || '#3B82F6') + '25', color: a.color || '#3B82F6' }}>
                            {a.category_name}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`text-xs font-bold flex items-center gap-1 ${a.status === 'active' ? 'text-emerald-500' : a.status === 'used' ? 'text-accent-500' : 'text-amber-500'}`}>
                            {a.status === 'active' ? <CheckCircle size={10} /> : a.status === 'used' ? <ScanLine size={10} /> : <Clock size={10} />}
                            {a.status}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`text-xs font-bold ${a.payment_status === 'success' ? 'text-emerald-500' : a.payment_status === 'pending' ? 'text-amber-500' : 'text-muted'}`}>
                            {a.payment_status || '—'}
                          </span>
                        </td>
                        <td className="py-2.5 text-secondary text-xs">{new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}