import { useEffect, useState } from 'react';
import { Users, Database, ScrollText, ShieldCheck, Search, Plus, X, Pencil, Trash2, PawPrint } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useI18n } from '@/context/I18nContext';
import { PageHeader } from '@/components/AppLayout';
import { Card, CardHeader, Button, Badge, Skeleton, EmptyState, Spinner } from '@/components/ui';
import type { Profile, Breed, ActivityLog, UserRole } from '@/types';

type Tab = 'users' | 'breeds' | 'logs';

const roleColors: Record<UserRole, 'red' | 'blue' | 'amber' | 'green'> = {
  admin: 'red', officer: 'blue', veterinarian: 'amber', farmer: 'green',
};

export function AdminPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('users');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState('');
  const [showBreedForm, setShowBreedForm] = useState(false);
  const [editBreed, setEditBreed] = useState<Breed | undefined>();
  const [breedForm, setBreedForm] = useState<Partial<Breed>>({});
  const [savingBreed, setSavingBreed] = useState(false);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const [u, b, l] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('breeds').select('*').order('name', { ascending: true }),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(50),
      ]);
      setUsers(u.data as Profile[] ?? []);
      setBreeds(b.data as Breed[] ?? []);
      setLogs(l.data as ActivityLog[] ?? []);
      setLoading(false);
    })();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title={t('admin.title')} />
        <Card>
          <EmptyState icon={<ShieldCheck className="w-7 h-7" />} title={t('admin.restricted')} description={t('admin.restrictedDesc')} />
        </Card>
      </div>
    );
  }

  const handleBreedSave = async () => {
    setSavingBreed(true);
    if (editBreed?.id) {
      const { error } = await supabase.from('breeds').update(breedForm).eq('id', editBreed.id);
      if (error) toast(t('admin.breedSaveFailed'), 'error');
      else { toast(t('admin.breedUpdated'), 'success'); refreshBreeds(); }
    } else {
      const { error } = await supabase.from('breeds').insert(breedForm);
      if (error) toast(t('admin.breedSaveFailed'), 'error');
      else { toast(t('admin.breedSaved'), 'success'); refreshBreeds(); }
    }
    setSavingBreed(false);
    setShowBreedForm(false);
  };

  const refreshBreeds = async () => {
    const { data } = await supabase.from('breeds').select('*').order('name', { ascending: true });
    setBreeds(data as Breed[] ?? []);
  };

  const handleDeleteBreed = async (id: string) => {
    const { error } = await supabase.from('breeds').delete().eq('id', id);
    if (error) toast(t('admin.breedDeleteFailed'), 'error');
    else { toast(t('admin.breedDeleted'), 'success'); refreshBreeds(); }
  };

  const filteredUsers = users.filter((u) => !search || u.full_name.toLowerCase().includes(search.toLowerCase()));
  const filteredBreeds = breeds.filter((b) => !search || b.name.toLowerCase().includes(search.toLowerCase()));

  const tabs: { id: Tab; label: string; icon: typeof Users; count: number }[] = [
    { id: 'users', label: t('admin.users'), icon: Users, count: users.length },
    { id: 'breeds', label: t('admin.breeds'), icon: Database, count: breeds.length },
    { id: 'logs', label: t('admin.logs'), icon: ScrollText, count: logs.length },
  ];

  return (
    <div>
      <PageHeader title={t('admin.title')} subtitle={t('admin.subtitle')} />

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-thin">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#0f1714] border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      {tab !== 'logs' && (
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder={tab === 'users' ? t('admin.searchUsers') : t('admin.searchBreeds')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#0f1714] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : tab === 'users' ? (
        <Card>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                  {u.full_name?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{u.full_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.organization || u.region || '—'}</p>
                </div>
                <Badge color={roleColors[u.role]}>{u.role}</Badge>
                <span className="text-xs text-gray-400 hidden sm:block">{new Date(u.created_at).toLocaleDateString()}</span>
              </div>
            ))}
            {filteredUsers.length === 0 && <EmptyState icon={<Users className="w-7 h-7" />} title={t('admin.noUsers')} />}
          </div>
        </Card>
      ) : tab === 'breeds' ? (
        <Card>
          <CardHeader
            title={t('admin.breedMaster')}
            subtitle={`${breeds.length} ${t('admin.breedMasterSubtitle')}`}
            action={
              <Button size="sm" onClick={() => { setEditBreed(undefined); setBreedForm({ species: 'cattle' }); setShowBreedForm(true); }}>
                <Plus className="w-4 h-4" /> {t('admin.addBreed')}
              </Button>
            }
          />
          <div className="p-5 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredBreeds.map((b) => (
                <div key={b.id} className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                        <PawPrint className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{b.name}</p>
                        <Badge color={b.species === 'buffalo' ? 'blue' : 'green'}>{b.species}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditBreed(b); setBreedForm(b); setShowBreedForm(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-accent-600 hover:bg-accent-50 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteBreed(b.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-error-600 hover:bg-error-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {b.origin_state && <p className="text-xs text-gray-500 mt-2">{b.origin_state}</p>}
                  {b.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{b.description}</p>}
                </div>
              ))}
            </div>
            {filteredBreeds.length === 0 && <EmptyState icon={<Database className="w-7 h-7" />} title={t('admin.noBreeds')} />}
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader title={t('admin.systemLogs')} subtitle={t('admin.systemLogsSubtitle')} />
          <div className="p-5 pt-3">
            {logs.length === 0 ? (
              <EmptyState icon={<ScrollText className="w-7 h-7" />} title={t('admin.noLogs')} />
            ) : (
              <div className="space-y-1 max-h-[500px] overflow-y-auto scrollbar-thin">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{log.action}</p>
                      {log.details && <p className="text-xs text-gray-500 dark:text-gray-400">{log.details}</p>}
                      <p className="text-[11px] text-gray-400 mt-0.5">{new Date(log.created_at).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Breed form modal */}
      {showBreedForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg card shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-display font-bold text-lg">{editBreed ? t('admin.editBreed') : t('admin.addBreed')}</h2>
              <button onClick={() => setShowBreedForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('admin.breedName')}</label>
                  <input value={breedForm.name ?? ''} onChange={(e) => setBreedForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0f1714] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40" placeholder="Gir" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('form.species')}</label>
                  <select value={breedForm.species ?? 'cattle'} onChange={(e) => setBreedForm((f) => ({ ...f, species: e.target.value as 'cattle' | 'buffalo' }))} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0f1714] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40">
                    <option value="cattle">Cattle</option>
                    <option value="buffalo">Buffalo</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('admin.originState')}</label>
                  <input value={breedForm.origin_state ?? ''} onChange={(e) => setBreedForm((f) => ({ ...f, origin_state: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0f1714] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40" placeholder="Gujarat" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('admin.colorPattern')}</label>
                  <input value={breedForm.color_pattern ?? ''} onChange={(e) => setBreedForm((f) => ({ ...f, color_pattern: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0f1714] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40" placeholder="Red to white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('admin.description')}</label>
                <textarea rows={2} value={breedForm.description ?? ''} onChange={(e) => setBreedForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0f1714] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('admin.characteristics')}</label>
                <textarea rows={2} value={breedForm.characteristics ?? ''} onChange={(e) => setBreedForm((f) => ({ ...f, characteristics: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0f1714] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 resize-none" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleBreedSave} disabled={savingBreed || !breedForm.name} className="flex-1">
                  {savingBreed ? <><Spinner className="w-4 h-4" /> {t('form.saving')}</> : t('admin.saveBreed')}
                </Button>
                <Button variant="outline" onClick={() => setShowBreedForm(false)}>{t('form.cancel')}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
