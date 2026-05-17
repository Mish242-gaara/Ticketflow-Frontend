import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, Menu, X, LogOut, LayoutDashboard, QrCode } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../store/authStore';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => { logout(); navigate('/'); setMobileOpen(false); };
  const isActive = (p) => location.pathname === p;

  const publicLinks = [
    { to: '/', label: 'Accueil' },
    { to: '/events', label: 'Événements' },
  ];
  const userLinks = isAuthenticated ? [{ to: '/my-tickets', label: 'Mes Tickets' }] : [];
  const allLinks  = [...publicLinks, ...userLinks];

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 navbar transition-colors duration-200"
      style={{ backdropFilter: 'blur(12px)', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ background: 'var(--brand)' }}>
            <Ticket size={16} className="text-white" />
          </div>
          <span className="font-display text-xl tracking-widest transition-colors" style={{ color: 'var(--text-primary)' }}>
            TICKETFLOW
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {allLinks.map(l => (
            <Link key={l.to} to={l.to}
              className="text-sm font-semibold transition-colors duration-150"
              style={{ color: isActive(l.to) ? 'var(--text-primary)' : 'var(--text-muted)' }}
              onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.target.style.color = isActive(l.to) ? 'var(--text-primary)' : 'var(--text-muted)'}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle compact />

          {isAuthenticated ? (
            <div className="flex items-center gap-2 ml-1">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--accent)', color: '#fff' }}>
                  {user?.fullname?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold transition-colors" style={{ color: 'var(--text-secondary)' }}>
                {user?.fullname?.split(' ')[0]}
              </span>

              {isAdmin && (
                <>
                  <Link to="/admin"
                    className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all hover:opacity-90"
                    style={{ color: 'var(--accent)', background: 'rgba(59,130,246,0.1)' }}>
                    <LayoutDashboard size={13} /> Admin
                  </Link>
                  <Link to="/scanner"
                    className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all hover:opacity-90"
                    style={{ color: 'var(--success)', background: 'rgba(16,185,129,0.1)' }}>
                    <QrCode size={13} /> Scanner
                  </Link>
                </>
              )}

              <button onClick={handleLogout}
                className="p-1.5 rounded-lg transition-all hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: 'var(--text-muted)' }}
                title="Déconnexion">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-1">
              <Link to="/login" className="text-sm font-semibold transition-colors hover:text-primary"
                style={{ color: 'var(--text-muted)' }}>Connexion</Link>
              <Link to="/register" className="btn-primary py-2 px-4 text-sm">S'inscrire</Link>
            </div>
          )}
        </div>

        {/* Mobile right */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle compact />
          <button className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
            onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden overflow-hidden"
          style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
          <div className="p-4 flex flex-col gap-1">
            {allLinks.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                className="py-2.5 px-3 rounded-xl font-semibold text-sm transition-colors"
                style={{ color: isActive(l.to) ? 'var(--text-primary)' : 'var(--text-muted)', background: isActive(l.to) ? 'var(--bg-elevated)' : 'transparent' }}>
                {l.label}
              </Link>
            ))}
            {isAdmin && (
              <>
                <Link to="/admin" onClick={() => setMobileOpen(false)}
                  className="py-2.5 px-3 rounded-xl font-semibold text-sm flex items-center gap-2"
                  style={{ color: 'var(--accent)' }}>
                  <LayoutDashboard size={14} /> Admin Dashboard
                </Link>
                <Link to="/scanner" onClick={() => setMobileOpen(false)}
                  className="py-2.5 px-3 rounded-xl font-semibold text-sm flex items-center gap-2"
                  style={{ color: 'var(--success)' }}>
                  <QrCode size={14} /> Scanner QR
                </Link>
              </>
            )}
            <div className="border-t mt-2 pt-3 divider" style={{ borderTopWidth: '1px' }}>
              {isAuthenticated ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {user?.avatar_url
                      ? <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      : <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--accent)', color: '#fff' }}>{user?.fullname?.charAt(0)}</div>
                    }
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>{user?.fullname}</span>
                  </div>
                  <button onClick={handleLogout} className="btn-ghost py-2 px-3 text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <LogOut size={14} /> Déco
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary py-2 flex-1 text-sm text-center">Connexion</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary py-2 flex-1 text-sm text-center">S'inscrire</Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}