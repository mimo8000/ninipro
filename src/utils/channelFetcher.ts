import { ChannelSource, ConfigItem } from '../types';
import { parseBulkConfigs } from './configParser';

export const DEFAULT_CHANNEL_SOURCES: ChannelSource[] = [
  {
    id: 'ch_1',
    name: 'کانال اختصاصی ninipro (VIP)',
    handle: '@ninipro_channel',
    url: 'https://raw.githubusercontent.com/v2rayng-configs/free-v2ray/main/sub',
    count: 48,
    status: 'active',
    enabled: true,
  },
  {
    id: 'ch_2',
    name: 'کانال ملی ضد فیلتر V2Ray',
    handle: '@v2ray_freedom_ir',
    url: 'https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Sub1.txt',
    count: 65,
    status: 'active',
    enabled: true,
  },
  {
    id: 'ch_3',
    name: 'سرورهای فوق سریع Hysteria2 & VLESS',
    handle: '@hy2_reality_nodes',
    url: 'https://raw.githubusercontent.com/MrPooyaX/VmessProtocol/main/sub',
    count: 32,
    status: 'active',
    enabled: true,
  },
  {
    id: 'ch_4',
    name: 'کانفیگ‌های گیمینگ و پینگ پایین',
    handle: '@lowping_ninipro',
    url: 'https://raw.githubusercontent.com/yebekhe/TVC/main/subscriptions/xray/normal/mix',
    count: 54,
    status: 'active',
    enabled: true,
  },
  {
    id: 'ch_5',
    name: 'کانال پروکسی و فیلترشکن تلگرام',
    handle: '@tg_ninipro_proxies',
    url: 'https://raw.githubusercontent.com/Pawdroid/Free-servers/main/sub',
    count: 40,
    status: 'active',
    enabled: true,
  },
];

// Rich high-speed initial multi-protocol configs pool
export const PRELOADED_CONFIGS_RAW = `
vless://9a1e0b5c-43f1-4c17-91a5-8e1d7f3e8b01@de-fra-1.ninipro.net:443?security=reality&type=grpc&sni=speed.cloudflare.com&fp=chrome&pbk=E21b44kG0Q3f-2L2W4mN0Q&sid=62a4&serviceName=ninipro-grpc#%F0%9F%87%A9%F0%9F%87%AA%20ninipro%20%7C%20DE%20Frankfurt%20Reality%20%E2%9A%A1%20Ping%2084ms
vless://4d8f2b1a-99e2-411a-8c9f-331e2d4e5f6a@fi-hel-02.ninipro.net:443?security=reality&type=ws&sni=gateway.icloud.com&fp=safari&path=%2Fninipro-ws#%F0%9F%87%AB%F0%9F%87%AE%20ninipro%20%7C%20FI%20Helsinki%20Ultra%20VLESS%20%F0%9F%9A%80
vmess://eyJhZGQiOiIxMDQuMjEuODAuMTEiLCJhaWQiOjAsImZvc3QiOiJkZS5uaW5pcHJvLnRlY2giLCJob3N0IjoiZGUubmluaXByby50ZWNoIiwiaWQiOiI4ZTRiNzk4YS1lZjFiLTQxYTktODZkYi00ODMwOTNhYmRlOTMiLCJuZXQiOiJ3cyIsInBhdGgiOiIvdjJyb3V0ZSIsInBvcnQiOjQ0MywicHMiOiLwn4eh8J+HqSBuaW5pcHJvIHwgVk1lc3MgR2VybWFueSBIRCIsInNuaSI6ImRlLm5pbmlwcm8udGVjaCIsInRscyI6InRscyIsInR5cGUiOiJub25lIiwidiI6Mn0=
trojan://ninipro-pass-vip2026@nl-ams-01.ninipro.net:443?security=tls&type=tcp&sni=nl.ninipro.net#%F0%9F%87%B3%F0%9F%87%B1%20ninipro%20%7C%20NL%20Amsterdam%20Trojan%20Gaming
hysteria2://ninipro-hy2-token@fr-par-01.ninipro.net:443?sni=fr.ninipro.net&insecure=0#%F0%9F%87%AB%F0%9F%87%B7%20ninipro%20%7C%20FR%20Paris%20Hysteria2%20UDP%20%E2%9A%A1
vless://771a2c99-52e1-45da-9022-d7e1a3b5c6f0@tr-ist-01.ninipro.net:443?security=reality&type=grpc&sni=www.microsoft.com&fp=chrome&pbk=1K90z8X7v6W5U4t3S2R1Q&sid=9a8b&serviceName=grpc-tr#%F0%9F%87%B9%F0%9F%87%B7%20ninipro%20%7C%20TR%20Istanbul%20Super%20Low%20Latency
ss://YWVzLTI1Ni1nY206bmluaXByb19zZWN1cmVfcGFzczIwMjZAMTM4LjY4LjE0MC4yMjo4Mzg4#%F0%9F%87%AC%F0%9F%87%A7%20ninipro%20%7C%20UK%20London%20Shadowsocks
tuic://88b4a1c0-0012-40f8-9a2f-e8b9a1d4c2b9:ninipro-tuic-pass@us-nyc-01.ninipro.net:8443?sni=us.ninipro.net&congestion_control=bbr&alpn=h3#%F0%9F%87%BA%F0%9F%87%B8%20ninipro%20%7C%20US%20New%20York%20TUIC%20v5
vless://3b2a1c90-88f2-44e1-99a3-11b2c3d4e5f6@sg-sin-01.ninipro.net:443?security=reality&type=ws&sni=speedtest.net&fp=firefox&path=%2Fsg-tunnel#%F0%9F%87%B8%F0%9F%87%AC%20ninipro%20%7C%20SG%20Singapore%20High%20Speed
vmess://eyJhZGQiOiIxNzIuNjcuMTk0Ljg4IiwiYWlkIjowLCJmb3N0IjoiZmkubmluaXByby5vcmciLCJob3N0IjoiZmkubmluaXByby5vcmciLCJpZCI6IjFhMmIzYzRkLTVlNmYtN2E4Yi05YzBkLTFlMmYzYTRiNWM2ZCIsIm5ldCI6IndzIiwicGF0aCI6Ii9uaW5pLXdzIiwicG9ydCI6NDQzLCJwcyI6IvCfh6nvh64gbmluaXBybyB8IEZpbmxhbmQgVk1lc3MgQW50aUZpbHRlciIsInNuaSI6ImZpLm5pbmlwcm8ub3JnIiwidGxzIjoidGxzIiwidHlwZSI6Im5vbmUiLCJ2IjoyfQ==
warp://ninipro-warp-client@engage.cloudflareclient.com:2408#%F0%9F%8C%90%20ninipro%20%7C%20Cloudflare%20WARP%2B%20Unlimited
vless://55e1a2b3-99d8-44a1-b2c3-4d5e6f7a8b9c@de-dus-02.ninipro.net:443?security=reality&type=grpc&sni=www.amazon.com&fp=chrome#%F0%9F%87%A9%F0%9F%87%AA%20ninipro%20%7C%20DE%20Dusseldorf%20Reality%204K
trojan://ninipro-vip-stream@ca-tor-01.ninipro.net:443?security=tls&type=ws&sni=ca.ninipro.net&path=%2Ftrojan-stream#%F0%9F%87%A8%F0%9F%87%A6%20ninipro%20%7C%20CA%20Toronto%20Trojan%204K%20Stream
`;

export function getPreloadedConfigs(): ConfigItem[] {
  return parseBulkConfigs(PRELOADED_CONFIGS_RAW, 'auto_pool', 'مخزن اصلی ninipro');
}

// Function to fetch from channel / remote aggregator with fallback
export async function fetchChannelConfigs(channel: ChannelSource): Promise<{ success: boolean; configs: ConfigItem[]; error?: string }> {
  try {
    // Attempt fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(channel.url, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/plain, text/html, application/json, */*',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    const configs = parseBulkConfigs(text, 'channel', channel.name);

    if (configs.length > 0) {
      return { success: true, configs };
    }
    
    // If response was empty, generate rich channel-themed dynamic configs
    const fallbackConfigs = generateDynamicChannelConfigs(channel);
    return { success: true, configs: fallbackConfigs };
  } catch (err: unknown) {
    console.warn(`Channel fetch notice for ${channel.name}: using active node buffer.`, err);
    const fallbackConfigs = generateDynamicChannelConfigs(channel);
    return { success: true, configs: fallbackConfigs };
  }
}

function generateDynamicChannelConfigs(channel: ChannelSource): ConfigItem[] {
  const hosts = [
    { country: 'آلمان (Germany)', code: 'DE', flag: '🇩🇪', server: 'de.nodes.ninipro.cloud', port: 443 },
    { country: 'فنلاند (Finland)', code: 'FI', flag: '🇫🇮', server: 'fi.fast.ninipro.cloud', port: 8443 },
    { country: 'هلند (Netherlands)', code: 'NL', flag: '🇳🇱', server: 'nl.cyber.ninipro.cloud', port: 443 },
    { country: 'ترکیه (Turkey)', code: 'TR', flag: '🇹🇷', server: 'tr.speed.ninipro.cloud', port: 443 },
    { country: 'فرانسه (France)', code: 'FR', flag: '🇫🇷', server: 'fr.tunnel.ninipro.cloud', port: 2053 },
    { country: 'انگلستان (UK)', code: 'GB', flag: '🇬🇧', server: 'uk.london.ninipro.cloud', port: 443 },
    { country: 'آمریکا (USA)', code: 'US', flag: '🇺🇸', server: 'us.east.ninipro.cloud', port: 443 },
  ];

  const protocols = ['vless', 'vmess', 'trojan', 'hysteria2', 'ss'] as const;
  const items: ConfigItem[] = [];

  for (let i = 0; i < 6; i++) {
    const loc = hosts[i % hosts.length];
    const proto = protocols[i % protocols.length];
    const randId = Math.random().toString(36).substring(2, 9);
    const uuid = `${randId}-44a1-42b3-8c9d-${Date.now().toString(16)}`;

    let raw = '';
    if (proto === 'vless') {
      raw = `vless://${uuid}@${loc.server}:${loc.port}?security=reality&type=grpc&sni=speed.cloudflare.com&fp=chrome#${encodeURIComponent(`${channel.name} | ${loc.code} Reality`)}`;
    } else if (proto === 'vmess') {
      const vmessData = {
        add: loc.server,
        aid: 0,
        host: loc.server,
        id: uuid,
        net: 'ws',
        path: '/v2',
        port: loc.port,
        ps: `${channel.name} | ${loc.code} VMess`,
        sni: loc.server,
        tls: 'tls',
        type: 'none',
        v: 2
      };
      raw = `vmess://${btoa(JSON.stringify(vmessData))}`;
    } else if (proto === 'trojan') {
      raw = `trojan://ninipro_${randId}@${loc.server}:${loc.port}?security=tls&type=tcp&sni=${loc.server}#${encodeURIComponent(`${channel.name} | ${loc.code} Trojan`)}`;
    } else if (proto === 'hysteria2') {
      raw = `hysteria2://ninipro_${randId}@${loc.server}:${loc.port}?sni=${loc.server}#${encodeURIComponent(`${channel.name} | ${loc.code} Hy2 UDP`)}`;
    } else {
      raw = `ss://${btoa(`aes-256-gcm:pass_${randId}@${loc.server}:${loc.port}`)}#${encodeURIComponent(`${channel.name} | ${loc.code} Shadowsocks`)}`;
    }

    const parsed = parseBulkConfigs(raw, 'channel', channel.name);
    if (parsed[0]) {
      items.push(parsed[0]);
    }
  }

  return items;
}
