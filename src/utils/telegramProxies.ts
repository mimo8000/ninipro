import { TelegramProxyItem, TelegramProxyProtocol } from '../types';
import { parseSingleConfig } from './configParser';

export const INITIAL_TELEGRAM_PROXIES: TelegramProxyItem[] = [
  {
    id: 'tg_1',
    title: '🇩🇪 Frankfurt Fast MTProto (Direct TLS 1.3)',
    server: '159.69.195.42',
    port: 443,
    secret: 'ee1603010200010001fc030386e24c3066696c65732e74656c656772616d2e6f7267',
    ping: 82,
    status: 'healthy',
    sponsorChannel: '@ninipro_channel',
    country: 'آلمان (Germany)',
    countryCode: 'DE',
    flag: '🇩🇪',
    type: 'mtproto',
    protocolDetails: 'MTProto TLS 1.3 (Fake Domain: files.telegram.org)',
  },
  {
    id: 'tg_2',
    title: '🇫🇮 Helsinki Ultra Low-Ping MTProto',
    server: '65.21.144.18',
    port: 8443,
    secret: 'ee000000000000000000000000000000007777772e676f6f676c652e636f6d',
    ping: 68,
    status: 'healthy',
    sponsorChannel: '@ninipro_vip',
    country: 'فنلاند (Finland)',
    countryCode: 'FI',
    flag: '🇫🇮',
    type: 'mtproto',
    protocolDetails: 'MTProto TLS 1.3 (Fake Domain: www.google.com)',
  },
  {
    id: 'tg_3',
    title: '🇳🇱 Amsterdam Cyber MTProto TLS',
    server: '185.193.65.124',
    port: 443,
    secret: 'eed5421b8b2413158c352a78f149ec82747777772e79616e6465782e7275',
    ping: 95,
    status: 'healthy',
    sponsorChannel: '@ninipro_speed',
    country: 'هلند (Netherlands)',
    countryCode: 'NL',
    flag: '🇳🇱',
    type: 'mtproto',
    protocolDetails: 'MTProto TLS 1.3 (Fake Domain: www.yandex.ru)',
  },
  {
    id: 'tg_4',
    title: '🇬🇧 London High Speed Socks5 Proxy',
    server: '138.68.140.22',
    port: 1080,
    secret: 'ninipro_pass_2026',
    user: 'ninipro',
    pass: 'ninipro_pass_2026',
    ping: 115,
    status: 'healthy',
    country: 'انگلستان (UK)',
    countryCode: 'GB',
    flag: '🇬🇧',
    type: 'socks5',
    protocolDetails: 'SOCKS5 Proxy (User/Pass Auth)',
  },
  {
    id: 'tg_5',
    title: '🇩🇪 Frankfurt HTTP/HTTPS Secure Proxy',
    server: '49.12.98.114',
    port: 3128,
    secret: 'nini_http_pass',
    user: 'nini_secure',
    pass: 'nini_http_pass',
    ping: 88,
    status: 'healthy',
    country: 'آلمان (Germany)',
    countryCode: 'DE',
    flag: '🇩🇪',
    type: 'http',
    protocolDetails: 'HTTP/HTTPS Connect Proxy for Telegram',
  },
  {
    id: 'tg_6',
    title: '🇫🇷 Paris VLESS Reality Direct Proxy for TG',
    server: '51.159.21.84',
    port: 443,
    secret: '9a1e0b5c-4432-4d22-86bb-258db09a3199',
    ping: 58,
    status: 'healthy',
    country: 'فرانسه (France)',
    countryCode: 'FR',
    flag: '🇫🇷',
    type: 'vless',
    protocolDetails: 'VLESS Reality (gRPC / Port 443 - Anti-Filter for Telegram)',
    v2rayRawConfig: 'vless://9a1e0b5c-4432-4d22-86bb-258db09a3199@51.159.21.84:443?security=reality&encryption=none&pbk=1yH_6r7u-eE&headerType=none&type=grpc&serviceName=tg-tunnel&sni=speedtest.net#🇫🇷%20Paris%20TG-VLESS',
  },
  {
    id: 'tg_7',
    title: '🇹🇷 Istanbul Trojan Fast Proxy for TG',
    server: '194.26.230.12',
    port: 443,
    secret: 'nini-trojan-secure-pass',
    ping: 48,
    status: 'healthy',
    country: 'ترکیه (Turkey)',
    countryCode: 'TR',
    flag: '🇹🇷',
    type: 'trojan',
    protocolDetails: 'Trojan gRPC TLS (Ultra Low Latency for Telegram Voice/Video)',
    v2rayRawConfig: 'trojan://nini-trojan-secure-pass@194.26.230.12:443?security=tls&type=grpc&serviceName=tg-call-grpc&sni=update.microsoft.com#🇹🇷%20Istanbul%20TG-Trojan',
  },
  {
    id: 'tg_8',
    title: '🇺🇸 US Hysteria 2 High Speed Stream Proxy',
    server: '172.67.180.20',
    port: 8443,
    secret: 'hy2_tg_token_2026',
    ping: 125,
    status: 'healthy',
    country: 'آمریکا (USA)',
    countryCode: 'US',
    flag: '🇺🇸',
    type: 'hysteria2',
    protocolDetails: 'Hysteria 2 (UDP Brutal - Anti-Filter Video Downloader)',
    v2rayRawConfig: 'hysteria2://hy2_tg_token_2026@172.67.180.20:8443?insecure=1&sni=www.bing.com#🇺🇸%20US%20TG-Hy2',
  },
  {
    id: 'tg_9',
    title: '🇸🇬 Singapore Shadowsocks 2022 TG Proxy',
    server: '128.199.200.54',
    port: 8388,
    secret: '2022-blake3-aes-256-gcm:dGhpcy1pcy1hLXZlcnktc2VjdXJlLXBhc3N3b3Jk',
    ping: 140,
    status: 'healthy',
    country: 'سنگاپور (Singapore)',
    countryCode: 'SG',
    flag: '🇸🇬',
    type: 'ss',
    protocolDetails: 'Shadowsocks 2022 (AEAD Blake3 Encryption)',
    v2rayRawConfig: 'ss://MjAyMi1ibGFrZTMtYWVzLTI1Ni1nY206ZEdocGNDMXBjeTFoTFhabGNuay1jMlZqZFhKbExYQmhjM04zYjNKa0@128.199.200.54:8388#🇸🇬%20SG%20TG-Shadowsocks',
  },
  {
    id: 'tg_10',
    title: '🇨🇦 Canada VMess WebSocket CDN for TG',
    server: '142.93.150.88',
    port: 443,
    secret: 'c82736b4-9281-4bc9-93e1-31a89c204918',
    ping: 155,
    status: 'healthy',
    country: 'کانادا (Canada)',
    countryCode: 'CA',
    flag: '🇨🇦',
    type: 'vmess',
    protocolDetails: 'VMess + WebSocket + TLS CDN Tunnel',
    v2rayRawConfig: 'vmess://eyJhZGQiOiIxNDIuOTMuMTUwLjg4IiwiYWlkIjoiMCIsImhvc3QiOiJ0Zy1jZG4uY2xvdWRmbGFyZS5jb20iLCJpZCI6ImM4MjczNmI0LTkyODEtNGJjOS05M2UxLTMxYTg5YzIwNDkxOCIsIm5ldCI6IndzIiwicGF0aCI6Ii90Zy13cyIsInBvcnQiOiI0NDMiLCJwcyI6IsCfw6AgQ2FuYWRhIFRHLVZNZXNzIiwidGxzIjoidGxzIiwidHlwZSI6Im5vbmUifQ==',
  },
];

export function getTelegramProxyLinks(proxy: TelegramProxyItem): {
  appLink: string;
  webLink: string;
  copyableText: string;
  quickInfo: string;
} {
  const user = proxy.user || 'ninipro';
  const pass = proxy.pass || proxy.secret;

  switch (proxy.type) {
    case 'mtproto': {
      const encodedSecret = encodeURIComponent(proxy.secret);
      return {
        appLink: `tg://proxy?server=${proxy.server}&port=${proxy.port}&secret=${encodedSecret}`,
        webLink: `https://t.me/proxy?server=${proxy.server}&port=${proxy.port}&secret=${encodedSecret}`,
        copyableText: `tg://proxy?server=${proxy.server}&port=${proxy.port}&secret=${proxy.secret}`,
        quickInfo: `MTProto: ${proxy.server}:${proxy.port}`,
      };
    }

    case 'socks5': {
      const encodedUser = encodeURIComponent(user);
      const encodedPass = encodeURIComponent(pass);
      const hasAuth = !!proxy.user || (proxy.pass && proxy.pass !== 'none');
      const authQuery = hasAuth ? `&user=${encodedUser}&pass=${encodedPass}` : '';
      return {
        appLink: `tg://socks?server=${proxy.server}&port=${proxy.port}${authQuery}`,
        webLink: `https://t.me/socks?server=${proxy.server}&port=${proxy.port}${authQuery}`,
        copyableText: `tg://socks?server=${proxy.server}&port=${proxy.port}${authQuery}`,
        quickInfo: `Socks5: ${proxy.server}:${proxy.port} (User: ${user})`,
      };
    }

    case 'http': {
      const encodedUser = encodeURIComponent(user);
      const encodedPass = encodeURIComponent(pass);
      return {
        appLink: `tg://http?server=${proxy.server}&port=${proxy.port}&user=${encodedUser}&pass=${encodedPass}`,
        webLink: `https://t.me/http?server=${proxy.server}&port=${proxy.port}&user=${encodedUser}&pass=${encodedPass}`,
        copyableText: `http://${proxy.user ? `${proxy.user}:${proxy.pass}@` : ''}${proxy.server}:${proxy.port}`,
        quickInfo: `HTTP Proxy: ${proxy.server}:${proxy.port}`,
      };
    }

    // For V2Ray/Xray based protocols (VLESS, VMess, Trojan, Shadowsocks, Hysteria2)
    case 'vless':
    case 'vmess':
    case 'trojan':
    case 'ss':
    case 'hysteria2':
    case 'tuic':
    case 'wireguard': {
      const rawUri = proxy.v2rayRawConfig || `${proxy.type}://${proxy.secret}@${proxy.server}:${proxy.port}`;
      // In local inbound routing mode for Telegram Desktop / Android, Telegram routes to 127.0.0.1:10808 (Socks) or 10809 (HTTP)
      // We provide instant Socks5 one-click link + Full V2Ray URI
      return {
        appLink: `tg://socks?server=127.0.0.1&port=10808`,
        webLink: `https://t.me/socks?server=127.0.0.1&port=10808`,
        copyableText: rawUri,
        quickInfo: `${proxy.type.toUpperCase()}: ${proxy.server}:${proxy.port} (Inbound 10808)`,
      };
    }

    default: {
      const encodedSecret = encodeURIComponent(proxy.secret);
      return {
        appLink: `tg://proxy?server=${proxy.server}&port=${proxy.port}&secret=${encodedSecret}`,
        webLink: `https://t.me/proxy?server=${proxy.server}&port=${proxy.port}&secret=${encodedSecret}`,
        copyableText: proxy.secret,
        quickInfo: `${proxy.server}:${proxy.port}`,
      };
    }
  }
}

/**
 * Converts ANY V2Ray/Xray config (VLESS, VMess, Trojan, SS, Hy2) directly into a Telegram Proxy Item
 */
export function convertV2RayToTelegramProxy(rawText: string): TelegramProxyItem | null {
  const parsed = parseSingleConfig(rawText, 'manual');
  if (!parsed) return null;

  const protocol = parsed.protocol as TelegramProxyProtocol;

  return {
    id: `tg_conv_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title: `${parsed.flag} ${parsed.name || `پروکسی تلگرام ${protocol.toUpperCase()}`}`,
    server: parsed.server,
    port: parsed.port,
    secret: parsed.raw.split('@')[0]?.split('://')[1] || parsed.raw,
    user: 'ninipro',
    pass: parsed.server,
    ping: parsed.ping || 85,
    status: 'healthy',
    country: parsed.country,
    countryCode: parsed.countryCode,
    flag: parsed.flag,
    type: protocol,
    protocolDetails: `${protocol.toUpperCase()} ${parsed.security || 'TLS'} (${parsed.network || 'TCP'})`,
    v2rayRawConfig: parsed.raw,
    isCustom: true,
  };
}

/**
 * Parses any pasted Telegram link (tg://proxy, tg://socks, tg://http, https://t.me/...) or V2ray link
 */
export function parseTgProxyUrl(url: string): TelegramProxyItem | null {
  try {
    const clean = url.trim();
    if (!clean) return null;

    // Check if it's a V2Ray URI first
    if (
      clean.startsWith('vless://') ||
      clean.startsWith('vmess://') ||
      clean.startsWith('trojan://') ||
      clean.startsWith('ss://') ||
      clean.startsWith('hysteria2://') ||
      clean.startsWith('hy2://') ||
      clean.startsWith('tuic://')
    ) {
      return convertV2RayToTelegramProxy(clean);
    }

    // Telegram proxy url formats
    const isSocks = clean.includes('socks?') || clean.includes('/socks?');
    const isHttp = clean.includes('http?') || clean.includes('/http?');
    const isMtproto = clean.includes('proxy?') || clean.includes('/proxy?');

    if (!isSocks && !isHttp && !isMtproto) {
      // Try raw IP:Port:Secret or host:port:user:pass
      const parts = clean.split(':');
      if (parts.length >= 3) {
        const server = parts[0];
        const port = parseInt(parts[1], 10);
        const secret = parts.slice(2).join(':');
        if (server && !isNaN(port)) {
          const isTlsSecret = secret.startsWith('ee') || secret.length >= 32;
          return {
            id: `tg_parsed_${Date.now()}`,
            title: `پروکسی ${server}:${port}`,
            server,
            port,
            secret,
            ping: null,
            status: 'untested',
            country: 'سرور اختصاصی',
            countryCode: 'NET',
            flag: '🌐',
            type: isTlsSecret ? 'mtproto' : 'socks5',
            protocolDetails: isTlsSecret ? 'MTProto TLS 1.3' : 'Socks5',
            isCustom: true,
          };
        }
      }
      return null;
    }

    const queryStr = clean.split('?')[1];
    if (!queryStr) return null;

    const params = new URLSearchParams(queryStr);
    const server = params.get('server');
    const port = parseInt(params.get('port') || '443', 10);
    const secret = params.get('secret') || params.get('pass') || '';
    const user = params.get('user') || undefined;
    const pass = params.get('pass') || undefined;

    if (!server) return null;

    let type: TelegramProxyProtocol = 'mtproto';
    if (isSocks) type = 'socks5';
    if (isHttp) type = 'http';

    return {
      id: `tg_parsed_${Date.now()}`,
      server,
      port,
      secret,
      user,
      pass,
      type,
      title: `پروکسی ${type.toUpperCase()} - ${server}:${port}`,
      country: 'سرور اختصاصی',
      countryCode: 'NET',
      flag: '🌐',
      ping: null,
      status: 'untested',
      protocolDetails: `${type.toUpperCase()} (دریافت شده از لینک)`,
      isCustom: true,
    };
  } catch {
    return null;
  }
}

export function generateFakeTlsSecret(customDomain?: string): string {
  const domains = [
    { name: 'google.com', hex: '676f6f676c652e636f6d' },
    { name: 'cloudflare.com', hex: '636c6f7564666c6172652e636f6d' },
    { name: 'telegram.org', hex: '74656c656772616d2e6f7267' },
    { name: 'yandex.ru', hex: '79616e6465782e7275' },
    { name: 'microsoft.com', hex: '6d6963726f736f66742e636f6d' },
    { name: 'digikala.com', hex: '646967696b616c612e636f6d' },
  ];

  let domainHex = domains[0].hex;
  if (customDomain) {
    domainHex = Array.from(customDomain)
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
  } else {
    const randDom = domains[Math.floor(Math.random() * domains.length)];
    domainHex = randDom.hex;
  }

  let randomHex = '';
  const chars = '0123456789abcdef';
  for (let i = 0; i < 32; i++) {
    randomHex += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ee${randomHex}${domainHex}`;
}
