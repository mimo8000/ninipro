import React, { useState } from 'react';
import { ConfigItem, ThemeMode } from '../types';
import { THEMES } from '../utils/theme';
import {
  Zap,
  Copy,
  QrCode,
  Check,
  Trash2,
  Star,
  Shield,
  Activity,
  ArrowUpRight,
  Radio,
  Server,
  Play,
  Pause,
} from 'lucide-react';

interface ConfigCardProps {
  config: ConfigItem;
  currentTheme: ThemeMode;
  isActive: boolean;
  onConnect: (config: ConfigItem) => void;
  onTestPing: (config: ConfigItem) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onShowQr: (config: ConfigItem) => void;
}

export const ConfigCard: React.FC<ConfigCardProps> = ({
  config,
  currentTheme,
  isActive,
  onConnect,
  onTestPing,
  onDelete,
  onToggleFavorite,
  onShowQr,
}) => {
  const theme = THEMES[currentTheme];
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(config.raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getProtocolColor = (proto: ConfigItem['protocol']) => {
    switch (proto) {
      case 'vless':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'vmess':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'trojan':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'hysteria2':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'ss':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'tuic':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'warp':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      default:
        return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40';
    }
  };

  const renderPingBadge = () => {
    if (config.status === 'testing') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-yellow-950/60 border border-yellow-500/40 text-yellow-300 text-xs font-mono">
          <div className="w-2.5 h-2.5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <span>تست...</span>
        </div>
      );
    }

    if (config.ping === null || config.status === 'untested') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTestPing(config);
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-400 hover:text-white text-xs font-mono transition-all"
          title="کلیک برای تست پینگ"
        >
          <Zap className="w-3 h-3 text-zinc-400" />
          <span>تست پینگ</span>
        </button>
      );
    }

    if (config.ping <= 0 || config.status === 'dead') {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>قطع (Timeout)</span>
        </div>
      );
    }

    const isFast = config.ping < 180;
    const isMedium = config.ping >= 180 && config.ping < 320;

    return (
      <div
        className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-xs font-mono font-bold border ${
          isFast
            ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
            : isMedium
            ? 'bg-yellow-950/70 border-yellow-500/50 text-yellow-300'
            : 'bg-orange-950/70 border-orange-500/50 text-orange-300'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isFast ? 'bg-emerald-400 animate-pulse' : isMedium ? 'bg-yellow-400' : 'bg-orange-400'
          }`}
        />
        <span>{config.ping} ms</span>
      </div>
    );
  };

  return (
    <div
      id={`config-card-${config.id}`}
      onClick={() => onConnect(config)}
      className={`rounded-2xl border transition-all duration-200 p-3.5 sm:p-4 cursor-pointer relative group ${
        isActive
          ? `border-white/50 bg-white/10 shadow-lg ${theme.glowClass} ring-1 ring-white/30`
          : `${theme.cardBorder} ${theme.cardBg} hover:scale-[1.01]`
      }`}
    >
      {/* Top row: Flag, Name, Protocol, Ping */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-xl shrink-0" title={config.country}>
            {config.flag}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[180px] sm:max-w-xs block">
                {config.name}
              </span>
              {config.isFavorite && (
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
              )}
            </div>
            <span className="text-[11px] text-zinc-400 font-mono block truncate">
              {config.server}:{config.port}
            </span>
          </div>
        </div>

        {/* Protocol & Ping */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-extrabold border ${getProtocolColor(config.protocol)}`}>
            {config.protocol.toUpperCase()}
          </span>
          {renderPingBadge()}
        </div>
      </div>

      {/* Middle row: details tags (Security, Network, Source) */}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-400 my-2 pt-2 border-t border-white/5">
        <span className="px-2 py-0.5 rounded-md bg-black/40 border border-white/5 font-mono">
          {config.security || 'NONE'}
        </span>
        <span className="px-2 py-0.5 rounded-md bg-black/40 border border-white/5 font-mono">
          {config.network.toUpperCase()}
        </span>
        {config.sni && (
          <span className="px-2 py-0.5 rounded-md bg-black/40 border border-white/5 font-mono truncate max-w-[120px]" title={config.sni}>
            SNI: {config.sni}
          </span>
        )}
        {config.sourceName && (
          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300">
            {config.sourceName}
          </span>
        )}
      </div>

      {/* Bottom Action buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-1">
        <div className="flex items-center gap-1">
          {/* Connect Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onConnect(config);
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
              isActive
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isActive ? 'متصل' : 'اتصال'}</span>
          </button>

          {/* Single Ping test button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTestPing(config);
            }}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white border border-white/5 transition-all"
            title="تست پینگ مجدد"
          >
            <Zap className="w-3.5 h-3.5" />
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white border border-white/5 transition-all relative"
            title="کپی لینک کانفیگ"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* QR Code Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShowQr(config);
            }}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white border border-white/5 transition-all"
            title="نمایش بارکد QR"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Favorite Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(config.id);
            }}
            className={`p-1.5 rounded-xl border border-white/5 transition-all ${
              config.isFavorite
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                : 'bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-zinc-200'
            }`}
            title="افزودن به علاقه‌مندی‌ها"
          >
            <Star className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(config.id);
            }}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-white/5 hover:border-red-800/40 transition-all"
            title="حذف کانفیگ"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
