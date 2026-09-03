import { ConfigItem, ProtocolType } from '../types';

// Country flag and name detector
export function detectCountry(text: string, serverHost: string): { country: string; code: string; flag: string } {
  const combined = (text + ' ' + serverHost).toLowerCase();
  
  if (combined.includes('germany') || combined.includes('de') || combined.includes('آلمان') || combined.includes('frankfurt')) {
    return { country: 'آلمان (Germany)', code: 'DE', flag: '🇩🇪' };
  }
  if (combined.includes('finland') || combined.includes('fi') || combined.includes('فنلاند') || combined.includes('helsinki')) {
    return { country: 'فنلاند (Finland)', code: 'FI', flag: '🇫🇮' };
  }
  if (combined.includes('united states') || combined.includes('usa') || combined.includes('us') || combined.includes('آمریکا') || combined.includes('los angeles') || combined.includes('new york')) {
    return { country: 'آمریکا (USA)', code: 'US', flag: '🇺🇸' };
  }
  if (combined.includes('france') || combined.includes('fr') || combined.includes('فرانسه') || combined.includes('paris')) {
    return { country: 'فرانسه (France)', code: 'FR', flag: '🇫🇷' };
  }
  if (combined.includes('netherlands') || combined.includes('nl') || combined.includes('هلند') || combined.includes('amsterdam')) {
    return { country: 'هلند (Netherlands)', code: 'NL', flag: '🇳🇱' };
  }
  if (combined.includes('turkey') || combined.includes('tr') || combined.includes('ترکیه') || combined.includes('istanbul')) {
    return { country: 'ترکیه (Turkey)', code: 'TR', flag: '🇹🇷' };
  }
  if (combined.includes('united kingdom') || combined.includes('uk') || combined.includes('gb') || combined.includes('انگلیس') || combined.includes('london')) {
    return { country: 'انگلستان (UK)', code: 'GB', flag: '🇬🇧' };
  }
  if (combined.includes('canada') || combined.includes('ca') || combined.includes('کانادا')) {
    return { country: 'کانادا (Canada)', code: 'CA', flag: '🇨🇦' };
  }
  if (combined.includes('singapore') || combined.includes('sg') || combined.includes('سنگاپور')) {
    return { country: 'سنگاپور (Singapore)', code: 'SG', flag: '🇸🇬' };
  }
  if (combined.includes('uae') || combined.includes('dubai') || combined.includes('ae') || combined.includes('امارات')) {
    return { country: 'امارات (UAE)', code: 'AE', flag: '🇦🇪' };
  }
  if (combined.includes('sweden') || combined.includes('se') || combined.includes('سوئد')) {
    return { country: 'سوئد (Sweden)', code: 'SE', flag: '🇸🇪' };
  }
  if (combined.includes('poland') || combined.includes('pl') || combined.includes('لهستان')) {
    return { country: 'لهستان (Poland)', code: 'PL', flag: '🇵🇱' };
  }
  if (combined.includes('iran') || combined.includes('ir') || combined.includes('ایران')) {
    return { country: 'ایران (IR Clean)', code: 'IR', flag: '🇮🇷' };
  }

  // Default fallback pool
  const flags = [
    { country: 'آلمان (Germany)', code: 'DE', flag: '🇩🇪' },
    { country: 'فنلاند (Finland)', code: 'FI', flag: '🇫🇮' },
    { country: 'فرانسه (France)', code: 'FR', flag: '🇫🇷' },
    { country: 'هلند (Netherlands)', code: 'NL', flag: '🇳🇱' },
    { country: 'آمریکا (USA)', code: 'US', flag: '🇺🇸' },
  ];
  const charCodeSum = serverHost.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return flags[charCodeSum % flags.length];
}

// Helper safe base64 decoder (handles UTF-8)
export function safeBase64Decode(str: string): string {
  try {
    let clean = str.trim().replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
    while (clean.length % 4) {
      clean += '=';
    }
    const binary = atob(clean);
    const bytes = Uint8Array.from(binary, (m) => m.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    try {
      return atob(str.trim());
    } catch {
      return '';
    }
  }
}

// Single config string parser
export function parseSingleConfig(raw: string, source: ConfigItem['source'] = 'manual', sourceName?: string): ConfigItem | null {
  const line = raw.trim();
  if (!line || line.startsWith('#') || line.length < 10) return null;

  try {
    // 1. VLESS
    if (line.startsWith('vless://')) {
      const urlPart = line.substring(8);
      const hashIdx = urlPart.indexOf('#');
      const remark = hashIdx !== -1 ? decodeURIComponent(urlPart.substring(hashIdx + 1)) : 'VLESS Server';
      const mainPart = hashIdx !== -1 ? urlPart.substring(0, hashIdx) : urlPart;
      
      const [authAndHost, queryStr] = mainPart.split('?');
      const atIdx = authAndHost.lastIndexOf('@');
      if (atIdx === -1) return null;

      const hostAndPort = authAndHost.substring(atIdx + 1);
      const colonIdx = hostAndPort.lastIndexOf(':');
      const server = colonIdx !== -1 ? hostAndPort.substring(0, colonIdx) : hostAndPort;
      const port = colonIdx !== -1 ? parseInt(hostAndPort.substring(colonIdx + 1), 10) : 443;

      const params = new URLSearchParams(queryStr || '');
      const security = params.get('security') || 'none';
      const network = params.get('type') || 'tcp';
      const sni = params.get('sni') || server;
      const path = params.get('path') || '/';
      const fingerprint = params.get('fp') || 'chrome';

      const countryInfo = detectCountry(remark, server);

      return {
        id: `vless_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        name: remark || `ninipro-vless-${countryInfo.code}`,
        raw: line,
        protocol: 'vless',
        server,
        port: isNaN(port) ? 443 : port,
        ping: null,
        status: 'untested',
        country: countryInfo.country,
        countryCode: countryInfo.code,
        flag: countryInfo.flag,
        security: security.toUpperCase(),
        network,
        sni,
        path,
        fingerprint,
        addedAt: Date.now(),
        source,
        sourceName: sourceName || 'ورودی کاربر',
      };
    }

    // 2. VMESS
    if (line.startsWith('vmess://')) {
      const b64 = line.substring(8);
      const decoded = safeBase64Decode(b64);
      if (!decoded) return null;

      const vmessObj = JSON.parse(decoded);
      const server = vmessObj.add || vmessObj.host || '127.0.0.1';
      const port = parseInt(vmessObj.port, 10) || 443;
      const remark = vmessObj.ps || 'VMess Server';
      const security = vmessObj.tls === 'tls' ? 'TLS' : 'NONE';
      const network = vmessObj.net || 'ws';
      const sni = vmessObj.sni || vmessObj.host || server;
      const path = vmessObj.path || '/';

      const countryInfo = detectCountry(remark, server);

      return {
        id: `vmess_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        name: remark || `ninipro-vmess-${countryInfo.code}`,
        raw: line,
        protocol: 'vmess',
        server,
        port,
        ping: null,
        status: 'untested',
        country: countryInfo.country,
        countryCode: countryInfo.code,
        flag: countryInfo.flag,
        security,
        network,
        sni,
        path,
        addedAt: Date.now(),
        source,
        sourceName: sourceName || 'ورودی کاربر',
      };
    }

    // 3. TROJAN
    if (line.startsWith('trojan://')) {
      const urlPart = line.substring(9);
      const hashIdx = urlPart.indexOf('#');
      const remark = hashIdx !== -1 ? decodeURIComponent(urlPart.substring(hashIdx + 1)) : 'Trojan Server';
      const mainPart = hashIdx !== -1 ? urlPart.substring(0, hashIdx) : urlPart;

      const [authAndHost, queryStr] = mainPart.split('?');
      const atIdx = authAndHost.lastIndexOf('@');
      if (atIdx === -1) return null;

      const hostAndPort = authAndHost.substring(atIdx + 1);
      const colonIdx = hostAndPort.lastIndexOf(':');
      const server = colonIdx !== -1 ? hostAndPort.substring(0, colonIdx) : hostAndPort;
      const port = colonIdx !== -1 ? parseInt(hostAndPort.substring(colonIdx + 1), 10) : 443;

      const params = new URLSearchParams(queryStr || '');
      const sni = params.get('sni') || server;
      const network = params.get('type') || 'tcp';

      const countryInfo = detectCountry(remark, server);

      return {
        id: `trojan_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        name: remark || `ninipro-trojan-${countryInfo.code}`,
        raw: line,
        protocol: 'trojan',
        server,
        port: isNaN(port) ? 443 : port,
        ping: null,
        status: 'untested',
        country: countryInfo.country,
        countryCode: countryInfo.code,
        flag: countryInfo.flag,
        security: 'TLS',
        network,
        sni,
        addedAt: Date.now(),
        source,
        sourceName: sourceName || 'ورودی کاربر',
      };
    }

    // 4. SHADOWSOCKS (ss://)
    if (line.startsWith('ss://')) {
      const urlPart = line.substring(5);
      const hashIdx = urlPart.indexOf('#');
      const remark = hashIdx !== -1 ? decodeURIComponent(urlPart.substring(hashIdx + 1)) : 'Shadowsocks';
      const mainPart = hashIdx !== -1 ? urlPart.substring(0, hashIdx) : urlPart;

      let server = '127.0.0.1';
      let port = 8388;

      if (mainPart.includes('@')) {
        const [, hostPort] = mainPart.split('@');
        const [h, p] = hostPort.split(':');
        server = h || server;
        port = parseInt(p, 10) || 8388;
      } else {
        const decoded = safeBase64Decode(mainPart);
        if (decoded.includes('@')) {
          const [, hostPort] = decoded.split('@');
          const [h, p] = hostPort.split(':');
          server = h || server;
          port = parseInt(p, 10) || 8388;
        }
      }

      const countryInfo = detectCountry(remark, server);

      return {
        id: `ss_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        name: remark || `ninipro-ss-${countryInfo.code}`,
        raw: line,
        protocol: 'ss',
        server,
        port,
        ping: null,
        status: 'untested',
        country: countryInfo.country,
        countryCode: countryInfo.code,
        flag: countryInfo.flag,
        security: 'AEAD',
        network: 'tcp',
        addedAt: Date.now(),
        source,
        sourceName: sourceName || 'ورودی کاربر',
      };
    }

    // 5. HYSTERIA2 (hy2:// / hysteria2://)
    if (line.startsWith('hysteria2://') || line.startsWith('hy2://')) {
      const prefix = line.startsWith('hysteria2://') ? 'hysteria2://' : 'hy2://';
      const urlPart = line.substring(prefix.length);
      const hashIdx = urlPart.indexOf('#');
      const remark = hashIdx !== -1 ? decodeURIComponent(urlPart.substring(hashIdx + 1)) : 'Hysteria2 High Speed';
      const mainPart = hashIdx !== -1 ? urlPart.substring(0, hashIdx) : urlPart;

      const [authAndHost, queryStr] = mainPart.split('?');
      const atIdx = authAndHost.lastIndexOf('@');
      const hostAndPort = atIdx !== -1 ? authAndHost.substring(atIdx + 1) : authAndHost;
      const colonIdx = hostAndPort.lastIndexOf(':');
      const server = colonIdx !== -1 ? hostAndPort.substring(0, colonIdx) : hostAndPort;
      const port = colonIdx !== -1 ? parseInt(hostAndPort.substring(colonIdx + 1), 10) : 443;

      const params = new URLSearchParams(queryStr || '');
      const sni = params.get('sni') || server;

      const countryInfo = detectCountry(remark, server);

      return {
        id: `hy2_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        name: remark || `ninipro-hy2-${countryInfo.code}`,
        raw: line,
        protocol: 'hysteria2',
        server,
        port: isNaN(port) ? 443 : port,
        ping: null,
        status: 'untested',
        country: countryInfo.country,
        countryCode: countryInfo.code,
        flag: countryInfo.flag,
        security: 'QUIC / UDP',
        network: 'quic',
        sni,
        addedAt: Date.now(),
        source,
        sourceName: sourceName || 'ورودی کاربر',
      };
    }

    // 6. TUIC
    if (line.startsWith('tuic://')) {
      const urlPart = line.substring(7);
      const hashIdx = urlPart.indexOf('#');
      const remark = hashIdx !== -1 ? decodeURIComponent(urlPart.substring(hashIdx + 1)) : 'TUIC Server';
      const mainPart = hashIdx !== -1 ? urlPart.substring(0, hashIdx) : urlPart;

      const [authAndHost, queryStr] = mainPart.split('?');
      const atIdx = authAndHost.lastIndexOf('@');
      const hostAndPort = atIdx !== -1 ? authAndHost.substring(atIdx + 1) : authAndHost;
      const colonIdx = hostAndPort.lastIndexOf(':');
      const server = colonIdx !== -1 ? hostAndPort.substring(0, colonIdx) : hostAndPort;
      const port = colonIdx !== -1 ? parseInt(hostAndPort.substring(colonIdx + 1), 10) : 8443;

      const params = new URLSearchParams(queryStr || '');
      const sni = params.get('sni') || server;

      const countryInfo = detectCountry(remark, server);

      return {
        id: `tuic_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        name: remark || `ninipro-tuic-${countryInfo.code}`,
        raw: line,
        protocol: 'tuic',
        server,
        port: isNaN(port) ? 8443 : port,
        ping: null,
        status: 'untested',
        country: countryInfo.country,
        countryCode: countryInfo.code,
        flag: countryInfo.flag,
        security: 'QUIC',
        network: 'quic',
        sni,
        addedAt: Date.now(),
        source,
        sourceName: sourceName || 'ورودی کاربر',
      };
    }

    // 7. WIREGUARD / WARP
    if (line.startsWith('wireguard://') || line.startsWith('warp://')) {
      const countryInfo = detectCountry('Warp Cloudflare', '162.159.192.1');
      return {
        id: `warp_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        name: 'Cloudflare WARP+ (ninipro)',
        raw: line,
        protocol: 'warp',
        server: 'engage.cloudflareclient.com',
        port: 2408,
        ping: null,
        status: 'untested',
        country: countryInfo.country,
        countryCode: countryInfo.code,
        flag: countryInfo.flag,
        security: 'WireGuard',
        network: 'udp',
        addedAt: Date.now(),
        source,
        sourceName: sourceName || 'ورودی کاربر',
      };
    }

    return null;
  } catch (err) {
    console.error('Error parsing config line:', err);
    return null;
  }
}

// Bulk text / multi-line parser
export function parseBulkConfigs(text: string, source: ConfigItem['source'] = 'manual', sourceName?: string): ConfigItem[] {
  if (!text || !text.trim()) return [];

  let contentToParse = text;

  // Check if entire text is a single Base64 encoded Subscription blob
  if (!text.includes('\n') && !text.startsWith('vless://') && !text.startsWith('vmess://') && !text.startsWith('trojan://') && !text.startsWith('ss://')) {
    const decoded = safeBase64Decode(text);
    if (decoded && (decoded.includes('vless://') || decoded.includes('vmess://') || decoded.includes('trojan://') || decoded.includes('ss://'))) {
      contentToParse = decoded;
    }
  }

  const results: ConfigItem[] = [];
  // Match protocols using regex or split by line
  const lines = contentToParse.split(/[\r\n]+/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Scan for embedded protocol links in messy telegram channel text
    const protocols = ['vless://', 'vmess://', 'trojan://', 'ss://', 'hysteria2://', 'hy2://', 'tuic://', 'wireguard://', 'warp://'];
    for (const proto of protocols) {
      const idx = trimmed.indexOf(proto);
      if (idx !== -1) {
        // Extract substring from protocol start to whitespace or end
        const segment = trimmed.substring(idx).split(/\s+/)[0];
        const parsed = parseSingleConfig(segment, source, sourceName);
        if (parsed) {
          results.push(parsed);
        }
      }
    }
  }

  // Deduplicate by raw content
  const seen = new Set<string>();
  return results.filter(item => {
    if (seen.has(item.raw)) return false;
    seen.add(item.raw);
    return true;
  });
}
