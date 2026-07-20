import { useMemo, useState } from 'react';
import { BarChart3, Download, FileText, LogOut, MapPin, Phone, Settings as SettingsIcon, User, Building2, ChevronRight, Moon, Bell, Shield, Database } from 'lucide-react';
import { useStore } from '../lib/store';
import { computeAnalytics, computeRiskScore } from '../lib/ai';
import { formatMoney, formatDate } from '../lib/format';
import { LANGS, Lang } from '../lib/i18n';
import { Card, Button, Input, Select, Toggle, Badge, EmptyState } from '../components/ui';
import { BarChart, LineChart } from '../components/charts';
import { Tab } from '../components/BottomNav';

export function ReportsScreen() {
  const { t, transactions } = useStore();
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  const grouped = useMemo(() => {
    const now = new Date();
    const buckets: Record<string, { income: number; expense: number; profit: number; risk: number }> = {};
    const span = period === 'month' ? 6 : period === 'quarter' ? 4 : 12;
    for (let i = span - 1; i >= 0; i--) {
      const d = new Date(now);
      if (period === 'month') d.setMonth(d.getMonth() - i);
      else if (period === 'quarter') d.setMonth(d.getMonth() - i * 3);
      else d.setFullYear(d.getFullYear() - i);
      const key = d.toLocaleDateString('en-IN', period === 'year' ? { year: 'numeric' } : period === 'quarter' ? { month: 'short', year: '2-digit' } : { month: 'short' });
      buckets[key] = { income: 0, expense: 0, profit: 0, risk: 0 };
    }
    for (const tx of transactions) {
      const d = new Date(tx.date);
      let key = '';
      if (period === 'month') key = d.toLocaleDateString('en-IN', { month: 'short' });
      else if (period === 'quarter') {
        const q = Math.floor(d.getMonth() / 3);
        key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      } else key = String(d.getFullYear());
      // assign to nearest bucket
      const keys = Object.keys(buckets);
      const closest = keys.reduce((best, k) => {
        const bd = new Date(k + (period === 'year' ? '' : ' 1'));
        return Math.abs(bd.getTime() - d.getTime()) < Math.abs(new Date(best + (period === 'year' ? '' : ' 1')).getTime() - d.getTime()) ? k : best;
      }, keys[0]);
      if (tx.type === 'income') buckets[closest].income += Number(tx.amount);
      else buckets[closest].expense += Number(tx.amount);
    }
    Object.keys(buckets).forEach((k) => {
      buckets[k].profit = buckets[k].income - buckets[k].expense;
      const subset = transactions.filter((tx) => {
        const d = new Date(tx.date);
        const bk = d.toLocaleDateString('en-IN', { month: 'short' });
        return bk === k;
      });
      buckets[k].risk = computeRiskScore(subset);
    });
    return buckets;
  }, [transactions, period]);

  const labels = Object.keys(grouped);
  const income = labels.map((k) => grouped[k].income);
  const expense = labels.map((k) => grouped[k].expense);
  const profit = labels.map((k) => grouped[k].profit);
  const risk = labels.map((k) => grouped[k].risk);

  const exportReport = (format: 'pdf' | 'excel') => {
    const rows = labels.map((k) => `${k},${grouped[k].income},${grouped[k].expense},${grouped[k].profit},${grouped[k].risk}`).join('\n');
    const header = 'Period,Income,Expense,Profit,Risk\n';
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ruralcash-report-${period}.${format === 'pdf' ? 'csv' : 'xls'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('reports')}</h1>

      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        {(['month', 'quarter', 'year'] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition ${period === p ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}>
            {p === 'month' ? t('monthly_report') : p === 'quarter' ? t('quarterly_report') : t('annual_report')}
          </button>
        ))}
      </div>

      {transactions.length === 0 ? (
        <EmptyState title={t('no_data')} subtitle={t('add_first')} icon={<BarChart3 size={28} />} />
      ) : (
        <>
          <Card className="p-4">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('income_trend')} vs {t('expense_trend')}</p>
            <BarChart labels={labels} values={income} color="#10b981" height={180} />
          </Card>

          <Card className="p-4">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('profit_trend')}</p>
            <BarChart labels={labels} values={profit} color="#0ea5e9" height={180} />
          </Card>

          <Card className="p-4">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('risk_trend')}</p>
            <LineChart labels={labels} series={[{ label: 'Risk', color: '#ef4444', values: risk }]} height={180} />
          </Card>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => exportReport('pdf')} className="flex-1 flex items-center justify-center gap-2"><FileText size={16} /> {t('export_pdf')}</Button>
            <Button variant="ghost" onClick={() => exportReport('excel')} className="flex-1 flex items-center justify-center gap-2"><Download size={16} /> {t('export_excel')}</Button>
          </div>
        </>
      )}
    </div>
  );
}

export function ProfileScreen({ onNav }: { onNav: (t: Tab) => void }) {
  const { t, profile, updateProfile, signOut, lang, setLang } = useStore();
  const [form, setForm] = useState({
    business_name: profile?.business_name ?? '',
    owner_name: profile?.owner_name ?? '',
    business_type: profile?.business_type ?? 'Micro-enterprise',
    location: profile?.location ?? '',
    phone: profile?.phone ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({ ...form, language: lang });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const businessTypes = ['Micro-enterprise', 'Small Shop', 'Farmer', 'Tailor', 'Dairy', 'Self-employed', 'Other'];

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-600 flex items-center justify-center text-white text-xl font-bold">
          {(form.owner_name || form.business_name || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">{form.owner_name || 'Owner'}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{form.business_name || t('business_name')}</p>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2"><Building2 size={16} /> {t('business_name')}</p>
        <Input label={t('business_name')} value={form.business_name} onChange={(v) => setForm({ ...form, business_name: v })} />
        <Input label={t('owner_name')} value={form.owner_name} onChange={(v) => setForm({ ...form, owner_name: v })} />
        <Select label={t('business_type')} value={form.business_type} onChange={(v) => setForm({ ...form, business_type: v })} options={businessTypes.map((b) => ({ value: b, label: b }))} />
        <Input label={t('location')} value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="Village, District" />
        <Input label={t('phone_number')} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="98765 43210" />
        <label className="block">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">{t('preferred_language')}</span>
          <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
            {LANGS.map((l) => <option key={l.code} value={l.code}>{l.native} ({l.label})</option>)}
          </select>
        </label>
        <Button onClick={save} disabled={saving} className="w-full">{saving ? t('loading') : t('save')}</Button>
        {saved && <p className="text-xs text-emerald-600 text-center">Saved!</p>}
      </Card>

      {/* Quick links */}
      <Card className="divide-y divide-slate-100 dark:divide-slate-700">
        {[
          { icon: BarChart3, label: t('reports'), tab: 'forecast' as Tab },
          { icon: SettingsIcon, label: t('settings'), tab: 'profile' as Tab },
        ].map((item) => (
          <button key={item.label} onClick={() => onNav(item.tab)} className="w-full flex items-center justify-between p-3.5">
            <span className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200"><item.icon size={18} className="text-slate-500" /> {item.label}</span>
            <ChevronRight size={16} className="text-slate-400" />
          </button>
        ))}
        <button onClick={() => { if (confirm(t('sign_out_confirm'))) signOut(); }} className="w-full flex items-center gap-3 p-3.5 text-sm text-rose-600">
          <LogOut size={18} /> {t('logout')}
        </button>
      </Card>
    </div>
  );
}

export function SettingsScreen() {
  const { t, profile, updateProfile, signOut, lang, setLang } = useStore();
  const dark = profile?.dark_mode ?? false;
  const notify = profile?.notify_enabled ?? true;

  return (
    <div className="px-4 py-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('settings')}</h1>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200"><Moon size={16} /> Appearance</div>
        <Toggle checked={dark} onChange={(v) => updateProfile({ dark_mode: v })} label={t('dark_mode')} />
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200"><User size={16} /> {t('preferred_language')}</div>
        <div className="grid grid-cols-2 gap-2">
          {LANGS.map((l) => (
            <button key={l.code} onClick={() => setLang(l.code)} className={`p-3 rounded-xl text-sm font-medium border transition ${lang === l.code ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
              <p>{l.native}</p>
              <p className="text-[10px] opacity-70">{l.label}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200"><Bell size={16} /> {t('notification_settings')}</div>
        <Toggle checked={notify} onChange={(v) => updateProfile({ notify_enabled: v })} label="Enable alerts & notifications" />
      </Card>

      <Card className="divide-y divide-slate-100 dark:divide-slate-700">
        <button className="w-full flex items-center justify-between p-3.5">
          <span className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200"><Shield size={18} className="text-slate-500" /> {t('security_settings')}</span>
          <ChevronRight size={16} className="text-slate-400" />
        </button>
        <button className="w-full flex items-center justify-between p-3.5">
          <span className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200"><Database size={18} className="text-slate-500" /> {t('backup_restore')}</span>
          <ChevronRight size={16} className="text-slate-400" />
        </button>
        <button onClick={() => { if (confirm(t('sign_out_confirm'))) signOut(); }} className="w-full flex items-center gap-3 p-3.5 text-sm text-rose-600">
          <LogOut size={18} /> {t('logout')}
        </button>
      </Card>
    </div>
  );
}
