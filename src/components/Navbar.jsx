import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, Menu, X, LogOut, LayoutDashboard, QrCode } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../store/authStore';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const publicLinks = [
    { to: '/', label: 'Accueil' },
    { to: '/events', label: 'Événements' },
  ];

  const userLinks = isAuthenticated ? [{ to: '/my-tickets', label: 'Mes Billets' }] : [];
  const allLinks = [...publicLinks, ...userLinks];

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 navbar transition-colors duration-200"
      style={{
        backdropFilter: 'blur(12px)',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ background: 'var(--brand)' }}
          >
            <Ticket size={16} className="text-white" />
          </div>
          <span className="font-display text-xl tracking-widest font-bold" style={{ color: 'var(--text-primary)' }}>
            TICKETFLOW
          </span>
        </Link>

        {/* Navigation Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {allLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="text-sm font-semibold transition-colors duration-150 relative"
              style={{
                color: isActive(link.to) ? 'var(--brand)' : 'var(--text-secondary)',
              }}
            >
              {link.label}
              {isActive(link.to) && (
                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: 'var(--brand)' }}
                  layoutId="activeLink"
                />
              )}
            </Link>
          ))}
        </div>

        {/* Côté droit (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle compact />

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              {/* Avatar ou initiale */}
              <div className="flex items-center gap-2">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full object-cover border-2"
                    style={{ borderColor: 'var(--brand)' }}
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background: 'var(--brand)',
                      color: '#fff',
                    }}
                  >
                    {user?.fullname?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {user?.fullname?.split(' ')[0]}
                </span>
              </div>

              {/* Liens Admin */}
              {isAdmin && (
                <>
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-90"
                    style={{
                      color: 'var(--brand)',
                      background: 'rgba(229, 9, 20, 0.1)',
                    }}
                  >
                    <LayoutDashboard size={14} /> Admin
                  </Link>
                  <Link
                    to="/scanner"
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-90"
                    style={{
                      color: 'var(--success)',
                      background: 'rgba(76, 175, 80, 0.1)',
                    }}
                  >
                    <QrCode size={14} /> Scanner
                  </Link>
                </>
              )}

              {/* Bouton Déconnexion */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg transition-colors hover:bg-[var(--brand)]/10"
                style={{ color: 'var(--text-muted)' }}
                title="Déconnexion"
              >
                <LogOut size={18} style={{ color: 'var(--brand)' }} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-semibold transition-colors hover:text-[var(--brand)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Connexion
              </Link>
              <Link to="/register" className="btn-primary py-2 px-4 text-sm">
                S'inscrire
              </Link>
            </div>
          )}
        </div>

        {/* Menu Mobile (icône) */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle compact />
          <button
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} style={{ color: 'var(--brand)' }} /> : <Menu size={22} style={{ color: 'var(--brand)' }} />}
          </button>
        </div>
      </div>

      {/* Menu Mobile (contenu) */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden overflow-hidden"
          style={{
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div className="p-4 flex flex-col gap-1">
            {/* Liens publics et utilisateur */}
            {allLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="py-2.5 px-3 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                style={{
                  color: isActive(link.to) ? 'var(--brand)' : 'var(--text-secondary)',
                  background: isActive(link.to) ? 'rgba(229, 9, 20, 0.1)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            ))}

            {/* Liens Admin (Mobile) */}
            {isAdmin && (
              <>
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 px-3 rounded-lg font-semibold text-sm flex items-center gap-2"
                  style={{ color: 'var(--brand)' }}
                >
                  <LayoutDashboard size={16} /> Admin Dashboard
                </Link>
                <Link
                  to="/scanner"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 px-3 rounded-lg font-semibold text-sm flex items-center gap-2"
                  style={{ color: 'var(--success)' }}
                >
                  <QrCode size={16} /> Scanner QR
                </Link>
              </>
            )}

            {/* Séparateur */}
            <div className="border-t my-3 divider" style={{ borderTopWidth: '1px', borderColor: 'var(--border)' }} />

            {/* Section Auth (Mobile) */}
            {isAuthenticated ? (
              <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(229, 9, 20, 0.05)' }}>
                <div className="flex items-center gap-3">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover border-2"
                      style={{ borderColor: 'var(--brand)' }}
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                      style={{
                        background: 'var(--brand)',
                        color: '#fff',
                      }}
                    >
                      {user?.fullname?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {user?.fullname}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg transition-colors hover:bg-red-500/10"
                >
                  <LogOut size={18} style={{ color: 'var(--brand)' }} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn-secondary py-2.5 flex-1 text-sm text-center"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary py-2.5 flex-1 text-sm text-center"
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}