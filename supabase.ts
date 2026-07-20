export function formatMoney(n: number, lang = 'en'): string {
  const symbols: Record<string, string> = { en: '₹', ta: '₹', te: '₹', hi: '₹' };
  const sym = symbols[lang] ?? '₹';
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  return `${n < 0 ? '-' : ''}${sym}${formatted}`;
}

export function formatDate(d: string | Date, lang = 'en'): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  const localeMap: Record<string, string> = { en: 'en-IN', ta: 'ta-IN', te: 'te-IN', hi: 'hi-IN' };
  return date.toLocaleDateString(localeMap[lang] ?? 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateShort(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysFromNowISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isSameDay(a: string | Date, b: string | Date): boolean {
  const da = typeof a === 'string' ? new Date(a) : a;
  const db = typeof b === 'string' ? new Date(b) : b;
  return da.toDateString() === db.toDateString();
}

export function withinDays(d: string | Date, days: number, ref: Date = new Date()): boolean {
  const date = typeof d === 'string' ? new Date(d) : d;
  const diff = (date.getTime() - ref.getTime()) / 86400000;
  return diff >= 0 && diff < days;
}

export function daysAgo(d: string | Date, days: number, ref: Date = new Date()): boolean {
  const date = typeof d === 'string' ? new Date(d) : d;
  const diff = (ref.getTime() - date.getTime()) / 86400000;
  return diff >= 0 && diff < days;
}
