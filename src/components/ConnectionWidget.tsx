import React, { useEffect, useState } from 'react';
import { ConfigItem, ConnectionStats, ThemeMode } from '../types';
import { THEMES } from '../utils/theme';
import {
  Power,
  ArrowDown,
  ArrowUp,
  Activity,
  Clock,
  ShieldCheck,
  Zap,
  Globe,
  Wifi,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface ConnectionWidgetProps {
  currentTheme: ThemeMode;
  activeConfig: ConfigItem | null;
  connectionStats: ConnectionStats;
  onToggleConnection: () => void;
  onSelectFastest: () => void;
}

export const ConnectionWidget: React.FC<ConnectionWidgetProps> = ({
  currentTheme,
  activeConfig,
  connectionStats,
  onToggleConnection,
  onSelectFastest,
}) => {
  const theme = THEMES[currentTheme];
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (connectionStats.isConnected && connectionStats.connectedSince) {
      interval = setInterval(() => {
        setElapsedSec(Math.floor((Date.now() - (connectionStats.connectedSince || Date.now())) / 1000));
      }, 1000);
    } else {
      setElapsedSec(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connectionStats.isConnected, connectionStats.connectedSince]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const h = Math.floor(m / 60);
    const remM = m % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${remM.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="connection-widget-card"
      className={`w-full rounded-3xl border ${theme.cardBorder} ${theme.cardBg} p-4 sm:p-5 shadow-xl transition-all duration-300 relative overflow-hidden`}
    >
      {/* Glow highlight background */}
      <div
        className={`absolute -right-20 -top-20 w-48 h-48 rounded-full blur-[90px] pointer-events-none transition-all duration-500 opacity-20 ${
          connectionStats.isConnected
            ? 'bg-emerald-500'
            : currentTheme === 'pink'
            ? 'bg-pink-500'
            : currentTheme === 'yellow'
            ? 'bg-yellow-500'
            : 'bg-zinc-400'
        }`}
      />

      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left/Main status area */}
        <div className="flex items-center gap-3.5 w-full lg:w-auto">
          {/* Big Connect Button */}
          <button
            id="connection-toggle-btn"
            onClick={onToggleConnection}
            disabled={connectionStats.connecting}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 relative group shadow-lg ${
              connectionStats.isConnected
                ? 'bg-emerald-500 text-black shadow-emerald-500/40 ring-4 ring-emerald-500/20 animate-pulse'
                : connectionStats.connecting
                ? 'bg-amber-500 text-black animate-spin'
                : `${theme.accentBg} ring-2 ring-white/10 hover:scale-105 active:scale-95`
            }`}
            title={connectionStats.isConnected ? 'قطع اتصال' : 'اتصال به پروکسی'}
          >
            <Power className="w-7 h-7 stroke-[2.5]" />
          </button>

          {/* Node and Connection Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  connectionStats.isConnected
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                    : connectionStats.connecting
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    connectionStats.isConnected
                      ? 'bg-emerald-400 animate-ping'
                      : connectionStats.connecting
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-zinc-500'
                  }`}
                />
                <span>
                  {connectionStats.isConnected
                    ? 'متصل و ایمن (Active)'
                    : connectionStats.connecting
                    ? 'در حال برقراری تونل...'
                    : 'آماده اتصال (Disconnected)'}
                </span>
              </span>

              {activeConfig && (
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-mono text-[11px] font-bold">
                  {activeConfig.protocol.toUpperCase()}
                </span>
              )}
            </div>

            <div className="mt-1 flex items-center gap-2 truncate">
              {activeConfig ? (
                <>
                  <span className="text-base">{activeConfig.flag}</span>
                  <span className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                    {activeConfig.name}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
                    ({activeConfig.server}:{activeConfig.port})
                  </span>
                </>
              ) : (
                <span className="text-xs text-zinc-400">
                  هیچ کانفیگی انتخاب نشده است. یک کانفیگ انتخاب کنید یا روی «بهترین پینگ» کلیک کنید.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Stats & Speedometers */}
        <div className="w-full lg:w-auto flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
          {/* Download Speed */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/40 border border-white/5 min-w-[100px]">
            <div className="w-7 h-7 rounded-xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center">
              <ArrowDown className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[10px] text-zinc-400">دانلود</span>
              <span className="block text-xs font-mono font-bold text-white">
                {connectionStats.isConnected ? `${connectionStats.downloadSpeedKBps.toFixed(1)} KB/s` : '0.0 KB/s'}
              </span>
            </div>
          </div>

          {/* Upload Speed */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/40 border border-white/5 min-w-[100px]">
            <div className="w-7 h-7 rounded-xl bg-cyan-950/60 text-cyan-400 flex items-center justify-center">
              <ArrowUp className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[10px] text-zinc-400">آپلود</span>
              <span className="block text-xs font-mono font-bold text-white">
                {connectionStats.isConnected ? `${connectionStats.uploadSpeedKBps.toFixed(1)} KB/s` : '0.0 KB/s'}
              </span>
            </div>
          </div>

          {/* Latency & Ping */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/40 border border-white/5 min-w-[90px]">
            <div className="w-7 h-7 rounded-xl bg-yellow-950/60 text-yellow-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[10px] text-zinc-400">پینگ زنده</span>
              <span className="block text-xs font-mono font-bold text-white">
                {connectionStats.isConnected && connectionStats.latencyMs > 0
                  ? `${connectionStats.latencyMs} ms`
                  : activeConfig?.ping && activeConfig.ping > 0
                  ? `${activeConfig.ping} ms`
                  : '-- ms'}
              </span>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/40 border border-white/5 min-w-[90px]">
            <div className="w-7 h-7 rounded-xl bg-purple-950/60 text-purple-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[10px] text-zinc-400">مدت اتصال</span>
              <span className="block text-xs font-mono font-bold text-white">
                {formatTime(elapsedSec)}
              </span>
            </div>
          </div>

          {/* Auto Select Fastest Button */}
          <button
            id="select-fastest-btn"
            onClick={onSelectFastest}
            className="px-3 py-2 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-all active:scale-95"
            title="انتخاب خودکار کمترین پینگ"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className="hidden sm:inline">اتصال به بهترین پینگ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
