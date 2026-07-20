import { Home, Plus, BarChart3, Bell, User } from 'lucide-react';

export type Tab = 'home' | 'add' | 'forecast' | 'alerts' | 'profile';

export default function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const items: { key: Tab; label: string; icon: typeof Home }[] = [
    { key: 'home', label: 'Home', icon: Home },
    { key: 'add', label: 'Add', icon: Plus },
    { key: 'forecast', label: 'Forecast', icon: BarChart3 },
    { key: 'alerts', label: 'Alerts', icon: Bell },
    { key: 'profile', label: 'Profile', icon: User },
  ];
  return (
    <nav className="sticky bottom-0 z-30 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 px-2 py-1.5">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          const isAdd = key === 'add';
          if (isAdd) {
            return (
              <button key={key} onClick={() => onChange(key)} className="flex flex-col items-center -mt-5">
                <span className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition">
                  <Icon size={22} />
                </span>
                <span className="text-[10px] mt-0.5 text-slate-600 dark:text-slate-300">{label}</span>
              </button>
            );
          }
          return (
            <button key={key} onClick={() => onChange(key)} className="flex flex-col items-center px-3 py-1.5">
              <Icon size={20} className={isActive ? 'text-emerald-600' : 'text-slate-400 dark:text-slate-500'} />
              <span className={`text-[10px] mt-0.5 ${isActive ? 'text-emerald-600 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
