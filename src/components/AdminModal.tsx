import React, { useState } from 'react';
import { SubscriptionUser, ThemeMode } from '../types';
import { THEMES } from '../utils/theme';
import { createNewSubscriptionCode, getStoredSubscribers, saveSubscribers } from '../utils/subscription';
import {
  Crown,
  X,
  Plus,
  Copy,
  Check,
  Shield,
  Clock,
  HardDrive,
  Users,
  CheckCircle2,
  Ban,
  Trash2,
  Sparkles,
  Key,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeMode;
  totalConfigsCount: number;
  healthyConfigsCount: number;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  totalConfigsCount,
  healthyConfigsCount,
}) => {
  const theme = THEMES[currentTheme];
  const [subscribers, setSubscribers] = useState<SubscriptionUser[]>(getStoredSubscribers());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New Code Form
  const [newCode, setNewCode] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newTier, setNewTier] = useState<SubscriptionUser['tier']>('vip_premium');
  const [durationDays, setDurationDays] = useState<string>('30'); // '30', '90', '365', 'unlimited'
  const [trafficLimit, setTrafficLimit] = useState<string>('unlimited'); // '50', '100', '200', 'unlimited'
  const [isMakeAdmin, setIsMakeAdmin] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateRandomCode = () => {
    const prefixes = ['NINI', 'VIP', 'PRO', 'SUPER', 'FAST'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setNewCode(`${prefix}-${randNum}`);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const days = durationDays === 'unlimited' ? null : parseInt(durationDays, 10);
    const traffic = trafficLimit === 'unlimited' ? null : parseInt(trafficLimit, 10);

    const res = await createNewSubscriptionCode({
      code: newCode,
      userName: newUserName || `کاربر ${newCode}`,
      tier: isMakeAdmin ? 'admin_unlimited' : newTier,
      days,
      trafficGB: traffic,
      isAdmin: isMakeAdmin,
    });

    if (res.success && res.user) {
      setSubscribers(getStoredSubscribers());
      setFormSuccess(`کد اشتراک «${res.user.code}» با موفقیت ایجاد شد!`);
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.5 } });
      setNewCode('');
      setNewUserName('');
    } else {
      setFormError(res.error || 'خطا در ایجاد کد');
    }
  };

  const handleToggleStatus = (code: string) => {
    const updated = subscribers.map((s) => {
      if (s.code === code) {
        return {
          ...s,
          status: s.status === 'active' ? ('suspended' as const) : ('active' as const),
        };
      }
      return s;
    });
    setSubscribers(updated);
    saveSubscribers(updated);
  };

  const handleDeleteCode = (code: string) => {
    if (code === 'ADMIN') return; // protect root master code
    const updated = subscribers.filter((s) => s.code !== code);
    setSubscribers(updated);
    saveSubscribers(updated);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        id="admin-modal-panel"
        className={`w-full max-w-4xl max-h-[90vh] rounded-3xl border ${theme.cardBorder} ${theme.cardBg} shadow-2xl flex flex-col overflow-hidden`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-300 text-black flex items-center justify-center shadow-lg shadow-yellow-500/20 font-black">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>پنل ادمین نامحدود ninipro</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300">
                  MASTER CONTROL
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                مدیریت کاربران، صدور کدهای اشتراک جدید، و آمار سرورها
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Global Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
              <span className="block text-[11px] text-zinc-400">کل کانفیگ‌های فعال</span>
              <span className="block text-xl font-mono font-black text-white mt-1">
                {totalConfigsCount} نود
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
              <span className="block text-[11px] text-zinc-400">سرورهای سالم (Healthy)</span>
              <span className="block text-xl font-mono font-black text-emerald-400 mt-1">
                {healthyConfigsCount} سالم
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
              <span className="block text-[11px] text-zinc-400">تعداد کل کدهای اشتراک</span>
              <span className="block text-xl font-mono font-black text-yellow-400 mt-1">
                {subscribers.length} کد
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
              <span className="block text-[11px] text-zinc-400">وضعیت دسترسی سرور</span>
              <span className="block text-xl font-mono font-black text-cyan-400 mt-1">
                نامحدود ♾️
              </span>
            </div>
          </div>

          {/* Create New Subscription Code Form */}
          <form
            onSubmit={handleCreateSubmit}
            className={`rounded-3xl border border-white/10 bg-black/50 p-4 sm:p-5 space-y-4`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-yellow-400" />
                <span>صدور کد اشتراک جدید (Subscription Code Generator):</span>
              </h3>

              <button
                type="button"
                onClick={handleGenerateRandomCode}
                className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تولید کد رندوم</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">کد اشتراک (Code):</label>
                <input
                  type="text"
                  dir="ltr"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="مثال: NINI-9988"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-xs font-mono font-bold text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">نام دارنده کد:</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="مثال: کاربر طلایی"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">مدت اعتبار:</label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-xs text-white focus:outline-none focus:border-white/40"
                >
                  <option value="unlimited">نامحدود (بدون تاریخ انقضا)</option>
                  <option value="30">۳۰ روزه (۱ ماهه)</option>
                  <option value="90">۹۰ روزه (۳ ماهه)</option>
                  <option value="180">۱۸۰ روزه (۶ ماهه)</option>
                  <option value="365">۳۶۵ روزه (۱ ساله)</option>
                  <option value="7">۷ روزه (تستی)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">سقف حجم ترافیک:</label>
                <select
                  value={trafficLimit}
                  onChange={(e) => setTrafficLimit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-xs text-white focus:outline-none focus:border-white/40"
                >
                  <option value="unlimited">نامحدود (Unlimited GB)</option>
                  <option value="30">۳۰ گیگابایت</option>
                  <option value="50">۵۰ گیگابایت</option>
                  <option value="100">۱۰۰ گیگابایت</option>
                  <option value="200">۲۰۰ گیگابایت</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={isMakeAdmin}
                  onChange={(e) => setIsMakeAdmin(e.target.checked)}
                  className="w-4 h-4 rounded text-yellow-400 focus:ring-0 bg-zinc-800 border-zinc-700"
                />
                <span>دسترسی ادمین نامحدود (قابلیت مدیریت کامل)</span>
              </label>

              <button
                type="submit"
                className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg ${theme.accentBg}`}
              >
                <Plus className="w-4 h-4" />
                <span>صدور و فعال‌سازی کد</span>
              </button>
            </div>

            {formError && (
              <p className="text-xs text-red-400 bg-red-950/40 p-2 rounded-xl border border-red-900/40">
                {formError}
              </p>
            )}
            {formSuccess && (
              <p className="text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded-xl border border-emerald-900/40">
                {formSuccess}
              </p>
            )}
          </form>

          {/* Subscribers Table / Cards */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-400" />
              <span>لیست تمام کدهای اشتراک صادر شده:</span>
            </h3>

            <div className="space-y-2.5">
              {subscribers.map((sub) => {
                const isCopied = copiedCode === sub.code;

                return (
                  <div
                    key={sub.code}
                    className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all hover:bg-black/60"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          sub.isAdmin
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        {sub.isAdmin ? <Crown className="w-4 h-4" /> : <Key className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-white tracking-wider">
                            {sub.code}
                          </span>
                          {sub.isAdmin && (
                            <span className="px-2 py-0.5 rounded-md bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-[10px] font-bold">
                              ادمین نامحدود
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.2 rounded-md text-[10px] font-bold ${
                              sub.status === 'active'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-red-950 text-red-400 border border-red-800'
                            }`}
                          >
                            {sub.status === 'active' ? 'فعال' : 'مسدود'}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-400 block mt-0.5">
                          {sub.userName} • اعتبار: {sub.expiresAt ? `${Math.ceil((sub.expiresAt - Date.now()) / 86400000)} روز باقی‌مانده` : 'نامحدود ♾️'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      {/* Copy Code */}
                      <button
                        type="button"
                        onClick={() => handleCopy(sub.code)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                        title="کپی کد"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>کپی</span>
                      </button>

                      {/* Toggle status */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(sub.code)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          sub.status === 'active'
                            ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40'
                            : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40'
                        }`}
                      >
                        {sub.status === 'active' ? 'مسدودسازی' : 'رفع مسدودی'}
                      </button>

                      {/* Delete Code */}
                      {sub.code !== 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCode(sub.code)}
                          className="p-1.5 rounded-xl hover:bg-red-950/50 text-zinc-500 hover:text-red-400 transition-all"
                          title="حذف کد"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
