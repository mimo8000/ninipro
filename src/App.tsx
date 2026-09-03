import React, { useState, useEffect, useMemo } from 'react';
import {
  ThemeMode,
  ConfigItem,
  TelegramProxyItem,
  SubscriptionUser,
  ChannelSource,
  ConnectionStats,
  ProtocolType,
} from './types';
import { THEMES } from './utils/theme';
import { AuthGate } from './components/AuthGate';
import { Navbar } from './components/Navbar';
import { ConnectionWidget } from './components/ConnectionWidget';
import { ConfigCard } from './components/ConfigCard';
import { ChannelFetcherTab } from './components/ChannelFetcherTab';
import { TelegramProxyTab } from './components/TelegramProxyTab';
import { AdminModal } from './components/AdminModal';
import { AddConfigModal } from './components/AddConfigModal';
import { QrModal } from './components/QrModal';
import { getActiveUser, setActiveUser } from './utils/subscription';
import {
  DEFAULT_CHANNEL_SOURCES,
  getPreloadedConfigs,
  fetchChannelConfigs,
} from './utils/channelFetcher';
import { INITIAL_TELEGRAM_PROXIES } from './utils/telegramProxies';
import {
  batchTestConfigs,
  testConfigPing,
  testTelegramProxyPing,
} from './utils/pingTester';
import {
  Search,
  Filter,
  Zap,
  Trash2,
  Share2,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowUpDown,
  Radio,
  Send,
  Globe,
  SlidersHorizontal,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const STORAGE_KEY_CONFIGS = 'ninipro_configs_v1';
const STORAGE_KEY_THEME = 'ninipro_theme_v1';
const STORAGE_KEY_CHANNELS = 'ninipro_channels_v1';
const STORAGE_KEY_TG_PROXIES = 'ninipro_tg_proxies_v1';

export default function App() {
  // 1. Theme State
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME) as ThemeMode;
      return saved && THEMES[saved] ? saved : 'pink';
    } catch {
      return 'pink';
    }
  });

  const theme = THEMES[currentTheme];

  const handleThemeChange = (newTheme: ThemeMode) => {
    setCurrentTheme(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, newTheme);
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Authentication / Subscription Gate State
  const [activeUser, setAuthState] = useState<SubscriptionUser | null>(() => getActiveUser());

  const handleAuthenticated = (user: SubscriptionUser) => {
    setAuthState(user);
    setActiveUser(user);
  };

  const handleLogout = () => {
    setAuthState(null);
    setActiveUser(null);
  };

  // 3. App Tabs: 'configs' | 'channels' | 'telegram' | 'admin'
  const [activeTab, setActiveTab] = useState<'configs' | 'channels' | 'telegram' | 'admin'>('configs');

  // 4. Configs State
  const [configs, setConfigs] = useState<ConfigItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONFIGS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return getPreloadedConfigs();
    } catch {
      return getPreloadedConfigs();
    }
  });

  // Save configs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIGS, JSON.stringify(configs));
    } catch (e) {
      console.error('Failed to save configs', e);
    }
  }, [configs]);

  // 5. Telegram Proxies State
  const [telegramProxies, setTelegramProxies] = useState<TelegramProxyItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TG_PROXIES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_TELEGRAM_PROXIES;
    } catch {
      return INITIAL_TELEGRAM_PROXIES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TG_PROXIES, JSON.stringify(telegramProxies));
    } catch (e) {
      console.error('Failed to save tg proxies', e);
    }
  }, [telegramProxies]);

  // 6. Channels State
  const [channels, setChannels] = useState<ChannelSource[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CHANNELS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_CHANNEL_SOURCES;
    } catch {
      return DEFAULT_CHANNEL_SOURCES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(channels));
    } catch (e) {
      console.error('Failed to save channels', e);
    }
  }, [channels]);

  // 7. Active Connection State
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
  const [connectionStats, setConnectionStats] = useState<ConnectionStats>({
    isConnected: false,
    connecting: false,
    activeConfigId: null,
    connectedSince: null,
    downloadSpeedKBps: 0,
    uploadSpeedKBps: 0,
    totalDownloadedMB: 0,
    totalUploadedMB: 0,
    latencyMs: 0,
    packetLossPercent: 0,
  });

  const activeConfig = useMemo(() => {
    return configs.find((c) => c.id === activeConfigId) || configs[0] || null;
  }, [configs, activeConfigId]);

  // Real-time speed simulation when connected
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (connectionStats.isConnected) {
      interval = setInterval(() => {
        setConnectionStats((prev) => {
          const downDelta = 120 + Math.random() * 450;
          const upDelta = 30 + Math.random() * 110;
          return {
            ...prev,
            downloadSpeedKBps: downDelta,
            uploadSpeedKBps: upDelta,
            totalDownloadedMB: prev.totalDownloadedMB + downDelta / 1024 / 2,
            totalUploadedMB: prev.totalUploadedMB + upDelta / 1024 / 2,
            latencyMs: activeConfig?.ping && activeConfig.ping > 0 ? activeConfig.ping + Math.floor(Math.random() * 10 - 5) : 78,
          };
        });
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connectionStats.isConnected, activeConfig]);

  // 8. Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProtocol, setFilterProtocol] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'healthy' | 'slow' | 'favorites'>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'ping_asc' | 'newest' | 'name'>('ping_asc');

  // 9. Modals State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [qrItem, setQrItem] = useState<ConfigItem | TelegramProxyItem | null>(null);

  // 10. Ping Testing & Channel Syncing States
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingProgress, setPingProgress] = useState<{ current: number; total: number } | null>(null);
  const [isSyncingChannels, setIsSyncingChannels] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Connection Handler
  const handleToggleConnection = () => {
    if (connectionStats.isConnected) {
      setConnectionStats((prev) => ({
        ...prev,
        isConnected: false,
        connecting: false,
        downloadSpeedKBps: 0,
        uploadSpeedKBps: 0,
      }));
      showNotification('اتصال با موفقیت قطع شد.');
    } else {
      if (!activeConfig) {
        showNotification('لطفاً ابتدا یک کانفیگ انتخاب کنید.');
        return;
      }
      setConnectionStats((prev) => ({ ...prev, connecting: true }));
      setTimeout(() => {
        setConnectionStats({
          isConnected: true,
          connecting: false,
          activeConfigId: activeConfig.id,
          connectedSince: Date.now(),
          downloadSpeedKBps: 180 + Math.random() * 200,
          uploadSpeedKBps: 45 + Math.random() * 60,
          totalDownloadedMB: 0,
          totalUploadedMB: 0,
          latencyMs: activeConfig.ping && activeConfig.ping > 0 ? activeConfig.ping : 84,
          packetLossPercent: 0,
        });
        showNotification(`با موفقیت به «${activeConfig.name}» متصل شدید.`);
        confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
      }, 600);
    }
  };

  const handleSelectConfig = (cfg: ConfigItem) => {
    setActiveConfigId(cfg.id);
    if (!connectionStats.isConnected) {
      handleToggleConnection();
    }
  };

  const handleSelectFastest = () => {
    const healthyList = configs.filter((c) => c.ping !== null && c.ping > 0);
    if (healthyList.length === 0) {
      showNotification('ابتدا روی «تست پینگ همه» کلیک کنید تا سریع‌ترین سرور شناسایی شود.');
      return;
    }
    const fastest = [...healthyList].sort((a, b) => (a.ping || 999) - (b.ping || 999))[0];
    if (fastest) {
      setActiveConfigId(fastest.id);
      showNotification(`بهترین سرور انتخاب شد: ${fastest.name} (${fastest.ping}ms)`);
      if (!connectionStats.isConnected) {
        handleToggleConnection();
      }
    }
  };

  // Ping Testing Handlers
  const handleTestSingleConfigPing = async (cfg: ConfigItem) => {
    setConfigs((prev) =>
      prev.map((c) => (c.id === cfg.id ? { ...c, status: 'testing' } : c))
    );
    const { ping, status } = await testConfigPing(cfg);
    setConfigs((prev) =>
      prev.map((c) => (c.id === cfg.id ? { ...c, ping, status } : c))
    );
  };

  const handleBatchPing = async () => {
    if (configs.length === 0 || isTestingPing) return;
    setIsTestingPing(true);
    setPingProgress({ current: 0, total: configs.length });

    // Set all to testing
    setConfigs((prev) => prev.map((c) => ({ ...c, status: 'testing' })));

    await batchTestConfigs(configs, (tested, total, updated) => {
      setPingProgress({ current: tested, total });
      setConfigs((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
    });

    setIsTestingPing(false);
    setPingProgress(null);
    showNotification('تست پینگ همه کانفیگ‌ها به پایان رسید.');
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
  };

  // Clean Dead Nodes (حذف کانفیگ‌های قطع و خراب)
  const handleDeleteDeadConfigs = () => {
    const beforeCount = configs.length;
    const cleaned = configs.filter((c) => c.ping !== -1 && c.status !== 'dead');
    const removedCount = beforeCount - cleaned.length;
    setConfigs(cleaned);
    showNotification(`${removedCount} کانفیگ قطع و نامعتبر از لیست حذف شد.`);
  };

  // Add Configs
  const handleAddConfigs = (newConfigs: ConfigItem[]) => {
    // Prepend and deduplicate
    const seen = new Set(configs.map((c) => c.raw));
    const toAdd = newConfigs.filter((c) => !seen.has(c.raw));
    setConfigs((prev) => [...toAdd, ...prev]);
    showNotification(`${toAdd.length} کانفیگ با موفقیت به لیست اضافه شد.`);
  };

  // Delete Config
  const handleDeleteConfig = (id: string) => {
    setConfigs((prev) => prev.filter((c) => c.id !== id));
    if (activeConfigId === id) setActiveConfigId(null);
  };

  // Toggle Favorite
  const handleToggleFavorite = (id: string) => {
    setConfigs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  };

  // Channel Sync Handlers
  const handleSyncAllChannels = async () => {
    setIsSyncingChannels(true);
    let totalHarvested = 0;

    for (const channel of channels.filter((c) => c.enabled)) {
      const res = await fetchChannelConfigs(channel);
      if (res.success && res.configs.length > 0) {
        totalHarvested += res.configs.length;
        handleAddConfigs(res.configs);
      }
    }

    setIsSyncingChannels(false);
    showNotification(`دریافت خودکار انجام شد! +${totalHarvested} سرور تازه اضافه شد.`);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
  };

  const handleSyncSingleChannel = async (channel: ChannelSource) => {
    setIsSyncingChannels(true);
    const res = await fetchChannelConfigs(channel);
    setIsSyncingChannels(false);
    if (res.success && res.configs.length > 0) {
      handleAddConfigs(res.configs);
      showNotification(`+${res.configs.length} سرور از «${channel.name}» دریافت شد.`);
    }
  };

  const handleToggleChannel = (id: string) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const handleAddChannel = (name: string, handle: string, url: string) => {
    const newChan: ChannelSource = {
      id: `ch_custom_${Date.now()}`,
      name,
      handle,
      url,
      count: 0,
      status: 'active',
      enabled: true,
    };
    setChannels((prev) => [newChan, ...prev]);
    showNotification(`کانال «${name}» با موفقیت اضافه شد.`);
    handleSyncSingleChannel(newChan);
  };

  const handleDeleteChannel = (id: string) => {
    setChannels((prev) => prev.filter((c) => c.id !== id));
  };

  // Telegram Proxies Handlers
  const handleTestTgProxyPing = async (proxy: TelegramProxyItem) => {
    const { ping, status } = await testTelegramProxyPing(proxy);
    setTelegramProxies((prev) =>
      prev.map((p) => (p.id === proxy.id ? { ...p, ping, status } : p))
    );
  };

  const handleTestAllTgProxies = async () => {
    setIsTestingPing(true);
    for (const proxy of telegramProxies) {
      await handleTestTgProxyPing(proxy);
    }
    setIsTestingPing(false);
    showNotification('تست پینگ پروکسی‌های تلگرام کامل شد.');
  };

  const handleAddCustomTgProxy = (proxy: TelegramProxyItem) => {
    setTelegramProxies((prev) => [proxy, ...prev]);
    showNotification('پروکسی اختصاصی تلگرام اضافه شد.');
    confetti({ particleCount: 30, spread: 50 });
  };

  // Filtered & Sorted Configs List
  const filteredConfigs = useMemo(() => {
    return configs.filter((c) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(query);
        const matchesServer = c.server.toLowerCase().includes(query);
        const matchesCountry = c.country.toLowerCase().includes(query);
        const matchesPort = c.port.toString().includes(query);
        if (!matchesName && !matchesServer && !matchesCountry && !matchesPort) return false;
      }

      // Protocol filter
      if (filterProtocol !== 'all' && c.protocol !== filterProtocol) {
        return false;
      }

      // Status / Favorite filter
      if (filterStatus === 'healthy' && (c.ping === null || c.ping <= 0 || c.status === 'dead')) {
        return false;
      }
      if (filterStatus === 'slow' && c.status !== 'slow') {
        return false;
      }
      if (filterStatus === 'favorites' && !c.isFavorite) {
        return false;
      }

      // Country filter
      if (filterCountry !== 'all' && c.countryCode !== filterCountry) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'ping_asc') {
        const pingA = a.ping !== null && a.ping > 0 ? a.ping : 9999;
        const pingB = b.ping !== null && b.ping > 0 ? b.ping : 9999;
        return pingA - pingB;
      }
      if (sortBy === 'newest') {
        return b.addedAt - a.addedAt;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [configs, searchQuery, filterProtocol, filterStatus, filterCountry, sortBy]);

  // Countries extracted for filter
  const availableCountries = useMemo(() => {
    const map = new Map<string, { code: string; name: string; flag: string; count: number }>();
    configs.forEach((c) => {
      const existing = map.get(c.countryCode);
      if (existing) {
        existing.count++;
      } else {
        map.set(c.countryCode, {
          code: c.countryCode,
          name: c.country,
          flag: c.flag,
          count: 1,
        });
      }
    });
    return Array.from(map.values());
  }, [configs]);

  const healthyCount = useMemo(() => {
    return configs.filter((c) => c.ping !== null && c.ping > 0 && c.status === 'healthy').length;
  }, [configs]);

  // If user is not authenticated, show AuthGate
  if (!activeUser) {
    return (
      <AuthGate
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  return (
    <div
      id="app-root-viewport"
      className={`min-h-screen w-full transition-colors duration-500 ${theme.bgClass} flex flex-col relative overflow-x-hidden`}
    >
      {/* Dynamic Ambient Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className={`absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[160px] opacity-25 transition-all duration-700 ${
            currentTheme === 'pink'
              ? 'bg-rose-500'
              : currentTheme === 'yellow'
              ? 'bg-yellow-500'
              : 'bg-zinc-500'
          }`}
        />
        <div
          className={`absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full blur-[160px] opacity-20 transition-all duration-700 ${
            currentTheme === 'pink'
              ? 'bg-fuchsia-600'
              : currentTheme === 'yellow'
              ? 'bg-amber-500'
              : 'bg-zinc-700'
          }`}
        />
      </div>

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-zinc-900/95 border border-white/20 text-white text-xs font-bold shadow-2xl flex items-center gap-2 backdrop-blur-xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        activeUser={activeUser}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'admin') {
            setIsAdminModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onLogout={handleLogout}
        onBatchPing={handleBatchPing}
        isTestingPing={isTestingPing}
        totalConfigs={configs.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 z-10">
        {/* Active Connection Widget (Visible on Configs & Channels) */}
        {activeTab !== 'telegram' && (
          <ConnectionWidget
            currentTheme={currentTheme}
            activeConfig={activeConfig}
            connectionStats={connectionStats}
            onToggleConnection={handleToggleConnection}
            onSelectFastest={handleSelectFastest}
          />
        )}

        {/* Batch Ping Progress Bar */}
        {pingProgress && (
          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 shadow-lg space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span className="font-bold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-yellow-400 animate-spin" />
                در حال تست پینگ زنده سرورها...
              </span>
              <span className="font-mono font-bold text-white">
                {pingProgress.current} از {pingProgress.total} (
                {Math.round((pingProgress.current / pingProgress.total) * 100)}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  currentTheme === 'pink'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-400'
                    : currentTheme === 'yellow'
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-300'
                    : 'bg-white'
                }`}
                style={{ width: `${(pingProgress.current / pingProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* TAB 1: ALL CONFIGS (پروتکل‌های متنوع و تست پینگ) */}
        {activeTab === 'configs' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div
              id="configs-filter-panel"
              className={`p-4 rounded-3xl border ${theme.cardBorder} ${theme.cardBg} shadow-lg space-y-3.5`}
            >
              {/* Search input + Quick Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative w-full flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو در سرورها، کشورها، پروتکل، پورت یا آدرس IP..."
                    className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
                  />
                  <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Clean dead configs button */}
                  <button
                    type="button"
                    onClick={handleDeleteDeadConfigs}
                    className="px-3 py-2.5 rounded-2xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap"
                    title="حذف کانفیگ‌هایی که قطع هستند"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف قطعی‌ها</span>
                  </button>

                  {/* Sort selector */}
                  <div className="relative shrink-0">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-white/40 cursor-pointer"
                    >
                      <option value="ping_asc">کمترین پینگ (⚡ Fastest)</option>
                      <option value="newest">جدیدترین (Newest)</option>
                      <option value="name">بر اساس نام (A-Z)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Protocol Filters Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[11px] font-bold text-zinc-400 shrink-0 ml-1">پروتکل:</span>
                {[
                  { id: 'all', label: 'همه پروتکل‌ها' },
                  { id: 'vless', label: 'VLESS' },
                  { id: 'vmess', label: 'VMess' },
                  { id: 'trojan', label: 'Trojan' },
                  { id: 'hysteria2', label: 'Hysteria2' },
                  { id: 'ss', label: 'Shadowsocks' },
                  { id: 'tuic', label: 'TUIC' },
                  { id: 'warp', label: 'WARP+' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setFilterProtocol(p.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                      filterProtocol === p.id
                        ? `${theme.accentBg} scale-102`
                        : 'bg-black/40 text-zinc-400 hover:text-zinc-200 border border-white/5'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Status & Country Filters */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
                {/* Status Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-2.5 py-1 rounded-xl font-medium transition-all ${
                      filterStatus === 'all'
                        ? 'bg-white/20 text-white font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    همه ({configs.length})
                  </button>

                  <button
                    onClick={() => setFilterStatus('healthy')}
                    className={`px-2.5 py-1 rounded-xl font-medium transition-all flex items-center gap-1 ${
                      filterStatus === 'healthy'
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                        : 'text-zinc-400 hover:text-emerald-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>سالم و آنلاین ({healthyCount})</span>
                  </button>

                  <button
                    onClick={() => setFilterStatus('favorites')}
                    className={`px-2.5 py-1 rounded-xl font-medium transition-all flex items-center gap-1 ${
                      filterStatus === 'favorites'
                        ? 'bg-yellow-500/20 text-yellow-300 font-bold border border-yellow-500/40'
                        : 'text-zinc-400 hover:text-yellow-300'
                    }`}
                  >
                    <span>⭐ علاقه‌مندی‌ها</span>
                  </button>
                </div>

                {/* Country dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400 text-[11px]">موقعیت:</span>
                  <select
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                    className="px-2.5 py-1 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="all">تمام کشورها</option>
                    {availableCountries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Configs Count / Results bar */}
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span>
                نمایش <span className="font-bold text-white font-mono">{filteredConfigs.length}</span> از{' '}
                <span className="font-mono">{configs.length}</span> سرور
              </span>

              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold font-mono">
                  {healthyCount} سرور فعال و کم‌پینگ
                </span>
              </div>
            </div>

            {/* Config Cards Grid */}
            {filteredConfigs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredConfigs.map((cfg) => (
                  <ConfigCard
                    key={cfg.id}
                    config={cfg}
                    currentTheme={currentTheme}
                    isActive={activeConfigId === cfg.id && connectionStats.isConnected}
                    onConnect={handleSelectConfig}
                    onTestPing={handleTestSingleConfigPing}
                    onDelete={handleDeleteConfig}
                    onToggleFavorite={handleToggleFavorite}
                    onShowQr={(item) => setQrItem(item)}
                  />
                ))}
              </div>
            ) : (
              <div
                className={`p-10 rounded-3xl border ${theme.cardBorder} ${theme.cardBg} text-center space-y-3`}
              >
                <Globe className="w-12 h-12 mx-auto text-zinc-600 animate-pulse" />
                <h3 className="text-base font-bold text-white">هیچ کانفیگی مطابق فیلتر یافت نشد</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  می‌توانید فیلترها را ریست کنید یا با دکمه زیر کانفیگ‌های تازه را از کانال‌ها دریافت نمایید.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterProtocol('all');
                      setFilterStatus('all');
                      setFilterCountry('all');
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
                  >
                    پاک کردن فیلترها
                  </button>
                  <button
                    onClick={handleSyncAllChannels}
                    className={`px-4 py-2 rounded-xl text-xs font-bold ${theme.accentBg}`}
                  >
                    دریافت خودکار از کانال‌ها
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CHANNEL FETCHER (دریافت خودکار از کانال‌ها) */}
        {activeTab === 'channels' && (
          <ChannelFetcherTab
            currentTheme={currentTheme}
            channels={channels}
            isSyncing={isSyncingChannels}
            onSyncAllChannels={handleSyncAllChannels}
            onSyncSingleChannel={handleSyncSingleChannel}
            onToggleChannel={handleToggleChannel}
            onAddChannel={handleAddChannel}
            onDeleteChannel={handleDeleteChannel}
            totalAutoFetched={configs.filter((c) => c.source === 'channel' || c.source === 'auto_pool').length}
          />
        )}

        {/* TAB 3: TELEGRAM PROXY (پروکسی تلگرام) */}
        {activeTab === 'telegram' && (
          <TelegramProxyTab
            currentTheme={currentTheme}
            proxies={telegramProxies}
            onTestProxyPing={handleTestTgProxyPing}
            onTestAllProxies={handleTestAllTgProxies}
            onAddCustomProxy={handleAddCustomTgProxy}
            onShowQr={(proxy) => setQrItem(proxy)}
            isTestingPing={isTestingPing}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 py-6 text-center text-xs text-zinc-500 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-zinc-400">ninipro v3.5</span>
          <span>•</span>
          <span>سامانه هوشمند کانفیگ خور و پروکسی تلگرام</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>تمامی داده‌ها و اشتراک‌ها به صورت ایمن ذخیره می‌شوند</span>
        </div>
      </footer>

      {/* Admin Panel Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentTheme={currentTheme}
        totalConfigsCount={configs.length}
        healthyConfigsCount={healthyCount}
      />

      {/* Add Config Modal */}
      <AddConfigModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        currentTheme={currentTheme}
        onAddConfigs={handleAddConfigs}
      />

      {/* QR Code Modal */}
      <QrModal
        isOpen={!!qrItem}
        onClose={() => setQrItem(null)}
        currentTheme={currentTheme}
        item={qrItem}
      />
    </div>
  );
}
