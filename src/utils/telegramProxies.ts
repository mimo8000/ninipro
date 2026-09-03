import { TelegramProxyItem, TelegramProxyProtocol } from '../types';
import { parseSingleConfig } from './configParser';

export const INITIAL_TELEGRAM_PROXIES: TelegramProxyItem[] = [
  {
    id: 'tg_mt_1',
    title: 'MTProto • tetstts',
    server: 'tetstts.mtproto.baby',
    port: 443,
    secret: 'eed1e7032e95a038c7e68c0877026d1d847374726d2e79616e6465782e6e6574',
    ping: null,
    status: 'untested',
    sponsorChannel: '@ProxyMTProto',
    country: 'عمومی (MTProto)',
    countryCode: 'TG',
    flag: '🔐',
    type: 'mtproto',
    protocolDetails: 'TLS 1.3 Fake TLS (Secure)',
  },
  {
    id: 'tg_mt_2',
    title: 'MTProto • stu',
    server: 'stu.vechnostnet.study',
    port: 443,
    secret: 'ee4cb2cfd29281dde11c93397476f9f26a7374726d2e79616e6465782e6e6574',
    ping: null,
    status: 'untested',
    sponsorChannel: '@ProxyMTProto',
    country: 'عمومی (MTProto)',
    countryCode: 'TG',
    flag: '🔐',
    type: 'mtproto',
    protocolDetails: 'TLS 1.3 Fake TLS (Secure)',
  },
  {
    id: 'tg_mt_3',
    title: 'MTProto • zone',
    server: 'zone.lovely.lat',
    port: 443,
    secret: 'eeaadd88aa9facd454936d0c42dc128e777a6f6e652e6c6f76656c792e6c6174',
    ping: null,
    status: 'untested',
    sponsorChannel: '@ProxyMTProto',
    country: 'عمومی (MTProto)',
    countryCode: 'TG',
    flag: '🔐',
    type: 'mtproto',
    protocolDetails: 'TLS 1.3 Fake TLS (Secure)',
  },
  {
    id: 'tg_mt_4',
    title: 'MTProto • max',
    server: 'max.kimt.click',
    port: 443,
    secret: 'ee1b153cf06dbd43c6085c359a6702eb936d61782e6b696d742e636c69636b',
    ping: null,
    status: 'untested',
    sponsorChannel: '@ProxyMTProto',
    country: 'عمومی (MTProto)',
    countryCode: 'TG',
    flag: '🔐',
    type: 'mtproto',
    protocolDetails: 'TLS 1.3 Fake TLS (Secure)',
  },
  {
    id: 'tg_mt_5',
    title: 'MTProto • as',
    server: 'as.mkim.click',
    port: 443,
    secret: 'ee2dfa3526fc70b7abd7a09eade6ccea1f61732e6d6b696d2e636c69636b',
    ping: null,
    status: 'untested',
    sponsorChannel: '@ProxyMTProto',
    country: 'عمومی (MTProto)',
    countryCode: 'TG',
    flag: '🔐',
    type: 'mtproto',
    protocolDetails: 'TLS 1.3 Fake TLS (Secure)',
  },
  {
    id: 'tg_mt_6',
    title: 'MTProto • mkima',
    server: 'mkima.davay.click',
    port: 443,
    secret: 'ee39300be14c4d54704c92416d555fa7026d6b696d612e64617661792e636c69636b',
    ping: null,
    status: 'untested',
    sponsorChannel: '@ProxyMTProto',
    country: 'عمومی (MTProto)',
    countryCode: 'TG',
    flag: '🔐',
    type: 'mtproto',
    protocolDetails: 'TLS 1.3 Fake TLS (Secure)',
  },
  {
    id: 'tg_mt_7',
    title: 'MTProto • 194',
    server: '194.59.221.90',
    port: 8444,
    secret: 'ee7577a125c7ad9c1d711adb2ebd0f6efc6465636174686c6f6e2e636f6d',
    ping: null,
    status: 'untested',
    sponsorChannel: '@ProxyMTProto',
    country: 'عمومی (MTProto)',
    countryCode: 'TG',
    flag: '🔐',
    type: 'mtproto',
    protocolDetails: 'TLS 1.3 Fake TLS (Secure)',
  },
  {
    id: 'tg_mt_8',
    title: 'MTProto • 194',
    server: '194.59.221.90',
    port: 8443,
    secret: 'eef4b79908a669cfe8f293941da4e388916465636174686c6f6e2e636f6d',
    ping: null,
    status: 'untested',
    sponsorChannel: '@ProxyMTProto',
    country: 'عمومی (MTProto)',
    countryCode: 'TG',
    flag: '🔐',
    type: 'mtproto',
    protocolDetails: 'TLS 1.3 Fake TLS (Secure)',
  },
  {
    id: 'tg_mt_9',
    title: 'MTProto • 94',
    server: '94.130.94.122',
    port: 8443,
    secret: '104462821249bd7ac519130220c25d09',
    ping: null,
    status: 'untested',
    sponsorChannel: '@dicode',
    country: 'عمومی (MTProto)',
    countryCode: 'TG',
    flag: '🔐',
    type: 'mtproto',
    protocolDetails: 'TLS 1.3 Fake TLS (Secure)',
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
