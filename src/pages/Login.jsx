import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { login as loginApi } from '../services/api';
import useAuthStore from '../store/authStore';

// ✅ URL du backend (dynamique pour Vercel et local)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function Login() {
  const navigate = useNavigate();
  const { login, user: authUser } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // Récupérer le redirect (ex: /events/xxx après login)
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect') || '/';

  // ✅ Redirige automatiquement si déjà connecté
  useEffect(() => {
    if (authUser) {
      navigate(redirect);
    }
  }, [authUser, navigate, redirect]);

  // ✅ Vérifie que BACKEND_URL est bien défini
  useEffect(() => {
    console.log('🔹 [Login] BACKEND_URL:', BACKEND_URL);
    if (!BACKEND_URL || !BACKEND_URL.includes('http')) {
      console.error('❌ BACKEND_URL est invalide:', BACKEND_URL);
      toast.error('Configuration incorrecte. Contactez l\'administrateur.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      return toast.error('Veuillez remplir tous les champs');
    }
    setLoading(true);
    try {
      const res = await loginApi(form);
      login(res.data.user, res.data.token);
      toast.success(`Bienvenue, ${res.data.user.fullname.split(' ')[0]} !`);
      navigate(res.data.user.role === 'admin' ? '/admin' : redirect);
    } catch (err) {
      console.error('❌ Erreur connexion email:', err);
      toast.error(err.response?.data?.error || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    try {
      // ✅ Stocke le redirect dans sessionStorage
      sessionStorage.setItem('auth_redirect', redirect);

      // ✅ Vérifie que BACKEND_URL est valide
      if (!BACKEND_URL || !BACKEND_URL.includes('http')) {
        throw new Error('BACKEND_URL non défini ou invalide. Vérifiez VITE_BACKEND_URL dans Vercel.');
      }

      // ✅ Redirige vers le backend + /api/auth/google
      const googleAuthUrl = `${BACKEND_URL}/api/auth/google`;
      console.log('🔹 [Login] Redirection vers Google OAuth:', googleAuthUrl);
      window.location.href = googleAuthUrl;
    } catch (err) {
      console.error('❌ Erreur handleGoogleLogin:', err);
      toast.error(err.message || 'Erreur lors de la connexion Google');
    }
  };

  return (
    <div
      className="min-h-screen pt-20 flex items-center justify-center px-4 transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl tracking-widest text-primary mb-2">
            CONNEXION
          </h1>
          <p className="text-secondary text-sm">
            Accédez à vos tickets et réservations
          </p>
        </div>

        {/* ✅ Bouton Google OAuth avec vérifications */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold text-sm mb-4 transition-all hover:bg-neutral-500/10"
          style={{
            background: 'var(--input-bg)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)'
          }}
        >
          <GoogleIcon />
          Continuer avec Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-muted text-xs font-semibold">ou par email</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        {/* Formulaire de connexion classique */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="text-xs text-secondary font-bold uppercase tracking-wider mb-1.5 block">
              Email
            </label>
            <div className="relative">
              <Mail
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="email"
                className="input-field pl-9"
                placeholder="email@exemple.com"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-secondary font-bold uppercase tracking-wider mb-1.5 block">
              Mot de passe
            </label>
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type={showPwd ? 'text' : 'password'}
                className="input-field pl-9 pr-10"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <p className="text-center text-secondary text-sm pt-2">
            Pas encore de compte ?{' '}
            <Link
              to={`/register?redirect=${encodeURIComponent(redirect)}`}
              className="font-bold hover:underline transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              S'inscrire
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}

// ✅ Composant pour l'icône Google
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}