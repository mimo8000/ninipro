import React, { useState } from 'react';
import { ConfigItem, ThemeMode } from '../types';
import { THEMES } from '../utils/theme';
import { parseBulkConfigs, parseSingleConfig } from '../utils/configParser';
import {
  X,
  Plus,
  FileText,
  Link,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeMode;
  onAddConfigs: (configs: ConfigItem[]) => void;
}

export const AddConfigModal: React.FC<AddConfigModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onAddConfigs,
}) => {
  const theme = THEMES[currentTheme];
  const [activeTab, setActiveTab] = useState<'text' | 'sub' | 'file'>('text');
  const [rawText, setRawText] = useState('');
  const [subUrl, setSubUrl] = useState('');
  const [isSubLoading, setIsSubLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ count: number; error?: string } | null>(null);

  if (!isOpen) return null;

  // Real-time preview count
  const detectedPreview = parseBulkConfigs(rawText, 'manual');

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    const parsed = parseBulkConfigs(rawText, 'manual', 'وارد شده دستی');
    if (parsed.length === 0) {
      setFeedback({ count: 0, error: 'هیچ کانفیگ معتبری در متن یافت نشد. فرمت‌های vless://, vmess://, trojan://, ss://, hy2:// پشتیبانی می‌شوند.' });
      return;
    }

    onAddConfigs(parsed);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    setRawText('');
    setFeedback(null);
    onClose();
  };

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subUrl.trim()) return;

    setIsSubLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(subUrl.trim());
      if (!res.ok) throw new Error('خطا در بارگیری لینک ساب');
      const text = await res.text();
      const parsed = parseBulkConfigs(text, 'subscription', 'لینک اشتراک');

      if (parsed.length > 0) {
        onAddConfigs(parsed);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        setSubUrl('');
        onClose();
      } else {
        setFeedback({ count: 0, error: 'محتوای لینک اشتراک قابل رمزگشایی یا خالی بود.' });
      }
    } catch {
      // Fallback: parse whatever was in the URL or notify user
      setFeedback({ count: 0, error: 'عدم دسترسی مستقیم به لینک ساب (احتمال خطای CORS). لطفاً متن ساب را مستقیماً در تب متن کپی و جایگذاری کنید.' });
    } finally {
      setIsSubLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        setActiveTab('text');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        id="add-config-modal"
        className={`w-full max-w-2xl max-h-[90vh] rounded-3xl border ${theme.cardBorder} ${theme.cardBg} shadow-2xl flex flex-col overflow-hidden`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${theme.accentBorder} ${
                currentTheme === 'pink'
                  ? 'bg-pink-950/60 text-pink-400'
                  : currentTheme === 'yellow'
                  ? 'bg-yellow-950/60 text-yellow-400'
                  : 'bg-zinc-900 text-white'
              }`}
            >
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                افزودن کانفیگ جدید (پشتیبانی از تمام پروتکل‌ها)
              </h2>
              <p className="text-xs text-zinc-400">
                پشتیبانی از VLESS, VMess, Trojan, Shadowsocks, Hysteria2, TUIC, WireGuard
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

        {/* Tab Selector */}
        <div className="flex items-center gap-2 p-3 bg-black/40 border-b border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'text'
                ? theme.accentBg
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>متن کانفیگ / دسته‌ای (Bulk)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sub')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'sub'
                ? theme.accentBg
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>لینک ساب (Subscription Link)</span>
          </button>

          <label
            htmlFor="file-upload-input"
            className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer text-zinc-400 hover:text-white hover:bg-white/5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>بارگذاری فایل .txt</span>
            <input
              id="file-upload-input"
              type="file"
              accept=".txt,.conf,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'text' && (
            <form onSubmit={handleTextSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>کانفیگ(ها) یا متن پیام حاوی کانفیگ را اینجا جایگذاری (Paste) کنید:</span>
                  {detectedPreview.length > 0 && (
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      ✓ {detectedPreview.length} کانفیگ شناسایی شد
                    </span>
                  )}
                </label>
                <textarea
                  rows={7}
                  dir="ltr"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`vless://9a1e0b5c-...@server:443?...\nvmess://eyJhZGQiOiIx...\ntrojan://pass@server:443\nss://YWVzLTI1Ni1nY206...\nhysteria2://token@server:443`}
                  className="w-full p-3.5 rounded-2xl bg-black/60 border border-white/15 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40 leading-relaxed resize-none"
                  autoFocus
                />
              </div>

              {/* Detected preview badges */}
              {detectedPreview.length > 0 && (
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-yellow-400" />
                    پیش‌نمایش کانفیگ‌های استخراج شده:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {detectedPreview.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-white/10 text-white text-[10px] font-mono flex items-center gap-1"
                      >
                        <span>{item.flag}</span>
                        <span className="font-bold">{item.protocol.toUpperCase()}</span>
                        <span className="text-zinc-400 truncate max-w-[100px]">{item.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {feedback?.error && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-950/40 p-2.5 rounded-xl border border-red-800/40">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{feedback.error}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 text-xs font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!rawText.trim()}
                  className={`px-5 py-2 rounded-xl text-xs font-bold shadow-lg disabled:opacity-50 ${theme.accentBg}`}
                >
                  افزودن به سرورها ({detectedPreview.length})
                </button>
              </div>
            </form>
          )}

          {activeTab === 'sub' && (
            <form onSubmit={handleSubSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  لینک اشتراک یا ساب (Sub Link) را وارد کنید:
                </label>
                <input
                  type="url"
                  dir="ltr"
                  value={subUrl}
                  onChange={(e) => setSubUrl(e.target.value)}
                  placeholder="https://mysubdomain.com/sub/v2ray/..."
                  required
                  className="w-full px-3.5 py-3 rounded-2xl bg-black/60 border border-white/15 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40"
                  autoFocus
                />
              </div>

              {feedback?.error && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-950/40 p-2.5 rounded-xl border border-red-800/40">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{feedback.error}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 text-xs font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubLoading || !subUrl.trim()}
                  className={`px-5 py-2 rounded-xl text-xs font-bold shadow-lg disabled:opacity-50 ${theme.accentBg}`}
                >
                  {isSubLoading ? 'در حال دریافت ساب...' : 'بارگیری کانفیگ‌ها از لینک'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
