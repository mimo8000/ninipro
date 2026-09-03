import React, { useState } from 'react';
import { ThemeMode, SubscriptionUser } from '../types';
import { THEMES } from '../utils/theme';
import { ThemeSelector } from './ThemeSelector';
import { verifySubscriptionCode } from '../utils/subscription';
import { KeyRound, ShieldCheck, Sparkles, ArrowLeft, AlertCircle, Lock, Radio, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthGateProps {
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onAuthenticated: (user: SubscriptionUser) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  currentTheme,
  onThemeChange,
  onAuthenticated,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const theme = THEMES[currentTheme];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) {
      setError('لطفاً کد اشتراک معتبر وارد کنید.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await verifySubscriptionCode(code);
    setLoading(false);
    if (res.success && res.user) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: currentTheme === 'pink' ? ['#f43f5e', '#ec4899', '#fbcfe8'] : currentTheme === 'yellow' ? ['#eab308', '#facc15', '#fef08a'] : ['#ffffff', '#a1a1aa', '#71717a']
      });
      onAuthenticated(res.user);
    } else {
      setError(res.error || 'کد اشتراک نامعتبر است.');
    }
  };

  return (
    <div
      id="auth-gate-container"
      className={`min-h-screen w-full transition-colors duration-500 ${theme.bgClass} flex flex-col justify-between items-center p-4 sm:p-6 relative overflow-hidden`}
    >
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[140px] opacity-30 ${
            currentTheme === 'pink'
              ? 'bg-rose-500'
              : currentTheme === 'yellow'
              ? 'bg-yellow-500'
              : 'bg-zinc-400'
          }`}
        />
        <div
          className={`absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[140px] opacity-25 ${
            currentTheme === 'pink'
              ? 'bg-fuchsia-600'
              : currentTheme === 'yellow'
              ? 'bg-amber-600'
              : 'bg-zinc-600'
          }`}
        />
      </div>

      {/* Header bar with theme selector */}
      <header className="w-full max-w-md flex items-center justify-between z-10 py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-yellow-400 flex items-center justify-center shadow-md">
            <Radio className="w-4 h-4 text-black animate-pulse" />
          </div>
          <span className="font-mono text-lg font-black tracking-wider text-white">
            nini<span className={theme.accent}>pro</span>
          </span>
        </div>
        <ThemeSelector currentTheme={currentTheme} onSelectTheme={onThemeChange} compact />
      </header>

      {/* Main Card */}
      <main className="w-full max-w-md z-10 flex flex-col items-center justify-center my-auto">
        <div className={`w-full rounded-3xl border ${theme.cardBorder} ${theme.cardBg} p-6 sm:p-8 shadow-2xl backdrop-blur-xl`}>
          {/* Icon + title */}
          <div className="flex flex-col items-center text-center mb-6">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 border ${theme.accentBorder} ${
                currentTheme === 'pink'
                  ? 'bg-pink-950/60 text-pink-400 shadow-pink-500/20'
                  : currentTheme === 'yellow'
                  ? 'bg-yellow-950/60 text-yellow-400 shadow-yellow-500/20'
                  : 'bg-zinc-900/80 text-white shadow-white/10'
              } shadow-xl`}
            >
              <KeyRound className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2 bg-white/5 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>سامانه هوشمند کانفیگ خور و پروکسی تلگرام</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ورود به اپلیکیشن <span className={theme.accent}>ninipro</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              جهت دسترسی به سرورها و ابزارها، کد اشتراک خود را وارد کنید
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="subscription-code-input" className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>کد اشتراک (Subscription Code):</span>
                <span className="text-[11px] text-zinc-500 font-mono">حساس به حروف نیست</span>
              </label>

              <div className="relative">
                <input
                  id="subscription-code-input"
                  type="text"
                  dir="ltr"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="مثال: NINI-XXXXX-YYYYY"
                  className={`w-full px-4 py-3.5 rounded-2xl bg-black/60 border ${
                    error ? 'border-red-500/80 ring-2 ring-red-500/30' : 'border-white/15 focus:border-white/40'
                  } text-white font-mono text-center tracking-widest text-base placeholder:text-zinc-600 focus:outline-none transition-all`}
                  autoFocus
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
              </div>

              {error && (
                <div className="mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-950/40 p-2.5 rounded-xl border border-red-800/40 animate-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 active:scale-98 ${theme.accentBg}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>فعال‌سازی و ورود به برنامه</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Buy code — Telegram bot */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <p className="text-[11px] font-bold text-zinc-400 mb-2 text-center">
              هنوز کد اشتراک ندارید؟ از ربات رسمی خرید کنید:
            </p>
            <a
              href="https://t.me/bot_NINIPRO_bot"
              target="_blank"
              rel="noopener noreferrer"
              id="buy-code-bot-btn"
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-500/20 via-cyan-500/15 to-sky-500/20 hover:from-sky-500/30 hover:to-sky-500/30 border border-sky-500/30 text-sky-300 text-xs font-black flex items-center justify-center gap-2 transition-all group shadow-sm"
            >
              <Send className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
              <span>ربات فروش اشتراک — @bot_NINIPRO_bot</span>
            </a>
            <p className="text-[10px] text-zinc-500 mt-2 text-center leading-relaxed">
              پلن رایگان تستی ۷ روزه • اشتراک VIP • دسترسی ادمین
              <br />
              کدها امضای دیجیتال دارند و قابل جعل نیستند
            </p>
          </div>

          {/* Protocols Highlight */}
          <div className="mt-5 p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="font-semibold text-zinc-300">پشتیبانی کامل از پروتکل‌ها:</span>
            <span className="font-mono font-bold text-white">VLESS • VMess • Trojan • SS • Hy2</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md text-center text-xs text-zinc-500 py-2 z-10 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>سیستم رمزنگاری امن اختصاصی ninipro v4.0 (HMAC)</span>
      </footer>
    </div>
  );
};
