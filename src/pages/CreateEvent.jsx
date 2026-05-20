import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, Loader2, ArrowLeft, X, ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const DEFAULT_CATS = [
  { name: 'Étudiant ESTAM', description: 'Accès gratuit pour les étudiants ESTAM — inscription via délégué', price: 0, total_quantity: 200, color: '#3B82F6' },
  { name: 'Apprenant C-TECH', description: 'Centre de formation partenaire', price: 1000, total_quantity: 80, color: '#10B981' },
  { name: 'Invité / Externe', description: 'Ouvert à tous — amis, famille…', price: 1000, total_quantity: 20, color: '#EF4444' },
];

export default function CreateEvent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', long_description: '',
    location: '', date: '', end_date: '', organizer: 'BDE ESTAM',
  });
  const [categories, setCategories] = useState(DEFAULT_CATS);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  
  // Correction : Sécurisation pour éviter d'injecter des NaN si le champ est vidé temporairement
  const setCat = (i, k, v) => setCategories(cats => cats.map((c, idx) => {
    if (idx !== i) return c;
    if (k === 'price') return { ...c, [k]: isNaN(v) ? 0 : v };
    if (k === 'total_quantity') return { ...c, [k]: isNaN(v) ? 0 : v };
    return { ...c, [k]: v };
  }));

  const addCat = () => setCategories(c => [...c, { name: '', description: '', price: 0, total_quantity: 50, color: '#8B5CF6' }]);
  const removeCat = (i) => setCategories(c => c.filter((_, idx) => idx !== i));

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image trop grande (max 5MB)'); return; }
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setBannerPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeBanner = () => { setBannerFile(null); setBannerPreview(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return toast.error('Titre et date requis');
    if (categories.some(c => !c.name.trim())) return toast.error('Toutes les catégories doivent avoir un nom');
    if (categories.some(c => c.total_quantity <= 0)) return toast.error('Chaque catégorie doit contenir au moins 1 place');
    
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v) formData.append(k, v.trim ? v.trim() : v);
      });
      
      formData.append('categories', JSON.stringify(categories));
      if (bannerFile) formData.append('banner', bannerFile);

      await api.post('/events', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success('🎉 Événement créé avec succès !');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-20 px-4" style={{ backgroundColor: 'var(--bg-base, #050c18)' }}>
      <div className="max-w-3xl mx-auto mt-4">
        <button type="button" onClick={() => navigate('/admin')} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={14} /> Retour admin
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl tracking-wide text-white mb-8">CRÉER UN ÉVÉNEMENT</h1>

          <form onSubmit={handleSubmit} className="space-y-6 text-white">
            {/* BANNER UPLOAD */}
            <div className="card p-6 space-y-4">
              <h2 className="font-bold text-white text-lg" style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.1))', paddingBottom: '12px' }}>
                Affiche de l\'événement
              </h2> 

              {bannerPreview ? (
                <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border, rgba(255,255,255,0.1))' }}>
                  <img src={bannerPreview} alt="Preview" className="w-full h-48 object-cover" />
                  <button type="button" onClick={removeBanner}
                    className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg">
                    <X size={14} className="text-white" />
                  </button>
                  <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-lg font-semibold max-w-[80%] truncate">
                    {bannerFile?.name}
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 rounded-xl cursor-pointer transition-colors hover:bg-white/5 border-2 border-dashed"
                  style={{ borderColor: 'var(--border-strong, rgba(255,255,255,0.2))' }}>
                  <ImageIcon size={32} className="text-white/20 mb-3" />
                  <p className="text-white/40 text-sm font-semibold">Cliquez pour ajouter une affiche</p>
                  <p className="text-white/25 text-xs mt-1">JPG, PNG, WebP — max 5MB</p>
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleBannerChange} className="hidden" />
                </label>
              )}
            </div>

            {/* INFOS GÉNÉRALES */}
            <div className="card p-6 space-y-4">
              <h2 className="font-bold text-white text-lg" style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.1))', paddingBottom: '12px' }}>
                Informations générales
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">Titre *</label>
                  <input className="input-field" placeholder="Excursion — Tour du Kouilou 2026" value={form.title} onChange={e => setField('title', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">Date & heure de début *</label>
                  <input type="datetime-local" className="input-field" value={form.date} onChange={e => setField('date', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">Date & heure de fin</label>
                  <input type="datetime-local" className="input-field" value={form.end_date} onChange={e => setField('end_date', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">Lieu</label>
                  <input className="input-field" placeholder="Relais du Kouilou, Matombi" value={form.location} onChange={e => setField('location', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">Organisateur</label>
                  <input className="input-field" placeholder="BDE ESTAM" value={form.organizer} onChange={e => setField('organizer', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">Description courte</label>
                  <input className="input-field" placeholder="Une phrase résumant l'événement..." value={form.description} onChange={e => setField('description', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1.5 block">Description complète</label>
                  <textarea className="input-field resize-none p-3" style={{ height: '100px' }}
                    placeholder="Décrivez l'événement en détail..." value={form.long_description} onChange={e => setField('long_description', e.target.value)} />
                </div>
              </div>
            </div>

            {/* CATÉGORIES */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.1))', paddingBottom: '12px' }}>
                <h2 className="font-bold text-white text-lg">Catégories de tickets</h2>
                <button type="button" onClick={addCat}
                  className="flex items-center gap-1.5 text-xs font-bold transition-all"
                  style={{ color: 'var(--accent, #3B82F6)' }}
                  onMouseEnter={e => e.target.style.filter = 'brightness(1.2)'}
                  onMouseLeave={e => e.target.style.filter = 'none'}>
                  <Plus size={14} /> Ajouter catégorie
                </button>
              </div>

              <div className="space-y-4">
                {categories.map((cat, i) => (
                  <div key={i} className="rounded-xl p-4 space-y-3 hover:bg-white/[0.01] transition-colors" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border, rgba(255,255,255,0.1))' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input type="color" value={cat.color} onChange={e => setCat(i, 'color', e.target.value)}
                          className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0" style={{ background: 'transparent' }} />
                        <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Catégorie {i + 1}</span>
                      </div>
                      {categories.length > 1 && (
                        <button type="button" onClick={() => removeCat(i)} className="text-red-400/60 hover:text-red-400 transition-colors p-1">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <input className="input-field text-sm" placeholder="Nom de la catégorie *" value={cat.name} onChange={e => setCat(i, 'name', e.target.value)} />
                      </div>
                      <div>
                        <input className="input-field text-sm" placeholder="Prix (0 = gratuit)" type="number" min="0" value={cat.price === 0 ? '' : cat.price} onChange={e => setCat(i, 'price', parseFloat(e.target.value))} />
                      </div>
                      <div>
                        <input className="input-field text-sm" placeholder="Nombre de places" type="number" min="1" value={cat.total_quantity === 0 ? '' : cat.total_quantity} onChange={e => setCat(i, 'total_quantity', parseInt(e.target.value))} />
                      </div>
                      <div className="col-span-2">
                        <input className="input-field text-sm" placeholder="Description (optionnel)" value={cat.description} onChange={e => setCat(i, 'description', e.target.value)} />
                      </div>
                    </div>
                    {/* Preview dynamique du Ticket */}
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5 mt-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: cat.color + '25', color: cat.color }}>
                        {cat.name || 'Sans titre'}
                      </span>
                      <span className="text-xs text-white/40 font-bold">
                        {parseFloat(cat.price || 0) === 0 ? 'GRATUIT' : `${parseInt(cat.price || 0).toLocaleString()} FCFA`}
                        {' · '}{cat.total_quantity || 0} places
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg font-bold shadow-lg shadow-blue-500/10">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              {loading ? 'Création en cours...' : 'Créer l\'événement'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}