import { useEffect, useState } from 'react';
import { Bell, TrendingUp, Sparkles, ShieldCheck, Wallet } from 'lucide-react';
import { useStore } from '../lib/store';
import { LANGS, Lang } from '../lib/i18n';
import { Button, Input } from '../components/ui';

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const { t } = useStore();
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(iv);
          setTimeout(onDone, 300);
          return 100;
        }
        return p + 4;
      });
    }, 60);
    return () => clearInterval(iv);
  }, [onDone]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500 via-emerald-600 to-sky-700 text-white px-6">
      <div className="relative">
        <div className="absolute inset-0 bg-white/20 rounded-3xl blur-2xl animate-pulse" />
        <div className="relative w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl">
          <Wallet size={48} className="text-white" />
        </div>
      </div>
      <h1 className="text-3xl font-bold mt-6 tracking-tight">{t('app_name')}</h1>
      <p className="text-white/80 text-sm mt-2 text-center max-w-xs">{t('tagline')}</p>

      <div className="flex gap-6 mt-10 text-white/80 text-xs">
        <div className="flex flex-col items-center gap-1"><TrendingUp size={18} /> Forecast</div>
        <div className="flex flex-col items-center gap-1"><ShieldCheck size={18} /> Risk</div>
        <div className="flex flex-col items-center gap-1"><Sparkles size={18} /> AI Tips</div>
      </div>

      <div className="absolute bottom-10 left-0 right-0 px-10">
        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-center text-xs text-white/70 mt-3">Loading your financial dashboard…</p>
      </div>
    </div>
  );
}

export function LoginScreen() {
  const { t, signIn, signUp, lang, setLang } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    if (mode === 'register' && !otpSent) {
      if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
        setError('Enter a valid 10-digit mobile number.');
        setBusy(false);
        return;
      }
      // simulate OTP send
      setOtpSent(true);
      setBusy(false);
      return;
    }
    if (mode === 'register' && otpSent && otp !== '1234') {
      setError('Use 1234 as demo OTP.');
      setBusy(false);
      return;
    }
    if (!phone || !password) {
      setError('Enter mobile number and password.');
      setBusy(false);
      return;
    }
    const fn = mode === 'login' ? signIn : signUp;
    const { error } = await fn(phone, password);
    if (error) setError(error);
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-sky-50 dark:from-slate-900 dark:to-slate-800 flex flex-col px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-600 flex items-center justify-center">
            <Wallet size={20} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-100">{t('app_name')}</span>
        </div>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          className="text-xs px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200"
        >
          {LANGS.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
        </select>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {mode === 'login' ? t('welcome_back') : t('create_account')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
          {mode === 'login' ? t('login') : t('register')} · {t('tagline')}
        </p>

        <div className="flex gap-2 mb-5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setOtpSent(false); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${mode === m ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
            >
              {m === 'login' ? t('login') : t('register')}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <Input label={t('mobile_number')} value={phone} onChange={setPhone} placeholder="98765 43210" type="tel" />
          <Input label={t('password')} value={password} onChange={setPassword} placeholder="••••••••" type="password" />
          {mode === 'register' && otpSent && (
            <>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <Bell size={14} /> {t('otp_sent')} — demo OTP: <span className="font-mono font-bold">1234</span>
              </div>
              <Input label={t('verify_otp')} value={otp} onChange={setOtp} placeholder="Enter 1234" />
            </>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-emerald-600" />
            {t('remember_me')}
          </label>

          {error && <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/30 rounded-lg px-3 py-2">{error}</p>}

          <Button onClick={submit} disabled={busy} className="w-full">
            {busy ? t('loading') : mode === 'register' && !otpSent ? t('send_otp') : mode === 'register' && otpSent ? t('verify_otp') : t('login')}
          </Button>

          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setOtpSent(false); setError(null); }}
            className="text-sm text-emerald-600 hover:underline w-full text-center mt-2"
          >
            {mode === 'login' ? t('new_here') : t('already_have')}
          </button>
        </div>

        <p className="text-xs text-slate-400 text-center mt-6">
          Demo: any mobile number + password (min 6 chars). OTP is <span className="font-mono font-semibold">1234</span>.
        </p>
      </div>
    </div>
  );
}
