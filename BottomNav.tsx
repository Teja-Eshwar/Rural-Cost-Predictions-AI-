import { useMemo, useState } from 'react';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useStore } from '../lib/store';
import { computeForecast, ForecastDay } from '../lib/ai';
import { formatMoney, formatDate } from '../lib/format';
import { Card, Badge, EmptyState } from '../components/ui';
import { AreaChart, LineChart } from '../components/charts';

export function ForecastScreen() {
  const { t, transactions } = useStore();
  const [range, setRange] = useState<7 | 30>(7);
  const [chartType, setChartType] = useState<'line' | 'area'>('area');
  const forecast = useMemo(() => computeForecast(transactions, range), [transactions, range]);

  const labels = forecast.map((f) => formatDate(f.date).slice(0, 6));
  const balances = forecast.map((f) => f.balance);
  const incomes = forecast.map((f) => f.income);
  const expenses = forecast.map((f) => f.expense);

  const totalIncome = incomes.reduce((s, v) => s + v, 0);
  const totalExpense = expenses.reduce((s, v) => s + v, 0);
  const endBalance = balances[balances.length - 1] ?? 0;

  const aiText = useMemo(() => {
    const neg = forecast.find((f) => f.balance < 0);
    if (neg) return `Predicted cash shortage on ${formatDate(neg.date)}. Reduce expenses to avoid it.`;
    const low = forecast.find((f) => f.risk === 'medium' || f.risk === 'high');
    if (low) return `Moderate risk around ${formatDate(low.date)}. ${low.suggestedAction}`;
    return 'Cash flow projected to stay healthy. No action needed.';
  }, [forecast]);

  return (
    <div className="px-4 py-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('forecast')}</h1>

      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        {([7, 30] as const).map((r) => (
          <button key={r} onClick={() => setRange(r)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${range === r ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}>
            {r === 7 ? t('next_7') : t('next_30')}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {(['area', 'line'] as const).map((c) => (
          <button key={c} onClick={() => setChartType(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${chartType === c ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {c === 'area' ? t('area_chart') : t('line_chart')}
          </button>
        ))}
      </div>

      {transactions.length === 0 ? (
        <EmptyState title={t('no_data')} subtitle={t('add_first')} icon={<TrendingUp size={28} />} />
      ) : (
        <>
          <Card className="p-4">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('predicted_cashflow')}</p>
            {chartType === 'area' ? (
              <AreaChart labels={labels} values={balances} color="#0ea5e9" height={200} />
            ) : (
              <LineChart labels={labels} series={[
                { label: 'Balance', color: '#0ea5e9', values: balances },
                { label: 'Income', color: '#10b981', values: incomes },
                { label: 'Expense', color: '#ef4444', values: expenses },
              ]} height={200} />
            )}
          </Card>

          <div className="grid grid-cols-3 gap-2">
            <Card className="p-3 text-center">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('expected_balance')}</p>
              <p className="text-sm font-bold text-sky-600 mt-1">{formatMoney(endBalance)}</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('expected_income')}</p>
              <p className="text-sm font-bold text-emerald-600 mt-1">{formatMoney(totalIncome)}</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('expected_expense')}</p>
              <p className="text-sm font-bold text-rose-600 mt-1">{formatMoney(totalExpense)}</p>
            </Card>
          </div>

          <Card className="p-4 bg-sky-50 dark:bg-slate-800 border-sky-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center"><TrendingUp size={16} className="text-sky-600" /></div>
              <div>
                <p className="text-xs font-semibold uppercase text-sky-700">{t('ai_explanation')}</p>
                <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5">{aiText}</p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export function CalendarScreen() {
  const { t, transactions } = useStore();
  const forecast = useMemo(() => computeForecast(transactions, 30), [transactions]);
  const [selected, setSelected] = useState<ForecastDay | null>(forecast[0] ?? null);
  const [monthOffset, setMonthOffset] = useState(0);

  const today = new Date();
  const viewDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const forecastByDate = new Map(forecast.map((f) => [f.date, f]));

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const green = forecast.filter((f) => f.risk === 'low').length;
  const amber = forecast.filter((f) => f.risk === 'medium').length;
  const red = forecast.filter((f) => f.risk === 'high').length;

  const colorFor = (dateStr: string | undefined) => {
    if (!dateStr) return 'bg-slate-50 dark:bg-slate-800 text-slate-400';
    const f = forecastByDate.get(dateStr);
    if (!f) return 'bg-slate-50 dark:bg-slate-800 text-slate-400';
    return f.risk === 'low' ? 'bg-emerald-100 text-emerald-700' : f.risk === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('calendar')}</h1>

      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center"><p className="text-[10px] text-slate-500">{t('green_days')}</p><p className="text-lg font-bold text-emerald-600">{green}</p></Card>
        <Card className="p-3 text-center"><p className="text-[10px] text-slate-500">{t('amber_days')}</p><p className="text-lg font-bold text-amber-600">{amber}</p></Card>
        <Card className="p-3 text-center"><p className="text-[10px] text-slate-500">{t('red_days')}</p><p className="text-lg font-bold text-rose-600">{red}</p></Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setMonthOffset((m) => m - 1)} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center"><ChevronLeft size={16} /></button>
          <p className="font-semibold text-slate-700 dark:text-slate-200">{viewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
          <button onClick={() => setMonthOffset((m) => m + 1)} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center"><ChevronRight size={16} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400 mb-1">
          {['S','M','T','W','T','F','S'].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            const dateStr = d ? new Date(year, month, d).toISOString().slice(0, 10) : undefined;
            const isSelected = selected?.date === dateStr;
            return (
              <button
                key={i}
                disabled={!d}
                onClick={() => { if (dateStr) { const f = forecastByDate.get(dateStr); if (f) setSelected(f); } }}
                className={`aspect-square rounded-lg text-xs font-medium flex items-center justify-center ${d ? colorFor(dateStr) : ''} ${isSelected ? 'ring-2 ring-slate-700' : ''}`}
              >
                {d ?? ''}
              </button>
            );
          })}
        </div>
      </Card>

      {selected && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-800 dark:text-slate-100">{formatDate(selected.date)}</p>
            <Badge tone={selected.risk === 'low' ? 'green' : selected.risk === 'medium' ? 'amber' : 'red'}>
              {selected.risk === 'low' ? t('low_risk') : selected.risk === 'medium' ? t('medium_risk') : t('high_risk')}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className="text-[10px] text-slate-500">{t('predicted_balance')}</p><p className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatMoney(selected.balance)}</p></div>
            <div><p className="text-[10px] text-slate-500">{t('expected_income')}</p><p className="text-sm font-bold text-emerald-600">{formatMoney(selected.income)}</p></div>
            <div><p className="text-[10px] text-slate-500">{t('expected_expense')}</p><p className="text-sm font-bold text-rose-600">{formatMoney(selected.expense)}</p></div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('risk_reason')}</p>
            <p className="text-sm text-slate-700 dark:text-slate-200">{selected.riskReason}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('suggested_action')}</p>
            <p className="text-sm text-slate-700 dark:text-slate-200">{selected.suggestedAction}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
