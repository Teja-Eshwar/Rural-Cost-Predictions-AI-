import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Transaction, Profile } from './supabase';
import { Lang, translate } from './i18n';
import { generateAlerts } from './ai';

type AlertRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  severity: 'low' | 'medium' | 'high';
  read: boolean;
  created_at: string;
};

type StoreCtx = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  transactions: Transaction[];
  alerts: AlertRow[];
  lang: Lang;
  t: (key: string) => string;
  setLang: (l: Lang) => void;
  refresh: () => Promise<void>;
  addTransaction: (t: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateTransaction: (id: string, patch: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  markAlertRead: (id: string) => Promise<void>;
  signIn: (phone: string, password: string) => Promise<{ error: string | null }>;
  signUp: (phone: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<StoreCtx | null>(null);

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

const LANG_KEY = 'ruralcash-lang';

// Derive a stable fake email from a phone number so Supabase auth works
// without the user ever typing an email address.
function phoneToEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `${digits || 'user'}@ruralcash.app`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem(LANG_KEY) as Lang) || 'en');

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  };

  const t = useCallback((key: string) => translate(lang, key), [lang]);

  // Auth state
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      (async () => {
        setSession(sess);
        if (!sess) {
          setProfile(null);
          setTransactions([]);
          setAlerts([]);
        }
      })();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!session?.user) return;
    const [txRes, profRes] = await Promise.all([
      supabase.from('transactions').select('*').order('date', { ascending: false }),
      supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
    ]);
    if (txRes.data) setTransactions(txRes.data as Transaction[]);
    if (profRes.data) {
      setProfile(profRes.data as Profile);
      if ((profRes.data as Profile).language) setLangState((profRes.data as Profile).language as Lang);
    } else if (profRes.error && profRes.error.code === 'PGRST116') {
      // profile doesn't exist yet — create it
      const { data: newProf } = await supabase
        .from('profiles')
        .insert({ id: session.user.id, phone: session.user.phone ?? '', owner_name: '' })
        .select()
        .maybeSingle();
      if (newProf) setProfile(newProf as Profile);
    }

    // regenerate alerts from transactions
    const txns = (txRes.data as Transaction[]) ?? [];
    const generated = generateAlerts(txns);
    // fetch existing alerts to dedupe
    const { data: existing } = await supabase.from('alerts').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
    const existingList = (existing as AlertRow[]) ?? [];
    const existingTitles = new Set(existingList.map((a) => a.title));
    const toInsert = generated.filter((g) => !existingTitles.has(g.title));
    if (toInsert.length > 0) {
      const { data: inserted } = await supabase.from('alerts').insert(toInsert.map((g) => ({ ...g, user_id: session.user.id }))).select();
      const insertedList = (inserted as AlertRow[]) ?? [];
      setAlerts([...insertedList, ...existingList]);
    } else {
      setAlerts(existingList);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) refresh();
  }, [session, refresh]);

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    const { data, error } = await supabase.from('transactions').insert(t).select().single();
    if (error) throw new Error(error.message);
    if (data) setTransactions((prev) => [data as Transaction, ...prev]);
    await refresh();
  }, [refresh]);

  const updateTransaction = useCallback(async (id: string, patch: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    const { error } = await supabase.from('transactions').update(patch).eq('id', id);
    if (error) throw new Error(error.message);
    await refresh();
  }, [refresh]);

  const deleteTransaction = useCallback(async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await refresh();
  }, [refresh]);

  const updateProfile = useCallback(async (patch: Partial<Profile>) => {
    if (!session?.user) return;
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', session.user.id).select().maybeSingle();
    if (error) throw new Error(error.message);
    if (data) {
      setProfile(data as Profile);
      if ((data as Profile).language) setLangState((data as Profile).language as Lang);
    }
  }, [session]);

  const markAlertRead = useCallback(async (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
    await supabase.from('alerts').update({ read: true }).eq('id', id);
  }, []);

  const signIn = useCallback(async (phone: string, password: string) => {
    const email = phoneToEmail(phone);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (phone: string, password: string) => {
    const email = phoneToEmail(phone);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { phone } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        phone,
        owner_name: '',
      });
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setTransactions([]);
    setAlerts([]);
  }, []);

  const value = useMemo<StoreCtx>(() => ({
    session,
    user: session?.user ?? null,
    profile,
    loading,
    transactions,
    alerts,
    lang,
    t,
    setLang,
    refresh,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateProfile,
    markAlertRead,
    signIn,
    signUp,
    signOut,
  }), [session, profile, loading, transactions, alerts, lang, t, refresh, addTransaction, updateTransaction, deleteTransaction, updateProfile, markAlertRead, signIn, signUp, signOut]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
