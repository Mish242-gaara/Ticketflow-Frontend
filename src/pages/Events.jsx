import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { getEvents } from '../services/api';
import EventCard from '../components/EventCard';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getEvents().then(r => {
      setEvents(r.data.events || []);
      setFiltered(r.data.events || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(events); return; }
    const q = search.toLowerCase();
    setFiltered(events.filter(e =>
      e.title.toLowerCase().includes(q) || 
      e.location?.toLowerCase().includes(q) || 
      e.organizer?.toLowerCase().includes(q)
    ));
  }, [search, events]);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 transition-colors duration-200" 
         style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--brand)' }}>
            Tous les événements
          </p>
          <h1 className="font-display text-5xl md:text-6xl tracking-wide text-primary mb-8">
            ÉVÉNEMENTS
          </h1>

          {/* Search */}
          <div className="relative mb-10 max-w-xl">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Rechercher un événement..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card h-72 animate-pulse">
                <div className="h-44 rounded-t-2xl" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                <div className="p-4 space-y-3">
                  <div className="h-4 rounded w-3/4" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                  <div className="h-3 rounded w-1/2" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((ev, i) => <EventCard key={ev.id} event={ev} index={i} />)}
          </div>
        ) : (
          <div className="text-center py-20 text-muted">
            <p className="text-lg">Aucun événement trouvé.</p>
          </div>
        )}
      </div>
    </div>
  );
}