import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Mail, Lock, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { register as registerApi } from '../services/api';
import useAuthStore from '../store/authStore';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ fullname: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const params   = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect') || '/';

  const handleGoogleLogin = () => {
    sessionStorage.setItem('auth_redirect', redirect);
    // Utilisation dynamique de l'URL de l'API de configuration ou fallback local
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullname || !form.email || !form.password) return toast.error('Champs requis');
    if (form.password !== form.confirm) return toast.error('Mots de passe différents');
    if (form.password.length < 6) return toast.error('Mot de passe trop court (min 6 car.)');
    
    setLoading(true);
    try {
      const res = await registerApi({ 
        fullname: form.fullname, 
        email: form.email, 
        phone: form.phone, 
        password: form.password 
      });
      login(res.data.user, res.data.token);
      toast.success('Compte créé avec succès !');
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'inscription");
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl tracking-widest text-white mb-2">INSCRIPTION</h1>
          <p className="text-white/40 text-sm">Créez votre compte pour réserver vos tickets</p>
        </div>

        <button 
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold text-sm mb-4 transition-all hover:bg-white/10 text-white"
          style={{ 
            background: 'var(--input-bg)', 
            border: '1px solid var(--border-strong)' 
          }}>
          <GoogleIcon /> S'inscrire avec Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-white/30 text-xs font-semibold">ou avec un email</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-3">
          {[
            { key: 'fullname', label: 'Nom complet', type: 'text',     placeholder: 'Jean-Paul Mbemba', Icon: User  },
            { key: 'email',    label: 'Email',       type: 'email',    placeholder: 'email@exemple.com', Icon: Mail  },
            { key: 'phone',    label: 'Téléphone',   type: 'tel',      placeholder: '+242 06 XXX XX XX', Icon: Phone },
            { key: 'password', label: 'Mot de passe',type: 'password', placeholder: 'Minimum 6 caractères', Icon: Lock },
            { key: 'confirm',  label: 'Confirmer le mot de passe', type: 'password', placeholder: '••••••••', Icon: Lock },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">{f.label}</label>
              <div className="relative">
                <f.Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input 
                  type={f.type} 
                  className="input-field pl-9" 
                  placeholder={f.placeholder}
                  value={form[f.key]} 
                  onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} 
                />
              </div>
            </div>
          ))}

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
          
          <p className="text-center text-white/40 text-sm pt-1">
            Déjà un compte ?{' '}
            <Link 
              to={`/login?redirect=${encodeURIComponent(redirect)}`} 
              className="font-bold transition-colors"
              style={{ color: 'var(--accent)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-hover)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--accent)'}>
              Se connecter
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}