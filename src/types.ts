export type ThemeMode = 'pink' | 'black' | 'yellow';

export type ProtocolType = 
  | 'vless' 
  | 'vmess' 
  | 'trojan' 
  | 'ss' 
  | 'ssr' 
  | 'tuic' 
  | 'hysteria2' 
  | 'wireguard' 
  | 'warp' 
  | 'mixed' 
  | 'other';

export type ConfigStatus = 'untested' | 'testing' | 'healthy' | 'slow' | 'dead';

export interface ConfigItem {
  id: string;
  name: string;
  raw: string;
  protocol: ProtocolType;
  server: string;
  port: number;
  ping: number | null; // in ms, -1 for timeout/dead
  status: ConfigStatus;
  country: string;
  countryCode: string;
  flag: string;
  security: string;
  network: string; // tcp, ws, grpc, kcp, httpupgrade, quic
  path?: string;
  sni?: string;
  alpn?: string;
  fingerprint?: string;
  addedAt: number;
  source: 'channel' | 'manual' | 'subscription' | 'auto_pool';
  sourceName?: string;
  isFavorite?: boolean;
}

export type TelegramProxyProtocol = 
  | 'mtproto'
  | 'socks5'
  | 'http'
  | 'vless'
  | 'vmess'
  | 'trojan'
  | 'ss'
  | 'hysteria2'
  | 'tuic'
  | 'wireguard';

export interface TelegramProxyItem {
  id: string;
  title: string;
  server: string;
  port: number;
  secret: string; // MTProto secret or password/token or key
  user?: string; // for Socks5/HTTP auth
  pass?: string;
  ping: number | null;
  status: ConfigStatus;
  sponsorChannel?: string;
  country: string;
  countryCode: string;
  flag: string;
  type: TelegramProxyProtocol;
  protocolDetails?: string; // e.g. "TLS 1.3 Fake TLS", "Socks5 Auth", "VLESS Reality Direct", "Trojan gRPC"
  v2rayRawConfig?: string; // Optional direct v2ray URI if bridged
  isCustom?: boolean;
}

export interface SubscriptionUser {
  code: string;
  tier: 'admin_unlimited' | 'vip_premium' | 'standard';
  userName: string;
  activatedAt: number;
  expiresAt: number | null; // null = Unlimited
  trafficTotalGB: number | null; // null = Unlimited
  trafficUsedGB: number;
  isAdmin: boolean;
  notes?: string;
  status: 'active' | 'suspended' | 'expired';
}

export interface ChannelSource {
  id: string;
  name: string;
  handle: string;
  url: string;
  count: number;
  lastFetched?: number;
  status: 'active' | 'error' | 'syncing';
  enabled: boolean;
}

export interface ConnectionStats {
  isConnected: boolean;
  connecting: boolean;
  activeConfigId: string | null;
  connectedSince: number | null;
  downloadSpeedKBps: number;
  uploadSpeedKBps: number;
  totalDownloadedMB: number;
  totalUploadedMB: number;
  latencyMs: number;
  packetLossPercent: number;
}
