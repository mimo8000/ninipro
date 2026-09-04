// Port of the validated link->sing-box converter (tested against sing-box 1.14 CLI: 91% pass).
// Converts vless/vmess/trojan/ss/hysteria2/tuic/wireguard links into a single sing-box profile.

const VALID_FP = ['chrome', 'firefox', 'safari', 'edge', 'ios', 'android', '360', 'qq'];

function splitFragment(raw: string): [string, string] {
  const i = raw.indexOf('#');
  if (i < 0) return [raw, ''];
  return [raw.slice(0, i), decodeURIComponent(raw.slice(i + 1))];
}

function parseQuery(qs?: string): Record<string, string> {
  const p: Record<string, string> = {};
  for (const kv of (qs || '').split('&')) {
    if (!kv) continue;
    const i = kv.indexOf('=');
    if (i < 0) continue;
    let v = kv.slice(i + 1);
    try { v = decodeURIComponent(v); } catch {}
    p[kv.slice(0, i).toLowerCase()] = v;
  }
  return p;
}

function splitServer(rest: string): [string, string, number] {
  const at = rest.lastIndexOf('@');
  const hostport = rest.slice(at + 1);
  const user = rest.slice(0, at);
  let host: string, port: string;
  if (hostport.startsWith('[')) {
    const e = hostport.indexOf(']');
    host = hostport.slice(1, e);
    port = hostport.slice(e + 2);
  } else {
    const c = hostport.lastIndexOf(':');
    host = hostport.slice(0, c);
    port = hostport.slice(c + 1);
  }
  return [user, host, parseInt(port, 10)];
}

function b64(s: string): string {
  try { return Buffer.from(s, 'base64').toString('utf8'); } catch { return ''; }
}

function tlsFromParams(p: Record<string, string>, allowInsecureDefault = false): any {
  const sec = (p.security || '').toLowerCase();
  const tls: any = {};
  if (sec === 'tls' || sec === 'reality') tls.enabled = true;
  else if (sec === 'none') return null;
  else if (p.sni || p.peer) tls.enabled = true;
  else return null;
  const sni = p.sni || p.peer || '';
  if (sni) tls.server_name = sni;
  if (p.alpn) tls.alpn = p.alpn.split(',');
  if (p.fp && VALID_FP.includes(p.fp)) tls.utls = { enabled: true, fingerprint: p.fp };
  else if (p.fp) tls.utls = { enabled: true, fingerprint: 'chrome' };
  if (String(p.allowinsecure ?? (allowInsecureDefault ? '1' : '0')) === '1') tls.insecure = true;
  if (sec === 'reality') {
    if (!tls.utls) tls.utls = { enabled: true, fingerprint: p.fp || 'chrome' };
    tls.reality = { enabled: true };
    if (p.pbk) tls.reality.public_key = p.pbk;
    if (p.sid) tls.reality.short_id = p.sid;
  }
  return tls;
}

function transportFromParams(p: Record<string, string>): any {
  const t = (p.type || 'tcp').toLowerCase();
  if (t === 'tcp' || t === '') return null;
  if (t === 'ws' || t === 'websocket') {
    const tr: any = { type: 'ws' };
    if (p.path) tr.path = p.path;
    if (p.host) tr.headers = { Host: p.host };
    return tr;
  }
  if (t === 'grpc') {
    const tr: any = { type: 'grpc' };
    const sn = p.servicename || p.service_name;
    if (sn) tr.service_name = sn;
    if (String(p.multimode || p.multi_mode || '') === '1') tr.multi_mode = true;
    return tr;
  }
  if (t === 'httpupgrade') {
    const tr: any = { type: 'httpupgrade' };
    if (p.path) tr.path = p.path;
    if (p.host) tr.headers = { Host: p.host };
    return tr;
  }
  if (t === 'xhttp') {
    const tr: any = { type: 'http' };
    if (p.path) tr.path = p.path;
    if (p.host) tr.headers = { Host: p.host };
    return tr;
  }
  if (t === 'h2') {
    const tr: any = { type: 'http' };
    if (p.path) tr.path = p.path;
    if (p.host) tr.host = [p.host];
    return tr;
  }
  return null;
}

export function linkToSingBoxOutbound(raw: string, tag: string): any {
  raw = (raw || '').trim();
  const [body, name] = splitFragment(raw);
  let out: any = null;
  if (raw.startsWith('vless://')) {
    const [rest, qs] = body.split('?');
    const p = parseQuery(qs);
    const [uuid, server, port] = splitServer(rest.slice('vless://'.length));
    out = { type: 'vless', tag, uuid, server, server_port: port || 443 };
    if (p.flow) out.flow = p.flow;
    const tls = tlsFromParams(p); if (tls) out.tls = tls;
    const tr = transportFromParams(p);
    if (tr) out.transport = tr;
    else if (!['tcp', ''].includes((p.type || 'tcp').toLowerCase())) throw new Error('transport ' + p.type);
  } else if (raw.startsWith('vmess://')) {
    let j: any;
    try { j = JSON.parse(b64(body.slice('vmess://'.length))); } catch { throw new Error('vmess b64'); }
    out = { type: 'vmess', tag, uuid: j.id, server: j.add, server_port: parseInt(j.port, 10), security: j.scy || 'auto' };
    if (parseInt(j.aid || '0', 10) > 0) out.alter_id = parseInt(j.aid, 10);
    const p: Record<string, string> = { sni: j.sni, fp: j.fp, alpn: j.alpn, type: j.net, path: j.path, host: j.host };
    if (j.tls === 'tls' || j.tls === true) p.security = 'tls';
    if (j.tls === 'reality') { p.security = 'reality'; p.pbk = j.pbk; p.sid = j.sid; }
    const tls = tlsFromParams(p); if (tls) out.tls = tls;
    if (j.net) {
      const tr = transportFromParams(p);
      if (tr) out.transport = tr;
      else if (!['tcp', ''].includes(String(j.net).toLowerCase())) throw new Error('transport ' + j.net);
    }
    if (!out.server) throw new Error('no server');
  } else if (raw.startsWith('trojan://')) {
    const [rest, qs] = body.split('?');
    const p = parseQuery(qs);
    const [pw, server, port] = splitServer(rest.slice('trojan://'.length));
    out = { type: 'trojan', tag, password: decodeURIComponent(pw), server, server_port: port || 443 };
    const tls = tlsFromParams(p, true); if (tls) out.tls = tls; else out.tls = { enabled: true };
    if (p.type) {
      const tr = transportFromParams(p);
      if (tr) out.transport = tr;
      else if (!['tcp', ''].includes(String(p.type).toLowerCase())) throw new Error('transport ' + p.type);
    }
  } else if (raw.startsWith('ss://')) {
    let b = body.slice('ss://'.length);
    let method = '', password = '', server = '', port = 0;
    const hashAt = b.indexOf('#');
    if (hashAt >= 0) b = b.slice(0, hashAt);
    const at = b.indexOf('@');
    if (at < 0) {
      const dec = b64(b);
      const [mp, hp] = dec.split('@');
      if (!hp) throw new Error('ss parse');
      [method, password] = mp.split(':');
      server = hp.split(':')[0]; port = parseInt(hp.split(':')[1], 10);
    } else {
      let userinfo = b.slice(0, at);
      const hp = b.slice(at + 1);
      if (!userinfo.includes(':')) userinfo = b64(userinfo);
      const ci = userinfo.indexOf(':');
      method = userinfo.slice(0, ci); password = userinfo.slice(ci + 1);
      server = hp.split(':')[0]; port = parseInt(hp.split(':')[1], 10);
    }
    if (!method || !server) throw new Error('ss parse');
    out = { type: 'shadowsocks', tag, method, password, server, server_port: port };
  } else if (raw.startsWith('hysteria2://') || raw.startsWith('hy2://')) {
    const [rest, qs] = body.split('?');
    const p = parseQuery(qs);
    const scheme = raw.startsWith('hy2://') ? 'hy2://' : 'hysteria2://';
    const [pw, server, port] = splitServer(rest.slice(scheme.length));
    out = { type: 'hysteria2', tag, password: decodeURIComponent(pw), server, server_port: port };
    out.tls = { enabled: true };
    if (p.sni) out.tls.server_name = p.sni;
    if (String(p.insecure || '0') === '1') out.tls.insecure = true;
    if (p.alpn) out.tls.alpn = p.alpn.split(',');
    if (p.obfs === 'salamander' && p['obfs-password']) out.obfs = { type: 'salamander', password: p['obfs-password'] };
  } else if (raw.startsWith('tuic://')) {
    const [rest, qs] = body.split('?');
    const p = parseQuery(qs);
    const [up, server, port] = splitServer(rest.slice('tuic://'.length));
    const ci = up.indexOf(':');
    out = { type: 'tuic', tag, uuid: up.slice(0, ci), password: up.slice(ci + 1), server, server_port: port };
    out.tls = { enabled: true };
    if (p.sni) out.tls.server_name = p.sni;
    if (p.congestion_control) out.congestion_control = p.congestion_control;
  } else if (raw.startsWith('wireguard://') || raw.startsWith('wg://')) {
    const [rest, qs] = body.split('?');
    const p = parseQuery(qs);
    const scheme = raw.startsWith('wg://') ? 'wg://' : 'wireguard://';
    const [pk, server, port] = splitServer(rest.slice(scheme.length));
    out = { type: 'wireguard', tag, private_key: decodeURIComponent(pk), server, server_port: port };
    if (p.address || p.addr) {
      const addrs = decodeURIComponent(p.address || p.addr).split(',').map((s) => s.trim());
      out.address = addrs.map((a) => (a.includes('/') ? a : (a.includes(':') ? a + '/128' : a + '/32')));
    }
    if (p.endpoint) { const [eh, ep] = p.endpoint.split(':'); out.server = eh; out.server_port = parseInt(ep, 10); }
    const peer: any = {};
    const pub = p.publickey || p['public-key'] || p['peer-public-key'] || p.pk;
    if (pub) peer.public_key = decodeURIComponent(pub);
    const psk = p.presharedkey || p['pre-shared-key'] || p.psk;
    if (psk) peer.pre_shared_key = decodeURIComponent(psk);
    if (p.allowedips || p['allowed-ips']) {
      peer.allowed_ips = decodeURIComponent(p.allowedips || p['allowed-ips']).split(',').map((s) => {
        const a = s.trim();
        return a.includes('/') ? a : (a.includes(':') ? a + '/128' : a + '/32');
      });
    } else if (out.address) {
      peer.allowed_ips = ['0.0.0.0/0', '::/0'];
    }
    if (p.port || p.peer_port) peer.port = parseInt(p.port || p.peer_port, 10);
    if (p.keepalive) peer.persistent_keepalive_interval = parseInt(p.keepalive, 10);
    if (!peer.public_key) throw new Error('wg public key missing');
    out.peers = [peer];
    if (!out.address) throw new Error('wg address');
  } else {
    throw new Error('unsupported scheme');
  }
  if (!out.server || !out.server_port) throw new Error('server/port missing');
  return out;
}

export function buildSingBoxProfile(links: string[], name = 'NiniPro'): string | null {
  const outbounds: any[] = [];
  const tags: string[] = [];
  for (let i = 0; i < links.length; i++) {
    try {
      const tag = 'p' + i;
      const ob = linkToSingBoxOutbound(links[i], tag);
      outbounds.push(ob);
      tags.push(tag);
      if (outbounds.length >= 120) break; // keep profile small & fast
    } catch {
      // skip unsupported / malformed
    }
  }
  if (outbounds.length === 0) return null;
  if (outbounds.length > 1) {
    outbounds.push({
      type: 'selector',
      tag: 'proxy',
      default: tags[tags.length - 1],
      outbounds: tags.slice(),
    });
  } else {
    outbounds[0].tag = 'proxy';
  }

  const profile: any = {
    log: { level: 'warn' },
    dns: {
      servers: [
        { type: 'https', tag: 'remote', server: '1.1.1.1', path: '/dns-query', detour: 'proxy' },
        { type: 'udp', tag: 'local', server: '223.5.5.5', detour: 'direct' },
      ],
      rules: [{ action: 'route', server: 'local', domain_suffix: ['ir'] }],
      final: 'remote',
    },
    inbounds: [
      {
        type: 'tun',
        tag: 'tun-in',
        address: ['172.19.0.254/30'],
        auto_route: true,
        strict_route: false,
        stack: 'gvisor',
      },
    ],
    outbounds: [
      ...outbounds,
      { type: 'direct', tag: 'direct' },
      { type: 'block', tag: 'block' },
    ],
    route: {
      rules: [
        { outbound: 'direct', domain_suffix: ['ir'] },
        {
          outbound: 'direct',
          ip_cidr: [
            '10.0.0.0/8', '127.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '0.0.0.0/8',
            '100.64.0.0/10', '169.254.0.0/16', '192.0.0.0/24', '192.0.2.0/24', '192.88.99.0/24',
            '198.18.0.0/15', '198.51.100.0/24', '203.0.113.0/24', '224.0.0.0/4', '240.0.0.0/4',
            '255.255.255.255/32',
          ],
        },
      ],
      final: 'proxy',
      auto_detect_interface: true,
      default_domain_resolver: 'local',
    },
  };
  return JSON.stringify(profile);
}
