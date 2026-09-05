import React, { useEffect, useState } from 'react';
import { X, RefreshCw, FileText } from 'lucide-react';
import { vpnLogs } from '../utils/vpnManager';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LogsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const refresh = async () => {
    setLoading(true);
    const l = await vpnLogs();
    setLogs(l || 'هنوز لاگی ثبت نشده. دکمه کانکت را بزنید.');
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      refresh();
      const t = setInterval(refresh, 2000);
      return () => clearInterval(t);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-t-3xl sm:rounded-3xl p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <FileText className="w-4 h-4 text-yellow-400" />
            گزارشات اتصال
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              title="بروزرسانی"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="bg-black/60 border border-zinc-800 rounded-2xl p-3 h-72 overflow-y-auto">
          <pre className="text-[11px] leading-5 text-emerald-300 font-mono whitespace-pre-wrap break-all text-left" dir="ltr">
            {logs}
          </pre>
        </div>
        <p className="text-[10px] text-zinc-500 mt-2">
          این لاگ‌ها زنده از هسته sing-box می‌آیند — هر خطایی اینجا ثبت می‌شود.
        </p>
      </div>
    </div>
  );
};
