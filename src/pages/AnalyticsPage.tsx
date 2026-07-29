import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend, LineChart, Line, Area, AreaChart,
} from 'recharts';
import { BarChart3, TrendingUp, Award, Calendar, PawPrint } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/AppLayout';
import { Card, CardHeader, Skeleton, EmptyState } from '@/components/ui';
import type { Prediction } from '@/types';
import { useI18n } from '@/context/I18nContext';

const PIE_COLORS = ['#059669', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

export function AnalyticsPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [breedDist, setBreedDist] = useState<{ name: string; value: number }[]>([]);
  const [dailyData, setDailyData] = useState<{ day: string; predictions: number; avgConf: number }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; predictions: number }[]>([]);
  const [confidenceBuckets, setConfidenceBuckets] = useState<{ range: string; count: number }[]>([]);
  const [summary, setSummary] = useState({ total: 0, avgConf: 0, highConf: 0, cattle: 0, buffalo: 0 });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('predictions').select('*').order('created_at', { ascending: false });
      const preds = data as Prediction[] ?? [];
      setPredictions(preds);

      // Breed distribution
      const breedMap = new Map<string, number>();
      preds.forEach((p) => breedMap.set(p.predicted_breed, (breedMap.get(p.predicted_breed) ?? 0) + 1));
      setBreedDist(Array.from(breedMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10));

      // Daily (14 days)
      const days: { day: string; predictions: number; avgConf: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dayPreds = preds.filter((p) => new Date(p.created_at).toDateString() === d.toDateString());
        days.push({
          day: d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
          predictions: dayPreds.length,
          avgConf: dayPreds.length ? Math.round(dayPreds.reduce((a, p) => a + p.confidence, 0) / dayPreds.length) : 0,
        });
      }
      setDailyData(days);

      // Monthly (6 months)
      const months: { month: string; predictions: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const monthPreds = preds.filter((p) => {
          const pd = new Date(p.created_at);
          return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
        });
        months.push({ month: d.toLocaleDateString('en-US', { month: 'short' }), predictions: monthPreds.length });
      }
      setMonthlyData(months);

      // Confidence buckets
      const buckets = [
        { range: '90-100%', min: 90, count: 0 },
        { range: '75-89%', min: 75, max: 90, count: 0 },
        { range: '60-74%', min: 60, max: 75, count: 0 },
        { range: 'Below 60%', min: 0, max: 60, count: 0 },
      ];
      preds.forEach((p) => {
        if (p.confidence >= 90) buckets[0].count++;
        else if (p.confidence >= 75) buckets[1].count++;
        else if (p.confidence >= 60) buckets[2].count++;
        else buckets[3].count++;
      });
      setConfidenceBuckets(buckets.map(({ range, count }) => ({ range, count })));

      // Summary
      setSummary({
        total: preds.length,
        avgConf: preds.length ? Math.round(preds.reduce((a, p) => a + p.confidence, 0) / preds.length) : 0,
        highConf: preds.filter((p) => p.confidence >= 85).length,
        cattle: preds.filter((p) => p.species === 'cattle').length,
        buffalo: preds.filter((p) => p.species === 'buffalo').length,
      });

      setLoading(false);
    })();
  }, []);

  const summaryCards = [
    { label: t('analytics.totalPredictions'), value: summary.total, icon: BarChart3, color: 'from-primary-500 to-primary-700' },
    { label: t('analytics.avgConfidence'), value: `${summary.avgConf}%`, icon: Award, color: 'from-amber-500 to-orange-600' },
    { label: t('analytics.highConfidence'), value: summary.highConf, icon: TrendingUp, color: 'from-accent-500 to-accent-700' },
    { label: t('analytics.cattleVsBuffalo'), value: `${summary.cattle} : ${summary.buffalo}`, icon: PawPrint, color: 'from-violet-500 to-purple-600' },
  ];

  return (
    <div>
      <PageHeader title={t('analytics.title')} subtitle={t('analytics.subtitle')} />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          : summaryCards.map((s) => (
              <Card key={s.label} className="p-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-sm mb-3`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <p className="font-display font-bold text-2xl">{s.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              </Card>
            ))}
      </div>

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      ) : predictions.length === 0 ? (
        <Card>
          <EmptyState icon={<BarChart3 className="w-7 h-7" />} title={t('analytics.noData')} description={t('analytics.noDataDesc')} />
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Confidence trend + breed distribution */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader title={t('analytics.confidenceTrend')} subtitle={t('analytics.confidenceTrendSubtitle')} />
              <div className="p-5 pt-3 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-800" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="currentColor" className="text-gray-400" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="currentColor" className="text-gray-400" />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Area type="monotone" dataKey="avgConf" stroke="#059669" strokeWidth={2} fill="url(#confGrad)" name="Avg Confidence %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader title={t('analytics.breedDist')} subtitle={t('analytics.breedDistSubtitle')} />
              <div className="p-5 pt-3 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breedDist} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-800" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="currentColor" className="text-gray-400" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="currentColor" className="text-gray-400" width={70} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[0, 6, 6, 0]} name="Predictions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Predictions per day + monthly */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader title={t('analytics.dailyTitle')} subtitle={t('analytics.dailySubtitle')} />
              <div className="p-5 pt-3 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-800" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="currentColor" className="text-gray-400" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="currentColor" className="text-gray-400" />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="predictions" fill="#059669" radius={[6, 6, 0, 0]} name="Predictions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader title={t('analytics.monthlyTitle')} subtitle={t('analytics.monthlySubtitle')} />
              <div className="p-5 pt-3 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-800" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="currentColor" className="text-gray-400" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="currentColor" className="text-gray-400" />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Line type="monotone" dataKey="predictions" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6' }} name="Predictions" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Confidence distribution + species split */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader title={t('analytics.confidenceDist')} subtitle={t('analytics.confidenceDistSubtitle')} />
              <div className="p-5 pt-3 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={confidenceBuckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-800" />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} stroke="currentColor" className="text-gray-400" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="currentColor" className="text-gray-400" />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader title={t('analytics.speciesSplit')} subtitle={t('analytics.speciesSplitSubtitle')} />
              <div className="p-5 pt-3 h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ name: 'Cattle', value: summary.cattle }, { name: 'Buffalo', value: summary.buffalo }]}
                      dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      <Cell fill="#059669" />
                      <Cell fill="#0ea5e9" />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
