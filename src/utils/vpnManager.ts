import { Capacitor } from '@capacitor/core';
import { buildSingBoxProfile } from './singboxConverter';
import type { PluginListenerHandle } from '../plugins/nini-vpn';

export type VpnState = 'disconnected' | 'connecting' | 'connected' | 'error';

let listenerHandle: PluginListenerHandle | null = null;
const listeners = new Set<(e: { event: string }) => void>();

export function onVpnEvent(cb: (e: { event: string }) => void): () => void {
  listeners.add(cb);
  if (!listenerHandle) {
    const NiniVpn = (Capacitor as any).getPlugin?.('NiniVpn') ?? (window as any).Capacitor?.Plugins?.NiniVpn;
    if (NiniVpn?.addListener) {
      listenerHandle = NiniVpn.addListener('vpnEvent', (e: { event: string }) => {
        listeners.forEach((l) => l(e));
      });
    }
  }
  return () => listeners.delete(cb);
}

async function call(method: string, arg?: any): Promise<any> {
  const NiniVpn = (Capacitor as any).getPlugin?.('NiniVpn') ?? (window as any).Capacitor?.Plugins?.NiniVpn;
  if (!NiniVpn) throw new Error('NiniVpn plugin unavailable (native layer missing)');
  return NiniVpn[method](arg ?? {});
}

export async function connectVpn(links: string[], name = 'NiniPro'): Promise<VpnState> {
  const profile = buildSingBoxProfile(links, name);
  if (!profile) throw new Error('هیچ کانفیگ معتبری برای اتصال یافت نشد');
  try {
    await call('connect', { config: profile });
    return 'connecting';
  } catch (e: any) {
    return 'error';
  }
}

export async function disconnectVpn(): Promise<void> {
  try {
    await call('disconnect');
  } catch {}
}

export async function vpnStatus(): Promise<{ running: boolean; lastError: string }> {
  try {
    const r = await call('status');
    return { running: !!r.running, lastError: r.lastError || '' };
  } catch {
    return { running: false, lastError: '' };
  }
}
