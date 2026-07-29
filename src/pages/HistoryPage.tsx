import { useEffect, useState, useCallback } from 'react';
import { Search, Trash2, ChevronLeft, ChevronRight, History, Clock, Filter, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useI18n } from '@/context/I18nContext';
import { PageHeader } from '@/components/AppLayout';
import { Card, ConfidenceBar, Badge, Skeleton, EmptyState, Button } from '@/components/ui';
import type { Prediction } from '@/types';

const PAGE_SIZE = 8;

export function HistoryPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<'all' | 'cattle' | 'buffalo'>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('predictions').select('*', { count: 'exact' });

    if (speciesFilter !== 'all') query = query.eq('species', speciesFilter);
    if (search.trim()) query = query.ilike('predicted_breed', `%${search.trim()}%`);

    query = query.order('created_at', { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const { data, count: c } = await query;
    setPredictions(data as Prediction[] ?? []);
    setCount(c ?? 0);
    setLoading(false);
  }, [page, search, speciesFilter]);

  useEffect(() => { fetchPredictions(); }, [fetchPredictions]);

  const totalPages = Math.ceil(count / PAGE_SIZE);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('predictions').delete().eq('id', id);
    if (error) {
      toast(t('history.deleteFailed'), 'error');
    } else {
      toast(t('history.deleted'), 'success');
      fetchPredictions();
    }
    setConfirmDelete(null);
  };

  return (
    <div>
      <PageHeader title={t('history.title')} subtitle={`${count} ${t('history.total')}${count !== 1 ? 's' : ''} recorded.`} />

      {/* Filters */}
      <Card className="mb-4">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('history.search')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(0); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            {(['all', 'cattle', 'buffalo'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setSpeciesFilter(s); setPage(0); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  speciesFilter === s
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {s === 'all' ? t('history.all') : s === 'cattle' ? t('history.cattle') : t('history.buffalo')}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* List */}
      <Card>
        {loading ? (
          <div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : predictions.length === 0 ? (
          <EmptyState
            icon={<History className="w-7 h-7" />}
            title={t('history.noResults')}
            description={search || speciesFilter !== 'all' ? t('history.noResultsDesc') : 'Run your first breed recognition to see history here.'}
          />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {predictions.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gray-200 dark:border-gray-800" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <History className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{p.predicted_breed}</p>
                    <Badge color={p.species === 'buffalo' ? 'blue' : 'green'}>{p.species}</Badge>
                    <Badge color={p.confidence >= 85 ? 'green' : p.confidence >= 60 ? 'amber' : 'red'}>
                      {p.confidence}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex-1 max-w-xs"><ConfidenceBar value={p.confidence} /></div>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(p.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                {confirmDelete === p.id ? (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="danger" onClick={() => handleDelete(p.id)}>Delete</Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(p.id)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('history.page')} {page + 1} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
