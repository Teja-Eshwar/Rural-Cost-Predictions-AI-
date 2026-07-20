import { useMemo } from 'react';
import { AlertTriangle, Bell, CheckCircle2, Info, Lightbulb, ShieldAlert, TrendingDown } from 'lucide-react';
import { useStore } from '../lib/store';
import { computeRiskAnalysis, computeRecommendations } from '../lib/ai';
import { formatDate } from '../lib/format';
import { Card, Badge, RiskMeter, EmptyState } from '../components/ui';
import { LineChart } from '../components/charts';

export function RiskScreen() {
  const { t, transactions } = useStore();
  const risk = useMemo(() => computeRiskAnalysis(transactions), [transactions]);

  const trendLabels = risk.trend.map((p) => formatDate(p.date).slice(0, 6));
  const trendValues = risk.trend.map((p) => p.score);

  return (
    <div className="px-4 py-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('risk')}</h1>

      <Card className="p-5 flex flex-col items-center">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t('risk_score')}</p>
        <RiskMeter score={risk.score} />
        <Badge tone={risk.level === 'low' ? 'green' : risk.level === 'medium' ? 'amber' : 'red'}>
          {risk.level === 'low' ? t('low_risk') : risk.level === 'medium' ? t('medium_risk') : t('high_risk')}
        </Badge>
      </Card>

      <Card className="p-4">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">{t('risk_contributors')}</p>
        <div className="space-y-3">
          {risk.contributors.map((c) => (
            <div key={c.key}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-200">{c.label}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{c.value}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                <div
                  className={`h-full rounded-full ${c.value > 60 ? 'bg-rose-500' : c.value > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${c.value}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{c.detail}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('risk_trend')} (14 days)</p>
        {transactions.length === 0 ? (
          <EmptyState title={t('no_data')} icon={<TrendingDown size={24} />} />
        ) : (
          <LineChart labels={trendLabels} series={[{ label: 'Risk', color: '#ef4444', values: trendValues }]} height={180} />
        )}
      </Card>

      <Card className="p-4 bg-amber-50 dark:bg-slate-800 border-amber-100">
        <div className="flex items-start gap-3">
          <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold uppercase text-amber-700">{t('ai_risk_explanation')}</p>
            <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5">{risk.explanation}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function RecommendationsScreen() {
  const { t, transactions } = useStore();
  const recs = useMemo(() => computeRecommendations(transactions), [transactions]);

  const priorityTone: Record<string, 'red' | 'amber' | 'green'> = { high: 'red', medium: 'amber', low: 'green' };

  return (
    <div className="px-4 py-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('recommendations')}</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">AI-generated suggestions to improve your financial health.</p>

      {recs.length === 0 ? (
        <EmptyState title={t('no_data')} subtitle={t('add_first')} icon={<Lightbulb size={28} />} />
      ) : (
        <div className="space-y-3">
          {recs.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${r.priority === 'high' ? 'bg-rose-50 text-rose-600' : r.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  <Lightbulb size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{r.title}</p>
                    <Badge tone={priorityTone[r.priority]}>{r.priority}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{r.detail}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{t('expected_impact')}:</span>
                    <span className="font-medium text-emerald-600">{r.expectedImpact}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function AlertsScreen() {
  const { t, alerts, markAlertRead } = useStore();

  const iconFor = (type: string) => {
    if (type === 'cash_shortage') return <AlertTriangle size={18} className="text-rose-600" />;
    if (type === 'high_risk') return <ShieldAlert size={18} className="text-rose-600" />;
    if (type === 'loan_due') return <Bell size={18} className="text-amber-600" />;
    if (type === 'expense_spike') return <TrendingDown size={18} className="text-amber-600" />;
    return <Info size={18} className="text-sky-600" />;
  };

  return (
    <div className="px-4 py-4 space-y-3">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('alerts')}</h1>
      {alerts.length === 0 ? (
        <EmptyState title="No alerts" subtitle="You're all caught up!" icon={<CheckCircle2 size={28} />} />
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <Card key={a.id} className={`p-3 flex items-start gap-3 ${!a.read ? 'border-l-4 border-l-emerald-500' : ''}`}>
              <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center shrink-0">
                {iconFor(a.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{a.title}</p>
                  <Badge tone={a.severity === 'high' ? 'red' : a.severity === 'medium' ? 'amber' : 'green'}>{a.severity}</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{a.body}</p>
                <p className="text-[10px] text-slate-400 mt-1">{formatDate(a.created_at)}</p>
              </div>
              {!a.read && (
                <button onClick={() => markAlertRead(a.id)} className="text-xs text-emerald-600 px-2 py-1 rounded bg-emerald-50 shrink-0">Mark read</button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
