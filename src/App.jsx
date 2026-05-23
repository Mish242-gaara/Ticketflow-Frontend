import { lazy, Suspense, useEffect } from 'react'; // ✅ Ajoute useEffect
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

// --- Composants ---
import Navbar from './components/Navbar';
import UpdateBanner from './components/UpdateBanner';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import useThemeStore from './store/themeStore';

// --- 1. Composant ThemeProvider avec useEffect ---
function ThemeProvider({ children }) {
  const { theme, initTheme, setTheme } = useThemeStore();

  // ✅ Effet pour initialiser le thème
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // ✅ Effet pour écouter les changements de thème système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentTheme = useThemeStore.getState().theme;
      if (currentTheme === 'system') setTheme('system');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setTheme]);

  // Calculer si on est en mode sombre
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);

  return (
    <>
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
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
      {children}
    </>
  );
}

// --- 2. Chargement paresseux des pages ---
const Home = lazy(() => import('./pages/Home'));
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const TicketPage = lazy(() => import('./pages/TicketPage'));
const MyTickets = lazy(() => import('./pages/MyTickets'));
const Scanner = lazy(() => import('./pages/Scanner'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const EditEvent = lazy(() => import('./pages/EditEvent'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));

// --- 3. Composant principal App ---
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <UpdateBanner />
        <Navbar />
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:slug" element={<EventDetail />} />
            <Route path="/ticket/:uuid" element={<TicketPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
            <Route path="/scanner" element={<AdminRoute><Scanner /></AdminRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/create-event" element={<AdminRoute><CreateEvent /></AdminRoute>} />
            <Route path="/admin/edit-event/:id" element={<AdminRoute><EditEvent /></AdminRoute>} />
            <Route path="*" element={
              <div className="min-h-screen flex flex-col items-center justify-center">
                <p className="font-display text-8xl tracking-widest mb-4">404</p>
                <p className="text-lg">Page introuvable</p>
              </div>
            } />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}