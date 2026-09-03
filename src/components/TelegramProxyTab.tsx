import React, { useState, useMemo } from 'react';
import { TelegramProxyItem, TelegramProxyProtocol, ThemeMode } from '../types';
import { THEMES } from '../utils/theme';
import {
  getTelegramProxyLinks,
  parseTgProxyUrl,
  convertV2RayToTelegramProxy,
  generateFakeTlsSecret,
} from '../utils/telegramProxies';
import {
  Send,
  Zap,
  ExternalLink,
  Copy,
  QrCode,
  Check,
  Plus,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Globe,
  Sliders,
  Radio,
  ArrowRightLeft,
  Trash2,
  Share2,
  Terminal,
  Layers,
  Search,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TelegramProxyTabProps {
  currentTheme: ThemeMode;
  proxies: TelegramProxyItem[];
  onTestProxyPing: (proxy: TelegramProxyItem) => void;
  onTestAllProxies: () => void;
  onAddCustomProxy: (proxy: TelegramProxyItem) => void;
  onShowQr: (proxy: TelegramProxyItem) => void;
  isTestingPing: boolean;
}

export const TelegramProxyTab: React.FC<TelegramProxyTabProps> = ({
  currentTheme,
  proxies,
  onTestProxyPing,
  onTestAllProxies,
  onAddCustomProxy,
  onShowQr,
  isTestingPing,
}) => {
  const theme = THEMES[currentTheme];
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showMaker, setShowMaker] = useState(false);
  const [showConverter, setShowConverter] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState<string>('all');

  // Maker form state
  const [makerServer, setMakerServer] = useState('');
  const [makerPort, setMakerPort] = useState('443');
  const [makerSecret, setMakerSecret] = useState(
    'ee1603010200010001fc030386e24c3066696c65732e74656c656772616d2e6f7267'
  );
  const [makerType, setMakerType] = useState<TelegramProxyProtocol>('mtproto');
  const [makerTitle, setMakerTitle] = useState('');
  const [makerUser, setMakerUser] = useState('ninipro');
  const [makerPass, setMakerPass] = useState('');
  const [makerV2rayRaw, setMakerV2rayRaw] = useState('');

  // Converter state
  const [converterInput, setConverterInput] = useState('');
  const [converterError, setConverterError] = useState<string | null>(null);

  const handleCopyLink = (proxy: TelegramProxyItem) => {
    const { appLink, copyableText } = getTelegramProxyLinks(proxy);
    navigator.clipboard.writeText(proxy.v2rayRawConfig || appLink || copyableText);
    setCopiedId(proxy.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConnectTelegram = (proxy: TelegramProxyItem) => {
    const { appLink, webLink } = getTelegramProxyLinks(proxy);
    try {
      window.location.href = appLink;
    } catch {
      window.open(webLink, '_blank');
    }
  };

  const handleGenerateCustomSecret = () => {
    const secret = generateFakeTlsSecret();
    setMakerSecret(secret);
  };

  const handleSaveCustomProxy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!makerServer.trim()) return;

    const newProxy: TelegramProxyItem = {
      id: `tg_custom_${Date.now()}`,
      title: makerTitle.trim() || `پروکسی ${makerType.toUpperCase()} - ${makerServer}:${makerPort}`,
      server: makerServer.trim(),
      port: parseInt(makerPort, 10) || 443,
      secret: makerSecret.trim(),
      user: makerUser.trim() || undefined,
      pass: makerPass.trim() || undefined,
      ping: null,
      status: 'untested',
      country: 'سرور اختصاصی',
      countryCode: 'CUSTOM',
      flag: '⚡',
      type: makerType,
      protocolDetails: `${makerType.toUpperCase()} (سفارشی)`,
      v2rayRawConfig: makerV2rayRaw.trim() || undefined,
      isCustom: true,
    };

    onAddCustomProxy(newProxy);
    setShowMaker(false);
    setMakerServer('');
    setMakerTitle('');
    setMakerPass('');
    setMakerV2rayRaw('');
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
  };

  const handleConvertV2RaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConverterError(null);

    const converted = parseTgProxyUrl(converterInput.trim());
    if (converted) {
      onAddCustomProxy(converted);
      setConverterInput('');
      setShowConverter(false);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } else {
      setConverterError(
        'قالب وارد شده نامعتبر است. فرمت‌های vless://, vmess://, trojan://, ss://, hysteria2://, tuic:// یا tg://proxy, tg://socks پشتیبانی می‌شوند.'
      );
    }
  };

  // Filtered Proxies List
  const filteredProxies = useMemo(() => {
    return proxies.filter((p) => {
      // Protocol filter
      if (selectedProtocol !== 'all' && p.type !== selectedProtocol) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesServer = p.server.toLowerCase().includes(q);
        const matchesType = p.type.toLowerCase().includes(q);
        const matchesCountry = p.country.toLowerCase().includes(q);
        if (!matchesTitle && !matchesServer && !matchesType && !matchesCountry) return false;
      }
      return true;
    });
  }, [proxies, selectedProtocol, searchQuery]);

  const healthyCount = useMemo(() => {
    return proxies.filter((p) => p.status === 'healthy' && p.ping && p.ping > 0).length;
  }, [proxies]);

  const getBadgeForProtocol = (type: TelegramProxyProtocol) => {
    switch (type) {
      case 'mtproto':
        return { label: 'MTProto TLS 1.3', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40' };
      case 'socks5':
        return { label: 'SOCKS5 Proxy', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'http':
        return { label: 'HTTP / HTTPS', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
      case 'vless':
        return { label: 'VLESS Reality (TG)', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'trojan':
        return { label: 'Trojan gRPC (TG)', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'hysteria2':
        return { label: 'Hysteria 2 (TG)', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      case 'ss':
        return { label: 'Shadowsocks (TG)', bg: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
      case 'vmess':
        return { label: 'VMess CDN (TG)', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      case 'tuic':
        return { label: 'TUIC QUIC (TG)', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      default:
        return { label: type.toUpperCase(), bg: 'bg-white/10 text-white border-white/20' };
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Banner: Telegram Multi-Protocol Proxies */}
      <div
        id="telegram-proxy-banner"
        className={`rounded-3xl border ${theme.cardBorder} ${theme.cardBg} p-5 sm:p-6 shadow-xl relative overflow-hidden`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-cyan-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/20">
              <Send className="w-6 h-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  پروکسی تلگرام از تمامی پروتکل‌ها (Multi-Protocol TG Proxy)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-bold">
                  اتصال فوری با ۱ کلیک
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                پشتیبانی جامع از پروتکل‌های <strong className="text-white">MTProto Fake TLS</strong>،{' '}
                <strong className="text-white">Socks5</strong>، <strong className="text-white">HTTP/HTTPS</strong>،{' '}
                <strong className="text-white">VLESS Reality</strong>، <strong className="text-white">Trojan</strong>،{' '}
                <strong className="text-white">Hysteria2</strong> و <strong className="text-white">Shadowsocks</strong> با امکان اتصال مستقیم به تلگرام بدون نیاز به VPN کلی.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <button
              id="ping-all-tg-proxies-btn"
              onClick={onTestAllProxies}
              disabled={isTestingPing}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Zap className={`w-3.5 h-3.5 ${isTestingPing ? 'text-yellow-400 animate-spin' : 'text-emerald-400'}`} />
              <span>{isTestingPing ? 'در حال تست پینگ...' : 'تست پینگ همه'}</span>
            </button>

            <button
              id="toggle-converter-btn"
              onClick={() => {
                setShowConverter(!showConverter);
                if (showMaker) setShowMaker(false);
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/60 text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />
              <span>تبدیل هر کانفیگ به پروکسی TG</span>
            </button>

            <button
              id="toggle-make-proxy-btn"
              onClick={() => {
                setShowMaker(!showMaker);
                if (showConverter) setShowConverter(false);
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md ${theme.accentBg}`}
            >
              <Plus className="w-4 h-4" />
              <span>{showMaker ? 'بستن فرم' : 'ساخت پروکسی جدید'}</span>
            </button>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-white/10">
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">تعداد کل پروکسی‌ها:</span>
            <span className="font-mono font-bold text-white text-xs">{proxies.length} عدد</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">پروکسی‌های پرسرعت:</span>
            <span className="font-mono font-bold text-emerald-400 text-xs">{healthyCount} سالم</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">پروتکل‌های تحت پوشش:</span>
            <span className="font-mono font-bold text-cyan-400 text-xs">۹ پروتکل</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">پشتیبانی TLS 1.3:</span>
            <span className="font-mono font-bold text-yellow-400 text-xs">فعال ⚡</span>
          </div>
        </div>
      </div>

      {/* Converter Panel (تبدیل مستقیم هر لینک کانفیگ به پروکسی تلگرام) */}
      {showConverter && (
        <form
          onSubmit={handleConvertV2RaySubmit}
          className={`rounded-3xl border border-purple-500/30 bg-purple-950/20 backdrop-blur-md p-5 space-y-3.5 animate-fade-in shadow-xl`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-purple-400" />
              <span>مبدل هوشمند: تبدیل هر نوع کانفیگ به پروکسی آماده تلگرام</span>
            </h3>
            <span className="text-[11px] text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded-md border border-purple-700/40">
              VLESS / VMess / Trojan / SS / Hy2 / TG links
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            لینک کانفیگ مورد نظر خود (vless://, vmess://, trojan://, hysteria2://, ss:// یا tg://) را در کادر زیر جایگذاری (Paste) کنید تا به صورت فوری به پروکسی اختصاصی و قابل اتصال تلگرام تبدیل شود:
          </p>

          <div>
            <textarea
              rows={3}
              dir="ltr"
              value={converterInput}
              onChange={(e) => setConverterInput(e.target.value)}
              placeholder="vless://9a1e0b5c-...@51.159.21.84:443?security=reality...\nیا tg://proxy?server=...\nیا hysteria2://token@server:443"
              className="w-full p-3 rounded-2xl bg-black/70 border border-white/20 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-400 resize-none"
              autoFocus
            />
          </div>

          {converterError && (
            <p className="text-xs text-red-400 bg-red-950/50 p-2.5 rounded-xl border border-red-800/40">
              {converterError}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowConverter(false)}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 text-xs font-semibold"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={!converterInput.trim()}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>تبدیل و افزودن به لیست تلگرام</span>
            </button>
          </div>
        </form>
      )}

      {/* Maker Custom Form (ساخت پروکسی با تمام پروتکل‌ها) */}
      {showMaker && (
        <form
          onSubmit={handleSaveCustomProxy}
          className={`rounded-3xl border ${theme.cardBorder} ${theme.cardBg} p-5 space-y-4 animate-fade-in shadow-xl`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>سازنده پروکسی اختصاصی با انتخاب هر پروتکل دلخواه:</span>
            </h3>
            {makerType === 'mtproto' && (
              <button
                type="button"
                onClick={handleGenerateCustomSecret}
                className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تولید سکرت جعلی TLS 1.3</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">نوع پروتکل پروکسی:</label>
              <select
                value={makerType}
                onChange={(e) => setMakerType(e.target.value as TelegramProxyProtocol)}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:outline-none focus:border-white/40"
              >
                <option value="mtproto">MTProto (TLS 1.3 Fake Domain)</option>
                <option value="socks5">SOCKS5 Proxy (User/Pass or Open)</option>
                <option value="http">HTTP / HTTPS Connect Proxy</option>
                <option value="vless">VLESS Reality / gRPC / WS (Telegram Tunnel)</option>
                <option value="trojan">Trojan TLS / gRPC (Telegram Tunnel)</option>
                <option value="hysteria2">Hysteria 2 (UDP Brutal for TG)</option>
                <option value="ss">Shadowsocks 2022 (AEAD)</option>
                <option value="vmess">VMess WebSocket (CDN)</option>
                <option value="tuic">TUIC (QUIC v5)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">عنوان / نام پروکسی:</label>
              <input
                type="text"
                value={makerTitle}
                onChange={(e) => setMakerTitle(e.target.value)}
                placeholder="مثال: سرور سریع آلمان"
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">آدرس سرور (IP یا دامنه):</label>
              <input
                type="text"
                dir="ltr"
                value={makerServer}
                onChange={(e) => setMakerServer(e.target.value)}
                placeholder="159.69.195.42 یا tg.domain.com"
                required
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">پورت (Port):</label>
              <input
                type="number"
                dir="ltr"
                value={makerPort}
                onChange={(e) => setMakerPort(e.target.value)}
                placeholder="443"
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40 font-mono"
              />
            </div>
          </div>

          {/* Conditional inputs depending on protocol */}
          {makerType === 'mtproto' && (
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">سکرت رمزگذاری MTProto (Secret):</label>
              <input
                type="text"
                dir="ltr"
                value={makerSecret}
                onChange={(e) => setMakerSecret(e.target.value)}
                placeholder="ee1603010200010001fc030386e24c30..."
                required
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40"
              />
            </div>
          )}

          {(makerType === 'socks5' || makerType === 'http') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">نام کاربری (Username - اختیاری):</label>
                <input
                  type="text"
                  dir="ltr"
                  value={makerUser}
                  onChange={(e) => setMakerUser(e.target.value)}
                  placeholder="ninipro"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">رمز عبور (Password - اختیاری):</label>
                <input
                  type="text"
                  dir="ltr"
                  value={makerPass}
                  onChange={(e) => setMakerPass(e.target.value)}
                  placeholder="secret password"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white font-mono"
                />
              </div>
            </div>
          )}

          {makerType !== 'mtproto' && makerType !== 'socks5' && makerType !== 'http' && (
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">
                لینک یا کد کانفیگ {makerType.toUpperCase()} (اختیاری برای تونل خودکار):
              </label>
              <input
                type="text"
                dir="ltr"
                value={makerV2rayRaw}
                onChange={(e) => setMakerV2rayRaw(e.target.value)}
                placeholder={`${makerType}://uuid@server:port?...`}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs font-mono text-white placeholder:text-zinc-600"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowMaker(false)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 text-xs font-semibold"
            >
              انصراف
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-xs font-bold shadow-lg ${theme.accentBg}`}
            >
              افزودن پروکسی اختصاصی
            </button>
          </div>
        </form>
      )}

      {/* Filter & Protocol Bar */}
      <div
        id="tg-filter-bar"
        className={`p-4 rounded-3xl border ${theme.cardBorder} ${theme.cardBg} shadow-lg space-y-3`}
      >
        {/* Search input */}
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در پروکسی‌ها، کشورها، پروتکل، سرور IP یا پورت..."
            className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Protocol Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-zinc-400 shrink-0 ml-1">فیلتر پروتکل:</span>
          {[
            { id: 'all', label: 'همه پروتکل‌ها' },
            { id: 'mtproto', label: 'MTProto TLS' },
            { id: 'socks5', label: 'Socks5' },
            { id: 'http', label: 'HTTP / HTTPS' },
            { id: 'vless', label: 'VLESS Reality' },
            { id: 'trojan', label: 'Trojan' },
            { id: 'hysteria2', label: 'Hysteria 2' },
            { id: 'ss', label: 'Shadowsocks' },
            { id: 'vmess', label: 'VMess' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProtocol(p.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedProtocol === p.id
                  ? `${theme.accentBg} scale-102`
                  : 'bg-black/40 text-zinc-400 hover:text-zinc-200 border border-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Proxies List Grid */}
      {filteredProxies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredProxies.map((proxy) => {
            const isCopied = copiedId === proxy.id;
            const badge = getBadgeForProtocol(proxy.type);
            const isHealthy = proxy.status === 'healthy' && proxy.ping !== null && proxy.ping > 0;
            const isTesting = proxy.status === 'testing';

            return (
              <div
                key={proxy.id}
                className={`rounded-3xl border ${theme.cardBorder} ${theme.cardBg} p-4 sm:p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-white/30 transition-all group relative overflow-hidden`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl select-none">{proxy.flag}</span>
                    <div>
                      <h4 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {proxy.title}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {proxy.server}:{proxy.port}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ping Badge */}
                  <button
                    type="button"
                    onClick={() => onTestProxyPing(proxy)}
                    className={`px-2 py-1 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1 transition-all ${
                      isTesting
                        ? 'bg-yellow-500/20 text-yellow-300 animate-pulse'
                        : isHealthy
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/10 text-zinc-400'
                    }`}
                    title="تست پینگ این پروکسی"
                  >
                    <Zap className={`w-3 h-3 ${isTesting ? 'animate-spin text-yellow-400' : 'text-emerald-400'}`} />
                    <span>{proxy.ping ? `${proxy.ping}ms` : 'تست'}</span>
                  </button>
                </div>

                {/* Protocol Info & Features */}
                <div className="p-2.5 rounded-2xl bg-black/40 border border-white/5 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>جزئیات رمزگذاری:</span>
                    <span className="text-zinc-200 font-semibold truncate max-w-[170px]" dir="ltr">
                      {proxy.protocolDetails || proxy.type.toUpperCase()}
                    </span>
                  </div>

                  {proxy.sponsorChannel && (
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>کانال اسپانسر:</span>
                      <span className="text-sky-400 font-mono font-bold">{proxy.sponsorChannel}</span>
                    </div>
                  )}

                  {proxy.v2rayRawConfig && (
                    <div className="flex items-center justify-between text-zinc-400 pt-0.5">
                      <span>پشتیبانی تونل V2Ray:</span>
                      <span className="text-purple-300 font-mono font-bold">بله (Inbound 10808)</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                  {/* Connect to Telegram button */}
                  <button
                    type="button"
                    onClick={() => handleConnectTelegram(proxy)}
                    className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 ${
                      proxy.type === 'vless' || proxy.type === 'trojan' || proxy.type === 'hysteria2'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500'
                        : theme.accentBg
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>اتصال به تلگرام</span>
                  </button>

                  {/* Copy Link */}
                  <button
                    type="button"
                    onClick={() => handleCopyLink(proxy)}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 text-zinc-300 transition-all"
                    title="کپی لینک مستقیم یا کانفیگ"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>

                  {/* QR Code */}
                  <button
                    type="button"
                    onClick={() => onShowQr(proxy)}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 text-zinc-300 transition-all"
                    title="نمایش بارکد QR"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className={`p-10 rounded-3xl border ${theme.cardBorder} ${theme.cardBg} text-center space-y-3`}
        >
          <Globe className="w-12 h-12 mx-auto text-zinc-600 animate-pulse" />
          <h3 className="text-base font-bold text-white">پروکسی با مشخصات انتخابی یافت نشد</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            می‌توانید فیلترها را ریست کنید یا با استفاده از دکمه «تبدیل هر کانفیگ به پروکسی TG» کانفیگ‌های جدید اضافه نمایید.
          </p>
          <button
            onClick={() => {
              setSelectedProtocol('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
          >
            نمایش همه پروتکل‌ها
          </button>
        </div>
      )}
    </div>
  );
};
