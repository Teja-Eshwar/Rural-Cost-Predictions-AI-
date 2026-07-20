import { ArrowDownRight, ArrowUpRight, Bell, Calendar, ChevronRight, Lightbulb, Plus, TrendingUp, Wallet } from 'lucide-react';
import { useStore } from '../lib/store';
import { computeAnalytics, computeAISummary, computeRiskScore, computeForecast, riskLevelFromScore } from '../lib/ai';
import { formatMoney, formatDateShort } from '../lib/format';
import { Card, StatCard, RiskMeter, EmptyState } from '../components/ui';
import { AreaChart } from '../components/charts';
import { Tab } from '../components/BottomNav';

export default function HomeScreen({ onNav }: { onNav: (t: Tab) => void }) {
  const { t, transactions, profile, alerts } = useStore();
  const a = computeAnalytics(transactions);
  const summary = computeAISummary(transactions);
  const score = computeRiskScore(transactions);
  const level = riskLevelFromScore(score);
  const forecast = computeForecast(transactions, 7);
  const unread = alerts.filter((al) => !al.read).length;

  const toneClass = summary.tone === 'good' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : summary.tone === 'warn' ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-rose-50 text-rose-700 border-rose-200';

  const last7 = forecast.map((f) => f.balance);
  const last7Labels = forecast.map((f) => formatDateShort(f.date));

  const quickActions = [
    { label: t('add_income'), icon: ArrowUpRight, tone: 'text-emerald-600 bg-emerald-50', tab: 'add' as Tab },
    { label: t('add_expense'), icon: ArrowDownRight, tone: 'text-rose-600 bg-rose-50', tab: 'add' as Tab },
    { label: t('view_predictions'), icon: TrendingUp, tone: 'text-sky-600 bg-sky-50', tab: 'forecast' as Tab },
    { label: t('reports_btn'), icon: Calendar, tone: 'text-violet-600 bg-violet-50', tab: 'forecast' as Tab },
  ];

  return (
    <div className="px-4 py-4 space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('welcome_back')}</p>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{profile?.owner_name || profile?.business_name || t('home')}</h1>
        </div>
        <button onClick={() => onNav('alerts')} className="relative w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
          <Bell size={18} className="text-slate-600 dark:text-slate-300" />
          {unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-semibold">{unread}</span>}
        </button>
      </div>

      {/* Balance card */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-600 to-sky-700 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -right-10 top-10 w-20 h-20 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2 text-white/80 text-xs">
            <Wallet size={14} /> {t('balance')}
          </div>
          <p className="text-3xl font-bold mt-1">{formatMoney(a.balance)}</p>
          <div className="flex gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1"><ArrowUpRight size={14} /> {t('today_income')}: {formatMoney(a.todayIncome)}</div>
            <div className="flex items-center gap-1"><ArrowDownRight size={14} /> {t('today_expense')}: {formatMoney(a.todayExpense)}</div>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className={`rounded-2xl p-4 border ${toneClass} dark:bg-slate-800/60`}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center shrink-0">
            <Lightbulb size={16} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{t('ai_summary')}</p>
            <p className="text-sm font-medium mt-0.5">{summary.text}</p>
          </div>
        </div>
      </div>

      {/* Risk meter + prediction */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 flex flex-col items-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 self-start mb-1">{t('risk_score')}</p>
          <RiskMeter score={score} />
          <span className={`text-xs mt-1 px-2 py-0.5 rounded-full ${level === 'low' ? 'bg-emerald-100 text-emerald-700' : level === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
            {level === 'low' ? t('low_risk') : level === 'medium' ? t('medium_risk') : t('high_risk')}
          </span>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('predicted_cashflow')}</p>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('next_7')}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{formatMoney(forecast[forecast.length - 1]?.balance ?? 0)}</p>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
            <span>+{formatMoney(forecast.reduce((s, f) => s + f.income, 0))}</span>
            <span>-{formatMoney(forecast.reduce((s, f) => s + f.expense, 0))}</span>
          </div>
          <button onClick={() => onNav('forecast')} className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-0.5">
            {t('view_predictions')} <ChevronRight size={12} />
          </button>
        </Card>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label={t('week_income')} value={formatMoney(a.weekIncome)} tone="green" icon={<ArrowUpRight size={18} />} />
        <StatCard label={t('week_expense')} value={formatMoney(a.weekExpense)} tone="red" icon={<ArrowDownRight size={18} />} />
        <StatCard label={t('month_income')} value={formatMoney(a.monthIncome)} tone="green" icon={<ArrowUpRight size={18} />} />
        <StatCard label={t('month_expense')} value={formatMoney(a.monthExpense)} tone="red" icon={<ArrowDownRight size={18} />} />
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('next_7')} — {t('predicted_balance')}</p>
        </div>
        {transactions.length === 0 ? (
          <EmptyState title={t('no_data')} subtitle={t('add_first')} icon={<TrendingUp size={28} />} />
        ) : (
          <AreaChart labels={last7Labels} values={last7} color="#10b981" height={160} />
        )}
      </Card>

      {/* Net profit */}
      <Card className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('net_profit')} ({t('month')})</p>
          <p className={`text-xl font-bold ${a.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatMoney(a.netProfit)}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${a.netProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {a.netProfit >= 0 ? 'Profit' : 'Loss'}
        </div>
      </Card>

      {/* Quick actions */}
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('quick_actions')}</p>
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((q) => (
            <button key={q.label} onClick={() => onNav(q.tab)} className="flex flex-col items-center gap-1.5">
              <span className={`w-12 h-12 rounded-2xl flex items-center justify-center ${q.tone}`}><q.icon size={20} /></span>
              <span className="text-[10px] text-center text-slate-600 dark:text-slate-300 leading-tight">{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => onNav('add')} className="w-full py-3 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-600 text-sm font-medium flex items-center justify-center gap-2 hover:bg-emerald-50 transition">
        <Plus size={16} /> {t('add')} {t('income').toLowerCase()}/{t('expense').toLowerCase()}
      </button>
    </div>
  );
}
