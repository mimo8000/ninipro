import React from 'react';
import { ThemeMode, SubscriptionUser } from '../types';
import { THEMES } from '../utils/theme';
import { ThemeSelector } from './ThemeSelector';
import {
  Radio,
  Crown,
  ShieldAlert,
  LogOut,
  PlusCircle,
  Zap,
  Globe,
  Send,
  Sliders,
  Settings,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  activeUser: SubscriptionUser;
  activeTab: 'configs' | 'channels' | 'telegram' | 'admin';
  onSelectTab: (tab: 'configs' | 'channels' | 'telegram' | 'admin') => void;
  onOpenAddModal: () => void;
  onOpenAdminModal: () => void;
  onLogout: () => void;
  onBatchPing: () => void;
  isTestingPing: boolean;
  totalConfigs: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTheme,
  onThemeChange,
  activeUser,
  activeTab,
  onSelectTab,
  onOpenAddModal,
  onOpenAdminModal,
  onLogout,
  onBatchPing,
  isTestingPing,
  totalConfigs,
}) => {
  const theme = THEMES[currentTheme];

  return (
    <header className={`sticky top-0 z-40 w-full ${theme.headerBg} backdrop-blur-xl transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Top Tier: Logo, Theme, User Info */}
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
              currentTheme === 'pink'
                ? 'bg-gradient-to-tr from-pink-600 to-rose-400 text-white shadow-pink-600/30'
                : currentTheme === 'yellow'
                ? 'bg-gradient-to-tr from-yellow-500 to-amber-300 text-black shadow-yellow-500/30'
                : 'bg-zinc-100 text-zinc-950 shadow-white/10'
            } shadow-lg`}>
              <Radio className="w-5 h-5 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xl font-black tracking-tight text-white">
                  nini<span className={theme.accent}>pro</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10">
                  v3.5
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 hidden sm:block">
                سامانه مدیریت کانفیگ و پروکسی تلگرام
              </p>
            </div>
          </div>

          {/* Center/Right: Theme Selector & User Status & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Selector */}
            <ThemeSelector currentTheme={currentTheme} onSelectTheme={onThemeChange} compact />

            {/* User Subscription Badge */}
            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-r border-white/10">
              {activeUser.isAdmin ? (
                <button
                  id="navbar-admin-btn"
                  onClick={onOpenAdminModal}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm group"
                  title="باز کردن پنل مدیریت نامحدود"
                >
                  <Crown className="w-3.5 h-3.5 text-yellow-400 animate-bounce" />
                  <span className="hidden sm:inline">ادمین نامحدود</span>
                  <span className="sm:hidden font-mono">ADMIN</span>
                </button>
              ) : (
                <div className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span className="hidden sm:inline">{activeUser.userName}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {activeUser.expiresAt ? `${Math.ceil((activeUser.expiresAt - Date.now()) / 86400000)} روز` : 'نامحدود'}
                  </span>
                </div>
              )}

              {/* Logout button */}
              <button
                id="navbar-logout-btn"
                onClick={onLogout}
                title="خروج و تعویض کد اشتراک"
                className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs & Primary Actions Row */}
        <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
          {/* Main Navigation Tabs */}
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              id="tab-btn-configs"
              onClick={() => onSelectTab('configs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'configs'
                  ? `${theme.accentBg}`
                  : 'bg-black/30 text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>همه کانفیگ‌ها</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/40 text-[10px] font-mono">
                {totalConfigs}
              </span>
            </button>

            <button
              id="tab-btn-channels"
              onClick={() => onSelectTab('channels')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'channels'
                  ? `${theme.accentBg}`
                  : 'bg-black/30 text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>دریافت خودکار از کانال‌ها</span>
            </button>

            <button
              id="tab-btn-telegram"
              onClick={() => onSelectTab('telegram')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'telegram'
                  ? `${theme.accentBg}`
                  : 'bg-black/30 text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>پروکسی تلگرام</span>
            </button>

            {activeUser.isAdmin && (
              <button
                id="tab-btn-admin"
                onClick={() => onSelectTab('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'admin'
                    ? `${theme.accentBg}`
                    : 'bg-black/30 text-amber-400 hover:text-amber-300 hover:bg-amber-950/20 border border-amber-500/20'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-yellow-400" />
                <span>پنل ادمین نامحدود</span>
              </button>
            )}
          </nav>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="action-ping-all-btn"
              onClick={onBatchPing}
              disabled={isTestingPing || totalConfigs === 0}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              title="تست پینگ همزمان همه کانفیگ‌ها"
            >
              <Zap className={`w-3.5 h-3.5 ${isTestingPing ? 'text-yellow-400 animate-spin' : 'text-emerald-400'}`} />
              <span>{isTestingPing ? 'در حال تست...' : 'تست پینگ همه'}</span>
            </button>

            <button
              id="action-add-config-btn"
              onClick={onOpenAddModal}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${theme.accentBg}`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>افزودن کانفیگ</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
