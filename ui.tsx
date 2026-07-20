import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Search, Trash2, X } from 'lucide-react';
import { useStore } from '../lib/store';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, CATEGORY_ICONS, Transaction } from '../lib/supabase';
import { formatMoney, formatDate, todayISO } from '../lib/format';
import { Button, Card, Input, Select, EmptyState } from '../components/ui';

export function AddTransactionScreen({ onDone }: { onDone: () => void }) {
  const { t, addTransaction } = useStore();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const save = async () => {
    setErr(null);
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setErr('Enter a valid amount.'); return; }
    setBusy(true);
    try {
      await addTransaction({ type, amount: amt, category, description, date });
      onDone();
    } catch (e: any) {
      setErr(e.message ?? 'Failed to save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('add')}</h1>
        <button onClick={onDone} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center"><X size={18} /></button>
      </div>

      {/* Type toggle */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <button
          onClick={() => { setType('income'); setCategory(INCOME_CATEGORIES[0]); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition ${type === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500'}`}
        >
          <ArrowUpRight size={16} /> {t('income')}
        </button>
        <button
          onClick={() => { setType('expense'); setCategory(EXPENSE_CATEGORIES[0]); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition ${type === 'expense' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500'}`}
        >
          <ArrowDownRight size={16} /> {t('expense')}
        </button>
      </div>

      <Card className="p-4 space-y-3">
        <Input label={t('amount')} value={amount} onChange={setAmount} type="number" placeholder="0" />
        <Select label={t('category')} value={category} onChange={setCategory} options={categories.map((c) => ({ value: c, label: `${CATEGORY_ICONS[c] ?? ''} ${c}` }))} />
        <Input label={t('description')} value={description} onChange={setDescription} placeholder="Optional note" />
        <Input label={t('date')} value={date} onChange={setDate} type="date" />

        {err && <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/30 rounded-lg px-3 py-2">{err}</p>}

        <Button onClick={save} disabled={busy} className="w-full">
          {busy ? t('loading') : t('save')}
        </Button>
      </Card>
    </div>
  );
}

export function HistoryScreen() {
  const { t, transactions, deleteTransaction, updateTransaction } = useStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editing, setEditing] = useState<Transaction | null>(null);

  const allCategories = useMemo(() => Array.from(new Set(transactions.map((t) => t.category))), [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (search && !`${t.description} ${t.category}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transactions, typeFilter, categoryFilter, search]);

  return (
    <div className="px-4 py-4 space-y-3">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('history')}</h1>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search')}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'income', 'expense'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${typeFilter === f ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
          >
            {f === 'all' ? 'All' : f === 'income' ? t('income') : t('expense')}
          </button>
        ))}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        >
          <option value="all">All categories</option>
          {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t('no_data')} subtitle={t('add_first')} icon={<Search size={28} />} />
      ) : (
        <div className="space-y-2">
          {filtered.map((tx) => (
            <Card key={tx.id} className="p-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${tx.type === 'income' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                {CATEGORY_ICONS[tx.category] ?? '📝'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{tx.category}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{tx.description || formatDate(tx.date)}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatMoney(Number(tx.amount))}
                </p>
                <p className="text-[10px] text-slate-400">{formatDate(tx.date)}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => setEditing(tx)} className="text-xs text-sky-600 px-2 py-0.5 rounded bg-sky-50">{t('edit')}</button>
                <button onClick={() => deleteTransaction(tx.id)} className="text-xs text-rose-600 px-2 py-0.5 rounded bg-rose-50"><Trash2 size={12} className="inline" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          tx={editing}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            await updateTransaction(editing.id, patch);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EditModal({ tx, onClose, onSave }: { tx: Transaction; onClose: () => void; onSave: (p: Partial<Transaction>) => Promise<void> }) {
  const { t } = useStore();
  const [amount, setAmount] = useState(String(tx.amount));
  const [category, setCategory] = useState(tx.category);
  const [description, setDescription] = useState(tx.description);
  const [date, setDate] = useState(tx.date);
  const cats = tx.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">{t('edit')} {t('transaction').toLowerCase() || 'transaction'}</h3>
        <Input label={t('amount')} value={amount} onChange={setAmount} type="number" />
        <Select label={t('category')} value={category} onChange={setCategory} options={cats.map((c) => ({ value: c, label: c }))} />
        <Input label={t('description')} value={description} onChange={setDescription} />
        <Input label={t('date')} value={date} onChange={setDate} type="date" />
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">{t('cancel')}</Button>
          <Button onClick={() => onSave({ amount: parseFloat(amount), category, description, date })} className="flex-1">{t('save')}</Button>
        </div>
      </div>
    </div>
  );
}
