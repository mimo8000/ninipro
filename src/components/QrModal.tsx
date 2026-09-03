import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ConfigItem, TelegramProxyItem, ThemeMode } from '../types';
import { THEMES } from '../utils/theme';
import { getTelegramProxyLinks } from '../utils/telegramProxies';
import { X, Copy, Check, QrCode, Sparkles } from 'lucide-react';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeMode;
  item: ConfigItem | TelegramProxyItem | null;
}

export const QrModal: React.FC<QrModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  item,
}) => {
  const theme = THEMES[currentTheme];
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

  const isTgProxy = 'type' in item && 'secret' in item;
  const tgProxy = isTgProxy ? (item as TelegramProxyItem) : null;
  const tgLinks = tgProxy ? getTelegramProxyLinks(tgProxy) : null;
  
  const rawString = tgProxy
    ? tgProxy.v2rayRawConfig || tgLinks?.appLink || tgProxy.secret
    : (item as ConfigItem).raw;
    
  const title = tgProxy ? tgProxy.title : (item as ConfigItem).name;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        id="qr-modal-container"
        className={`w-full max-w-sm rounded-3xl border ${theme.cardBorder} ${theme.cardBg} p-6 shadow-2xl flex flex-col items-center text-center space-y-4`}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-white" />
            <span className="text-sm font-bold text-white">بارکد QR اتصال سریع</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Box */}
        <div className="p-4 rounded-2xl bg-white shadow-xl flex items-center justify-center">
          <QRCodeSVG
            value={rawString}
            size={220}
            level="M"
            includeMargin={false}
          />
        </div>

        {/* Title */}
        <div className="w-full">
          <h4 className="text-sm font-bold text-white truncate max-w-xs mx-auto">
            {title}
          </h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            با دوربین گوشی یا نرم‌افزار v2rayNG / Streisand اسکن کنید
          </p>
        </div>

        {/* Raw text preview */}
        <div className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-left" dir="ltr">
          <p className="text-[10px] font-mono text-zinc-300 truncate">
            {rawString}
          </p>
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95 ${theme.accentBg}`}
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'کپی شد!' : 'کپی لینک خام کانفیگ'}</span>
        </button>
      </div>
    </div>
  );
};
