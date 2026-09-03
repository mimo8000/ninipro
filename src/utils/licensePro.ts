/**
 * NiniPro — offline HMAC-signed subscription licensing.
 *
 * Code format: NINI-<PREFIX+CHARS>-<CHECKSUM>
 *   PREFIX: ADMN (admin) | VIP (pro) | STD (standard)
 *   CHECKSUM: first 5 base32 chars of HMAC-SHA256(SECRET, payload)
 *
 * This MUST match bot/ninipro_bot.py (python hmac + same b32) so codes
 * issued by the Telegram bot are valid inside the app with no server.
 *
 * NOTE (honest limitation): this is a client-side gate. A determined
 * attacker can extract SECRET from the APK. It stops casual code sharing,
 * not a professional cracker. Central revocation would need a server.
 */

import { SubscriptionUser } from '../types';

const SECRET = 'NINIPRO-HMAC-2026-e657e99bce5be41a0e40b8a46ec7156c';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars (no I,O,0,1)

export type NiniTier = 'standard' | 'vip_premium' | 'admin_unlimited';

export interface VerifyResult {
  ok: boolean;
  tier: NiniTier;
  isAdmin: boolean;
  code: string;
}

// ---------- base32 + HMAC (must match ninipro_bot.py) ----------
function b32(bytes: Uint8Array, n: number): string {
  let out = '';
  let acc = 0;
  let bits = 0;
  for (const byte of bytes) {
    acc = (acc << 8) | byte;
    bits += 8;
    while (bits >= 5 && out.length < n) {
      out += ALPHABET[(acc >> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  while (out.length < n) {
    acc <<= 5;
    bits += 5;
    out += ALPHABET[(acc >> (bits - 5)) & 31];
    bits -= 5;
  }
  return out;
}

async function signPayload(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return b32(new Uint8Array(sig), 5);
}

function randChars(n: number): string {
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  let s = '';
  for (const x of arr) s += ALPHABET[x % ALPHABET.length];
  return s;
}

// ---------- verification ----------
export async function verifyCode(raw: string): Promise<VerifyResult> {
  const fail: VerifyResult = { ok: false, tier: 'standard', isAdmin: false, code: '' };
  const norm = (raw || '').trim().toUpperCase().replace(/\s+/g, '');
  const m = norm.match(/^NINI-([A-Z0-9]{5})-([A-Z0-9]{5})$/);
  if (!m) return fail;
  const [, payload, checksum] = m;
  const expect = await signPayload(payload);
  if (expect !== checksum) return fail;

  let tier: NiniTier = 'standard';
  let isAdmin = false;
  if (payload.startsWith('ADMN')) {
    tier = 'admin_unlimited';
    isAdmin = true;
  } else if (payload.startsWith('VIP')) {
    tier = 'vip_premium';
  } else {
    tier = 'standard';
  }
  return { ok: true, tier, isAdmin, code: norm };
}

// ---------- generation (used by in-app admin panel; same as bot) ----------
export async function makeCode(tier: NiniTier): Promise<string> {
  let payload: string;
  if (tier === 'admin_unlimited') payload = 'ADMN' + randChars(1);
  else if (tier === 'vip_premium') payload = 'VIP' + randChars(2);
  else payload = 'STD' + randChars(2);
  const checksum = await signPayload(payload);
  return `NINI-${payload}-${checksum}`;
}

// Re-export for callers that used the old name
export const generateCode = makeCode;

// ---------- map a verified tier to a SubscriptionUser ----------
export function tierToUser(tier: NiniTier, code: string, days: number | null = null): SubscriptionUser {
  const isAdmin = tier === 'admin_unlimited';
  const label =
    tier === 'admin_unlimited' ? 'مدیر کل (Master Admin)'
      : tier === 'vip_premium' ? 'کاربر طلایی (VIP)'
        : 'کاربر عادی (Standard)';
  return {
    code,
    tier,
    userName: label,
    activatedAt: Date.now(),
    expiresAt: days ? Date.now() + days * 86400000 : null,
    trafficTotalGB: null,
    trafficUsedGB: 0,
    isAdmin,
    status: 'active',
    notes: 'کد صادر شده توسط ربات / پنل مدیریت (امضاشده)',
  };
}
