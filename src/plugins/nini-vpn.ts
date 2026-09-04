export interface NiniVpnStatus {
  running: boolean;
  lastError: string;
}

export interface NiniVpnPlugin {
  connect(options: { config: string }): Promise<{ status: string }>;
  disconnect(options?: Record<string, never>): Promise<{ status: string }>;
  status(options?: Record<string, never>): Promise<NiniVpnStatus>;
  addListener(
    eventName: 'vpnEvent',
    listener: (event: { event: string }) => void,
  ): Promise<PluginListenerHandle>;
}

export interface PluginListenerHandle {
  remove: () => Promise<void>;
}

declare global {
  interface PluginRegistry {
    NiniVpn?: NiniVpnPlugin;
  }
}
