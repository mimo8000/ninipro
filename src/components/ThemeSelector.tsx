import React from 'react';
import { ThemeMode } from '../types';
import { THEMES } from '../utils/theme';
import { Palette, Sparkles, Moon, Sun } from 'lucide-react';

interface ThemeSelectorProps {
  currentTheme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  compact?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
  compact = false,
}) => {
  const themesList: { id: ThemeMode; name: string; icon: React.ReactNode; color: string; ring: string }[] = [
    {
      id: 'pink',
      name: 'صورتی نئون',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      color: 'bg-rose-500',
      ring: 'ring-rose-400 text-rose-300',
    },
    {
      id: 'black',
      name: 'سیاه مات',
      icon: <Moon className="w-3.5 h-3.5" />,
      color: 'bg-zinc-800 border border-zinc-500',
      ring: 'ring-zinc-300 text-zinc-200',
    },
    {
      id: 'yellow',
      name: 'زرد سایبر',
      icon: <Sun className="w-3.5 h-3.5" />,
      color: 'bg-yellow-400 text-black',
      ring: 'ring-yellow-400 text-yellow-300',
    },
  ];

  if (compact) {
    return (
      <div id="theme-selector-compact" className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md">
        {themesList.map((t) => {
          const isActive = currentTheme === t.id;
          return (
            <button
              key={t.id}
              id={`theme-btn-${t.id}`}
              onClick={() => onSelectTheme(t.id)}
              title={t.name}
              className={`relative px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/30 scale-105'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${t.color} ${isActive ? 'ring-2 ring-white/60 animate-pulse' : ''}`} />
              <span className="hidden sm:inline">{t.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div id="theme-selector-full" className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
        <Palette className="w-3.5 h-3.5" />
        <span>انتخاب تم اختصاصی برنامه (تبدیل سراسری رنگ):</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {themesList.map((t) => {
          const isActive = currentTheme === t.id;
          return (
            <button
              key={t.id}
              id={`theme-card-${t.id}`}
              onClick={() => onSelectTheme(t.id)}
              className={`p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 text-center relative overflow-hidden ${
                isActive
                  ? `border-white/40 bg-white/10 shadow-lg scale-102 ${t.ring}`
                  : 'border-white/5 bg-black/30 text-zinc-400 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              {isActive && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-300 animate-ping" />
              )}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${t.color}`}>
                {t.icon}
              </div>
              <span className="text-xs font-bold">{t.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
