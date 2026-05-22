import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    const user = queryParams.get('user');
    const error = queryParams.get('error');
    const redirect = sessionStorage.getItem('auth_redirect') || '/';

    // ✅ Gestion des erreurs
    if (error) {
      toast.error(`Erreur de connexion Google : ${error}`);
      sessionStorage.removeItem('auth_redirect');
      navigate('/login');
      return;
    }

    // ✅ Vérifie que token et user existent
    if (!token || !user) {
      toast.error('Erreur de connexion Google : données manquantes');
      sessionStorage.removeItem('auth_redirect');
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(user);
      login(userData, token);
      toast.success(`Bienvenue, ${userData.fullname.split(' ')[0]} !`);
      sessionStorage.removeItem('auth_redirect');
      navigate(redirect);
    } catch (err) {
      console.error('❌ Erreur lors de la connexion Google:', err);
      toast.error('Erreur lors de la connexion Google');
      sessionStorage.removeItem('auth_redirect');
      navigate('/login');
    }
  }, [location, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
        <p className="mt-2 text-secondary">Traitement de la connexion...</p>
      </div>
    </div>
  );
}