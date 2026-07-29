import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, X, MapPin, User2, Calendar, Weight, PawPrint, ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useI18n } from '@/context/I18nContext';
import { PageHeader } from '@/components/AppLayout';
import { Card, Button, Badge, Skeleton, EmptyState, Spinner } from '@/components/ui';
import type { Animal } from '@/types';

const PAGE_SIZE = 8;

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
];

const emptyForm = (): Partial<Animal> => ({
  owner_name: '', species: 'cattle', breed: '', gender: undefined,
  age_years: undefined, weight_kg: undefined, village: '', district: '',
  state: '', gps_lat: undefined, gps_lng: undefined,
  vaccination_notes: '', medical_notes: '', animal_id_tag: '',
});

interface AnimalFormProps {
  initial?: Partial<Animal>;
  onSave: (data: Partial<Animal>) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

function AnimalForm({ initial, onSave, onClose, saving }: AnimalFormProps) {
  const { t } = useI18n();
  const [form, setForm] = useState<Partial<Animal>>(initial ?? emptyForm());
  const set = <K extends keyof Animal>(k: K, v: Animal[K] | undefined) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl card shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-display font-bold text-lg">{initial?.id ? t('form.editTitle') : t('form.newTitle')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('form.animalTag')}</label>
              <input value={form.animal_id_tag ?? ''} onChange={(e) => set('animal_id_tag', e.target.value)} placeholder="TAG-001" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('form.ownerName')} <span className="text-error-500">*</span></label>
              <input required value={form.owner_name ?? ''} onChange={(e) => set('owner_name', e.target.value)} placeholder="Ramesh Singh" className="input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('form.species')} <span className="text-error-500">*</span></label>
              <select required value={form.species} onChange={(e) => set('species', e.target.value as 'cattle' | 'buffalo')} className="input">
                <option value="cattle">Cattle</option>
                <option value="buffalo">Buffalo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('form.breed')}</label>
              <input value={form.breed ?? ''} onChange={(e) => set('breed', e.target.value)} placeholder="Gir / Murrah…" className="input" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('form.gender')}</label>
              <select value={form.gender ?? ''} onChange={(e) => set('gender', e.target.value as 'male' | 'female' | undefined || undefined)} className="input">
                <option value="">{t('form.select')}</option>
                <option value="male">{t('form.male')}</option>
                <option value="female">{t('form.female')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('form.age')}</label>
              <input type="number" min="0" step="0.5" value={form.age_years ?? ''} onChange={(e) => set('age_years', e.target.value ? Number(e.target.value) : undefined)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('form.weight')}</label>
              <input type="number" min="0" step="1" value={form.weight_kg ?? ''} onChange={(e) => set('weight_kg', e.target.value ? Number(e.target.value) : undefined)} className="input" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('form.village')}</label>
              <input value={form.village ?? ''} onChange={(e) => set('village', e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('form.district')}</label>
              <input value={form.district ?? ''} onChange={(e) => set('district', e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('form.state')}</label>
              <select value={form.state ?? ''} onChange={(e) => set('state', e.target.value)} className="input">
                <option value="">{t('form.select')}</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('form.gpsLat')}</label>
              <input type="number" step="0.000001" value={form.gps_lat ?? ''} onChange={(e) => set('gps_lat', e.target.value ? Number(e.target.value) : undefined)} className="input" placeholder="20.5937" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('form.gpsLng')}</label>
              <input type="number" step="0.000001" value={form.gps_lng ?? ''} onChange={(e) => set('gps_lng', e.target.value ? Number(e.target.value) : undefined)} className="input" placeholder="78.9629" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('form.vaccinationNotes')}</label>
            <textarea rows={2} value={form.vaccination_notes ?? ''} onChange={(e) => set('vaccination_notes', e.target.value)} className="input resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('form.medicalNotes')}</label>
            <textarea rows={2} value={form.medical_notes ?? ''} onChange={(e) => set('medical_notes', e.target.value)} className="input resize-none" />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? <><Spinner className="w-4 h-4" /> {t('form.saving')}</> : t('form.save')}
            </Button>
            <Button variant="outline" onClick={onClose}>{t('form.cancel')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AnimalsPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<'all' | 'cattle' | 'buffalo'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Animal | undefined>();
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('animals').select('*', { count: 'exact' });
    if (speciesFilter !== 'all') q = q.eq('species', speciesFilter);
    if (search.trim()) q = q.or(`breed.ilike.%${search.trim()}%,owner_name.ilike.%${search.trim()}%`);
    q = q.order('created_at', { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    const { data, count: c } = await q;
    setAnimals(data as Animal[] ?? []);
    setCount(c ?? 0);
    setLoading(false);
  }, [page, search, speciesFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSave = async (form: Partial<Animal>) => {
    if (!session?.user) return;
    setSaving(true);
    if (editTarget?.id) {
      const { error } = await supabase.from('animals').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editTarget.id);
      if (error) toast(t('animals.updateFailed'), 'error');
      else { toast(t('animals.updated'), 'success'); setShowForm(false); fetch(); }
    } else {
      const { error } = await supabase.from('animals').insert({ ...form, user_id: session.user.id });
      if (error) toast(t('animals.createFailed'), 'error');
      else { toast(t('animals.created'), 'success'); setShowForm(false); fetch(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('animals').delete().eq('id', id);
    if (error) toast(t('animals.deleteFailed'), 'error');
    else { toast(t('animals.deleted'), 'success'); fetch(); }
    setConfirmDelete(null);
  };

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title={t('animals.title')}
        subtitle={`${count} ${t('animals.subtitle')}${count !== 1 ? 's' : ''} registered.`}
        action={
          <Button onClick={() => { setEditTarget(undefined); setShowForm(true); }}>
            <Plus className="w-4 h-4" /> {t('animals.new')}
          </Button>
        }
      />

      {/* Filters */}
      <Card className="mb-4">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder={t('animals.search')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-4 h-4" /></button>}
          </div>
          <div className="flex gap-1.5">
            {(['all', 'cattle', 'buffalo'] as const).map((s) => (
              <button key={s} onClick={() => { setSpeciesFilter(s); setPage(0); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${speciesFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Grid / list */}
      <Card>
        {loading ? (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : animals.length === 0 ? (
          <EmptyState
            icon={<PawPrint className="w-7 h-7" />}
            title={t('animals.noResults')}
            description={search ? 'Try a different search term.' : t('animals.noResultsDesc')}
            action={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> {t('animals.add')}</Button>}
          />
        ) : (
          <>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {animals.map((a) => (
                <div key={a.id} onClick={() => navigate(`/app/animals/${a.id}`)} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all group cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{a.breed || t('animals.unknownBreed')}</p>
                        <Badge color={a.species === 'buffalo' ? 'blue' : 'green'}>{a.species}</Badge>
                        {a.gender && <Badge color="gray">{a.gender}</Badge>}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                        <User2 className="w-3 h-3" /> {a.owner_name}
                        {a.animal_id_tag && <> · #{a.animal_id_tag}</>}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditTarget(a); setShowForm(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {confirmDelete === a.id ? (
                        <>
                          <button onClick={() => handleDelete(a.id)} className="px-2 py-1 rounded-lg bg-error-600 text-white text-xs">{t('common.delete')}</button>
                          <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 rounded-lg border border-gray-300 text-xs">{t('common.cancel')}</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDelete(a.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {a.age_years != null && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {a.age_years} yr{a.age_years !== 1 ? 's' : ''}</span>}
                    {a.weight_kg != null && <span className="flex items-center gap-1"><Weight className="w-3 h-3" /> {a.weight_kg} kg</span>}
                    {(a.district || a.state) && <span className="flex items-center gap-1 col-span-2"><MapPin className="w-3 h-3" /> {[a.district, a.state].filter(Boolean).join(', ')}</span>}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-500">Page {page + 1} of {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {showForm && (
        <AnimalForm
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTarget(undefined); }}
          saving={saving}
        />
      )}

      {/* Global input style */}
      <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; border-radius: 0.75rem; background: white; border: 1px solid rgb(229,231,235); font-size: 0.875rem; outline: none; transition: all 0.2s; } .input:focus { border-color: rgb(5,150,105); box-shadow: 0 0 0 3px rgba(5,150,105,0.1); } .dark .input { background: rgb(15,23,20); border-color: rgb(31,41,37); color: white; }`}</style>
    </div>
  );
}
