import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

/**
 * Page de callback OAuth Google
 * L'URL reçue ressemble à : /auth/callback?token=...&user=...
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    const userRaw = params.get('user');

    if (!token || !userRaw) {
      toast.error('Erreur de connexion Google. Réessayez.');
      navigate('/login');
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));
      login(user, token);
      toast.success(`Bienvenue, ${user.fullname?.split(' ')[0] || 'utilisateur'} !`);

      // Rediriger vers la page demandée avant la connexion
      const redirect = sessionStorage.getItem('auth_redirect') || '/';
      sessionStorage.removeItem('auth_redirect');
      navigate(user.role === 'admin' ? '/admin' : redirect, { replace: true });
    } catch {
      toast.error('Erreur lors de la connexion Google.');
      navigate('/login');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-white/60">
      <Loader2 size={40} className="animate-spin text-accent-400" />
      <p className="font-semibold">Connexion avec Google en cours…</p>
    </div>
  );
}
