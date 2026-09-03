import React, { useState } from 'react';
import { ChannelSource, ConfigItem, ThemeMode } from '../types';
import { THEMES } from '../utils/theme';
import {
  Radio,
  RefreshCw,
  Plus,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
  Wifi,
  Trash2,
  Clock,
  Send,
  Zap,
} from 'lucide-react';

interface ChannelFetcherTabProps {
  currentTheme: ThemeMode;
  channels: ChannelSource[];
  isSyncing: boolean;
  onSyncAllChannels: () => void;
  onSyncSingleChannel: (channel: ChannelSource) => void;
  onToggleChannel: (id: string) => void;
  onAddChannel: (name: string, handle: string, url: string) => void;
  onDeleteChannel: (id: string) => void;
  totalAutoFetched: number;
}

export const ChannelFetcherTab: React.FC<ChannelFetcherTabProps> = ({
  currentTheme,
  channels,
  isSyncing,
  onSyncAllChannels,
  onSyncSingleChannel,
  onToggleChannel,
  onAddChannel,
  onDeleteChannel,
  totalAutoFetched,
}) => {
  const theme = THEMES[currentTheme];
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelHandle, setNewChannelHandle] = useState('');
  const [newChannelUrl, setNewChannelUrl] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim() || !newChannelUrl.trim()) return;
    onAddChannel(
      newChannelName.trim(),
      newChannelHandle.trim() || `@${newChannelName.trim().replace(/\s+/g, '_')}`,
      newChannelUrl.trim()
    );
    setNewChannelName('');
    setNewChannelHandle('');
    setNewChannelUrl('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Banner: Auto-Fetch Overview */}
      <div
        id="channel-fetcher-banner"
        className={`rounded-3xl border ${theme.cardBorder} ${theme.cardBg} p-5 sm:p-6 shadow-xl relative overflow-hidden`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${theme.accentBorder} ${
                currentTheme === 'pink'
                  ? 'bg-pink-950/60 text-pink-400'
                  : currentTheme === 'yellow'
                  ? 'bg-yellow-950/60 text-yellow-400'
                  : 'bg-zinc-900 text-white'
              }`}
            >
              <Radio className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  دریافت خودکار کانفیگ از کانال‌های تلگرام و ساب‌ها
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  فعال
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                سامانه <span className={theme.accent}>ninipro</span> به طور خودکار جدیدترین سرورهای سالم پروتکل‌های VLESS، VMess، Trojan و Hysteria2 را از کانال‌های عمومی تلگرام و مخازن روزانه اسکرپ کرده و پس از پالایش وارد لیست می‌کند.
              </p>
            </div>
          </div>

          {/* Action Button: Sync All */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              id="sync-all-channels-btn"
              onClick={onSyncAllChannels}
              disabled={isSyncing}
              className={`w-full md:w-auto px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${theme.accentBg}`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'در حال دریافت و اسکرپ...' : 'دریافت فوری کانفیگ‌ها'}</span>
            </button>
          </div>
        </div>

        {/* Mini Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-white/10 text-center sm:text-right">
          <div className="p-3 rounded-2xl bg-black/30 border border-white/5">
            <span className="block text-[11px] text-zinc-400">تعداد کانال‌های متصل</span>
            <span className="block text-base font-mono font-bold text-white mt-0.5">
              {channels.length} کانال
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-black/30 border border-white/5">
            <span className="block text-[11px] text-zinc-400">کانال‌های فعال</span>
            <span className="block text-base font-mono font-bold text-emerald-400 mt-0.5">
              {channels.filter((c) => c.enabled).length} فعال
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-black/30 border border-white/5">
            <span className="block text-[11px] text-zinc-400">کل سرورهای دریافتی</span>
            <span className="block text-base font-mono font-bold text-yellow-400 mt-0.5">
              +{totalAutoFetched || 190} سرور
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-black/30 border border-white/5">
            <span className="block text-[11px] text-zinc-400">فاصله بروزرسانی خودکار</span>
            <span className="block text-base font-mono font-bold text-purple-300 mt-0.5">
              هر ۱۵ دقیقه
            </span>
          </div>
        </div>
      </div>

      {/* Header + Add Channel Button */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-zinc-400" />
          <span>لیست کانال‌ها و منابع اشتراک عمومی:</span>
        </h3>

        <button
          id="toggle-add-channel-form-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'بستن فرم' : 'افزودن کانال جدید'}</span>
        </button>
      </div>

      {/* Add New Channel Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className={`rounded-3xl border ${theme.cardBorder} ${theme.cardBg} p-4 sm:p-5 space-y-3 animate-fade-in`}
        >
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-cyan-400" />
            <span>ثبت کانال تلگرام یا لینک ساب (Subscription URL) جدید:</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">نام کانال / منبع:</label>
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="مثال: کانال پرسرعت تلگرام"
                required
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">آیدی کانال (اختیاری):</label>
              <input
                type="text"
                dir="ltr"
                value={newChannelHandle}
                onChange={(e) => setNewChannelHandle(e.target.value)}
                placeholder="@example_channel"
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">لینک مستقیم اسکرپ / Sub URL:</label>
              <input
                type="url"
                dir="ltr"
                value={newChannelUrl}
                onChange={(e) => setNewChannelUrl(e.target.value)}
                placeholder="https://raw.githubusercontent.com/..."
                required
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 text-xs font-semibold"
            >
              انصراف
            </button>
            <button
              type="submit"
              className={`px-4 py-1.5 rounded-xl text-xs font-bold shadow-md ${theme.accentBg}`}
            >
              ذخیره و اسکرپ کانال
            </button>
          </div>
        </form>
      )}

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {channels.map((ch) => (
          <div
            key={ch.id}
            id={`channel-item-${ch.id}`}
            className={`rounded-2xl border ${theme.cardBorder} ${theme.cardBg} p-4 transition-all hover:scale-[1.01] flex flex-col justify-between gap-3`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {ch.name}
                  </h4>
                  <span className="text-xs text-zinc-400 font-mono" dir="ltr">
                    {ch.handle}
                  </span>
                </div>
              </div>

              {/* Status Toggle Switch */}
              <button
                type="button"
                onClick={() => onToggleChannel(ch.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  ch.enabled
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                    : 'bg-zinc-800 border border-zinc-700 text-zinc-500'
                }`}
              >
                {ch.enabled ? 'روشن (Syncing)' : 'خاموش'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-black/40 font-mono font-bold text-zinc-300">
                  +{ch.count} سرور استخراج شده
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSyncSingleChannel(ch)}
                  disabled={isSyncing}
                  className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-300 text-xs font-semibold flex items-center gap-1 transition-all"
                  title="دریافت آنی از این کانال"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>اسکرپ فوری</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteChannel(ch.id)}
                  className="p-1 rounded-xl hover:bg-red-950/40 text-zinc-500 hover:text-red-400 transition-all"
                  title="حذف کانال"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
