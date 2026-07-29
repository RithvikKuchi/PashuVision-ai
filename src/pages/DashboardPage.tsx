import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ScanLine, Database, History, TrendingUp, ArrowRight, Activity,
  PawPrint, Award, Clock,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { PageHeader } from '@/components/AppLayout';
import { Card, CardHeader, Skeleton, ConfidenceBar, Badge, EmptyState } from '@/components/ui';
import type { Prediction, Animal, ActivityLog } from '@/types';

const PIE_COLORS = ['#059669', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function DashboardPage() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ animals: 0, predictions: 0, avgConfidence: 0, todayCount: 0 });
  const [recentPredictions, setRecentPredictions] = useState<Prediction[]>([]);
  const [breedDist, setBreedDist] = useState<{ name: string; value: number }[]>([]);
  const [dailyData, setDailyData] = useState<{ day: string; predictions: number }[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    (async () => {
      const [animalsRes, predsRes, recentRes, breedRes, logsRes] = await Promise.all([
        supabase.from('animals').select('id', { count: 'exact', head: true }),
        supabase.from('predictions').select('confidence, created_at', { count: 'exact', head: false }),
        supabase.from('predictions').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('predictions').select('predicted_breed'),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(6),
      ]);

      const preds = predsRes.data as Prediction[] ?? [];
      const today = new Date().toDateString();
      const todayCount = preds.filter((p) => new Date(p.created_at).toDateString() === today).length;
      const avgConf = preds.length ? Math.round(preds.reduce((a, p) => a + p.confidence, 0) / preds.length) : 0;

      setStats({
        animals: animalsRes.count ?? 0,
        predictions: predsRes.count ?? 0,
        avgConfidence: avgConf,
        todayCount,
      });
      setRecentPredictions(recentRes.data as Prediction[] ?? []);
      setLogs(logsRes.data as ActivityLog[] ?? []);

      // Breed distribution
      const breedMap = new Map<string, number>();
      (breedRes.data as Prediction[] ?? []).forEach((p) => {
        breedMap.set(p.predicted_breed, (breedMap.get(p.predicted_breed) ?? 0) + 1);
      });
      const dist = Array.from(breedMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
      setBreedDist(dist);

      // Daily predictions (last 7 days)
      const days: { day: string; predictions: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('en-US', { weekday: 'short' });
        const count = preds.filter((p) => new Date(p.created_at).toDateString() === d.toDateString()).length;
        days.push({ day: label, predictions: count });
      }
      setDailyData(days);

      setLoading(false);
    })();
  }, []);

  const statCards = [
    { label: t('dash.totalAnimals'), value: stats.animals, icon: Database, color: 'from-primary-500 to-primary-700', link: '/app/animals' },
    { label: t('dash.totalPredictions'), value: stats.predictions, icon: ScanLine, color: 'from-accent-500 to-accent-700', link: '/app/history' },
    { label: t('dash.avgConfidence'), value: `${stats.avgConfidence}%`, icon: Award, color: 'from-amber-500 to-orange-600', link: '/app/analytics' },
    { label: t('dash.predictionsToday'), value: stats.todayCount, icon: TrendingUp, color: 'from-violet-500 to-purple-600', link: '/app/history' },
  ];

  return (
    <div>
      <PageHeader
        title={`${t('dash.welcome')}, ${profile?.full_name?.split(' ')[0] ?? 'User'}`}
        subtitle={t('dash.overview')}
        action={
          <Link to="/app/predict" className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
            <ScanLine className="w-4 h-4" /> {t('dash.newRecognition')}
          </Link>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          : statCards.map((s) => (
              <Link key={s.label} to={s.link} className="card card-hover p-5 group">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-sm`}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="font-display font-bold text-2xl">{s.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              </Link>
            ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Daily predictions */}
        <Card className="lg:col-span-2">
          <CardHeader title={t('dash.dailyTitle')} subtitle={t('dash.dailySubtitle')} />
          <div className="p-5 pt-3 h-64">
            {loading ? <Skeleton className="h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-800" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="currentColor" className="text-gray-400" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="currentColor" className="text-gray-400" />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                    wrapperClassName="!rounded-xl"
                  />
                  <Bar dataKey="predictions" fill="#059669" radius={[6, 6, 0, 0]} name="Predictions" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Breed distribution */}
        <Card>
          <CardHeader title={t('dash.breedDist')} subtitle={t('dash.breedDistSubtitle')} />
          <div className="p-5 pt-3 h-64">
            {loading ? <Skeleton className="h-full" /> : breedDist.length === 0 ? (
              <EmptyState icon={<PawPrint className="w-7 h-7" />} title={t('dash.noData')} description={t('dash.noDataDesc')} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={breedDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {breedDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Recent predictions + activity */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title={t('dash.recentTitle')} subtitle={t('dash.recentSubtitle')} action={<Link to="/app/history" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">{t('dash.viewAll')}</Link>} />
          <div className="p-5 pt-3">
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : recentPredictions.length === 0 ? (
              <EmptyState
                icon={<ScanLine className="w-7 h-7" />}
                title={t('dash.noPredictions')}
                description={t('dash.noPredictionsDesc')}
                action={<Link to="/app/predict" className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">{t('dash.startRecognition')}</Link>}
              />
            ) : (
              <div className="space-y-2">
                {recentPredictions.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        <PawPrint className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{p.predicted_breed}</p>
                        <Badge color={p.species === 'buffalo' ? 'blue' : 'green'}>{p.species}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <ConfidenceBar value={p.confidence} />
                        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{p.confidence}%</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 hidden sm:flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Activity log */}
        <Card>
          <CardHeader title={t('dash.activityTitle')} subtitle={t('dash.activitySubtitle')} />
          <div className="p-5 pt-3">
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : logs.length === 0 ? (
              <EmptyState icon={<Activity className="w-7 h-7" />} title={t('dash.noActivity')} />
            ) : (
              <div className="space-y-1">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{log.action}</p>
                      {log.details && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{log.details}</p>}
                      <p className="text-[11px] text-gray-400 mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
