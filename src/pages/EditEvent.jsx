import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, ImageIcon, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', long_description: '',
    location: '', date: '', end_date: '', organizer: '', status: 'active',
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get(`/admin/events/${id}`)
      .then(r => {
        const ev = r.data.event;
        
        // Formater la date pour l'input datetime-local
        const toLocal = (d) => d ? new Date(d).toISOString().slice(0, 16) : '';
        
        setForm({
          title: ev.title || '',
          description: ev.description || '',
          long_description: ev.long_description || '',
          location: ev.location || '',
          date: toLocal(ev.date),
          end_date: toLocal(ev.end_date),
          organizer: ev.organizer || '',
          status: ev.status || 'active',
        });
        
        // Correction : Utilisation du baseURL dynamique de l'instance API au lieu de localhost codé en dur
        if (ev.banner_url) {
          const baseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';
          setBannerPreview(`${baseUrl}${ev.banner_url}`);
        }
        
        const cats = (ev.categories || []).filter(c => c.id);
        setCategories(cats.map(c => ({
          id: c.id, 
          name: c.name || '', 
          description: c.description || '',
          price: parseFloat(c.price || 0), 
          total_quantity: parseInt(c.total_quantity || 0),
          available_quantity: parseInt(c.available_quantity || 0), 
          color: c.color || '#3B82F6',
        })));
      })
      .catch(() => toast.error('Événement introuvable'))
      .finally(() => setFetching(false));
  }, [id]);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setCat = (i, k, v) => setCategories(cats => cats.map((c, idx) => idx === i ? { ...c, [k]: v } : c));

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image trop grande (max 5MB)'); return; }
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setBannerPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation stricte
    if (!form.title.trim() || !form.date) return toast.error('Titre et date requis');
    if (categories.some(c => !c.name.trim())) return toast.error('Toutes les catégories doivent avoir un nom');
    
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Sécurisation de l'envoi des champs du formulaire
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== undefined) {
          formData.append(k, typeof v === 'string' ? v.trim() : v);
        }
      });
      
      formData.append('categories', JSON.stringify(categories));
      if (bannerFile) formData.append('banner', bannerFile);

      // Correction : Cohérence de l'URL PUT
      await api.put(`/events/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success('✅ Événement mis à jour !');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="min-h-screen pt-24 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base, #050c18)' }}>
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent, #3B82F6)', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="min-h-screen pt-20 pb-20 px-4" style={{ backgroundColor: 'var(--bg-base, #050c18)' }}>
      <div className="max-w-3xl mx-auto mt-4">
        <button type="button" onClick={() => navigate('/admin')} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={14} /> Retour admin
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <h1 className="font-display text-4xl tracking-wide text-white">MODIFIER L'ÉVÉNEMENT</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-white">
            {/* BANNER */}
            <div className="card p-6 space-y-4">
              <h2 className="font-bold text-white text-lg" style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.1))', paddingBottom: '12px' }}>
                Affiche de l'événement
              </h2>
              {bannerPreview ? (
                <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border, rgba(255,255,255,0.1))' }}>
                  <img src={bannerPreview} alt="Preview" className="w-full h-48 object-cover" />
                  <label className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-lg"
                    style={{ background: 'var(--accent, #3B82F6)' }}
                    onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.2)'}
                    onMouseLeave={e => e.currentTarget.style.filter = 'none'}>
                    <ImageIcon size={14} className="text-white" />
                    <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleBannerChange} className="hidden" />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 rounded-xl cursor-pointer transition-colors hover:bg-white/5 border-2 border-dashed"
                  style={{ borderColor: 'var(--border-strong, rgba(255,255,255,0.2))' }}>
                  <ImageIcon size={32} className="text-white/20 mb-3" />
                  <p className="text-white/40 text-sm font-semibold">Ajouter une affiche</p>
                  <p className="text-white/25 text-xs mt-1">JPG, PNG, WebP — max 5MB</p>
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleBannerChange} className="hidden" />
                </label>
              )}
            </div>

            {/* INFOS */}
            <div className="card p-6 space-y-4">
              <h2 className="font-bold text-white text-lg" style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.1))', paddingBottom: '12px' }}>
                Informations générales
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">Titre *</label>
                  <input className="input-field" value={form.title} onChange={e => setField('title', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">Date début *</label>
                  <input type="datetime-local" className="input-field" value={form.date} onChange={e => setField('date', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">Date fin</label>
                  <input type="datetime-local" className="input-field" value={form.end_date} onChange={e => setField('end_date', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">Lieu</label>
                  <input className="input-field" value={form.location} onChange={e => setField('location', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">Organisateur</label>
                  <input className="input-field" value={form.organizer} onChange={e => setField('organizer', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">Statut</label>
                  <select className="input-field cursor-pointer bg-transparent text-white" value={form.status} onChange={e => setField('status', e.target.value)}>
                    <option value="active" className="bg-[#050c18]">Actif</option>
                    <option value="cancelled" className="bg-[#050c18]">Annulé</option>
                    <option value="completed" className="bg-[#050c18]">Terminé</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">Description courte</label>
                  <input className="input-field" value={form.description} onChange={e => setField('description', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">Description complète</label>
                  <textarea className="input-field resize-none p-3" style={{ height: '100px' }}
                    value={form.long_description} onChange={e => setField('long_description', e.target.value)} />
                </div>
              </div>
            </div>

            {/* CATEGORIES */}
            <div className="card p-6 space-y-4">
              <h2 className="font-bold text-white text-lg" style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.1))', paddingBottom: '12px' }}>
                Catégories de tickets
              </h2>
              <p className="text-white/30 text-xs">Note : Le prix et le stock total ne peuvent pas être modifiés après la création afin de préserver l'intégrité des réservations en cours.</p>
              
              <div className="space-y-4">
                {categories.map((cat, i) => (
                  <div key={i} className="rounded-xl p-4 space-y-3 hover:bg-white/[0.01] transition-colors" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border, rgba(255,255,255,0.1))' }}>
                    <div className="flex items-center gap-2">
                      <input type="color" value={cat.color} onChange={e => setCat(i, 'color', e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0" style={{ background: 'transparent' }} />
                      <span className="text-white/50 text-xs font-bold uppercase tracking-wider">{cat.name || `Catégorie ${i + 1}`}</span>
                      <span className="ml-auto text-white/40 text-xs font-bold bg-white/5 px-2.5 py-1 rounded-lg">
                        {cat.available_quantity}/{cat.total_quantity} places · {cat.price === 0 ? 'GRATUIT' : `${cat.price.toLocaleString()} FCFA`}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <input className="input-field text-sm" placeholder="Nom de la catégorie *" value={cat.name} onChange={e => setCat(i, 'name', e.target.value)} />
                      <input className="input-field text-sm" placeholder="Description (optionnelle)" value={cat.description} onChange={e => setCat(i, 'description', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg font-bold shadow-lg shadow-blue-500/10">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {loading ? 'Mise à jour...' : 'Enregistrer les modifications'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}