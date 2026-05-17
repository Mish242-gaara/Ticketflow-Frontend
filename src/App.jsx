import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar       from './components/Navbar';
import InstallPWA   from './components/InstallPWA';
import UpdateBanner from './components/UpdateBanner';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import useThemeStore from './store/themeStore';

import Home         from './pages/Home';
import Events       from './pages/Events';
import EventDetail  from './pages/EventDetail';
import TicketPage   from './pages/TicketPage';
import MyTickets    from './pages/MyTickets';
import Scanner      from './pages/Scanner';
import Admin        from './pages/Admin';
import AdminUsers   from './pages/AdminUsers';
import CreateEvent  from './pages/CreateEvent';
import EditEvent    from './pages/EditEvent';
import Login        from './pages/Login';
import Register     from './pages/Register';
import AuthCallback from './pages/AuthCallback';

export default function App() {
  const { theme } = useThemeStore();

  // Calculer si on est en dark pour les toasts
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: isDark ? '#1C3050' : '#FFFFFF',
            color: isDark ? '#F0F4FF' : '#0D1B2E',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,50,0.1)'}`,
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
      <UpdateBanner />
      <Navbar />
      <InstallPWA />

      <Routes>
        {/* Public */}
        <Route path="/"              element={<Home />} />
        <Route path="/events"        element={<Events />} />
        <Route path="/events/:slug"  element={<EventDetail />} />
        <Route path="/ticket/:uuid"  element={<TicketPage />} />
        <Route path="/login"         element={<Login />} />
        <Route path="/register"      element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Connecté */}
        <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/scanner"              element={<AdminRoute><Scanner /></AdminRoute>} />
        <Route path="/admin"                element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/admin/users"          element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/create-event"   element={<AdminRoute><CreateEvent /></AdminRoute>} />
        <Route path="/admin/edit-event/:id" element={<AdminRoute><EditEvent /></AdminRoute>} />

        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex flex-col items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            <p className="font-display text-8xl tracking-widest mb-4" style={{ color: 'var(--brand)' }}>404</p>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Page introuvable</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
