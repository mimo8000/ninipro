import { SubscriptionUser } from '../types';
import { verifyCode, makeCode, tierToUser } from './licensePro';

const STORAGE_KEY_SUBSCRIBERS = 'ninipro_subscribers_v1';
const STORAGE_KEY_ACTIVE_USER = 'ninipro_active_user_v1';

// Helper to normalize Persian/Arabic digits and characters
export function normalizeCodeString(input: string): string {
  if (!input) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  let result = input.trim();
  for (let i = 0; i < 10; i++) {
    result = result.replaceAll(persianDigits[i], String(i));
    result = result.replaceAll(arabicDigits[i], String(i));
  }
  // Strip zero-width chars, ZWNJ, RTL marks and surrounding quotes
  result = result.replace(/[\u200B-\u200D\uFEFF\u061C\u2066-\u2069]/g, '').replace(/['"]/g, '');
  return result.toUpperCase();
}

export function getStoredSubscribers(): SubscriptionUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBSCRIBERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSubscribers(list: SubscriptionUser[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SUBSCRIBERS, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save subscribers', err);
  }
}

export function getActiveUser(): SubscriptionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setActiveUser(user: SubscriptionUser | null): void {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);
    } else {
      localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(user));
    }
  } catch (err) {
    console.error('Failed to set active user', err);
  }
}

/**
 * Verify a subscription code.
 * Only HMAC-signed codes (issued by the @bot_NINIPRO_bot or the admin panel)
 * are accepted. All hardcoded bypass codes have been removed.
 */
export async function verifySubscriptionCode(code: string): Promise<{ success: boolean; user?: SubscriptionUser; error?: string }> {
  const normalized = normalizeCodeString(code);

  if (!normalized) {
    return { success: false, error: 'لطفاً کد اشتراک را وارد کنید.' };
  }

  const res = await verifyCode(normalized);
  if (!res.ok) {
    return {
      success: false,
      error: 'کد اشتراک نامعتبر است. برای خرید کد به ربات @bot_NINIPRO_bot پیام دهید.',
    };
  }

  const user = tierToUser(res.tier, normalized);

  // honor suspension if admin previously suspended this code locally
  const allSubscribers = getStoredSubscribers();
  const matched = allSubscribers.find(s => normalizeCodeString(s.code) === normalized);
  if (matched) {
    if (matched.status === 'suspended') {
      return { success: false, error: 'این کد اشتراک توسط مدیریت مسدود شده است.' };
    }
    if (matched.expiresAt && matched.expiresAt < Date.now()) {
      return { success: false, error: 'اعتبار زمانی این کد اشتراک به پایان رسیده است.' };
    }
    if (matched.trafficTotalGB && matched.trafficUsedGB >= matched.trafficTotalGB) {
      return { success: false, error: 'حجم ترافیک مجاز این کد اشتراک به پایان رسیده است.' };
    }
    // reuse stored record (keeps usage stats)
    setActiveUser(matched);
    return { success: true, user: matched };
  }

  // first activation of a valid signed code — register it
  const updated = [user, ...allSubscribers];
  saveSubscribers(updated);
  setActiveUser(user);
  return { success: true, user };
}

/**
 * Admin-panel code creation: now generates a real HMAC-signed code
 * (same algorithm as the Telegram bot), so generated codes actually work.
 */
export async function createNewSubscriptionCode(data: {
  code?: string;
  userName: string;
  tier: SubscriptionUser['tier'];
  days: number | null;
  trafficGB: number | null;
  isAdmin: boolean;
  notes?: string;
}): Promise<{ success: boolean; user?: SubscriptionUser; error?: string }> {
  const all = getStoredSubscribers();

  // generate a signed code (ignore any custom unsigned code)
  const signed = await makeCode(data.tier);
  if (all.some(s => s.code.toUpperCase() === signed)) {
    return { success: false, error: 'تولید کد تکراری، دوباره تلاش کنید.' };
  }

  const newUser: SubscriptionUser = {
    code: signed,
    tier: data.tier,
    userName: (data.userName || '').trim() || `کاربر ${signed.slice(5, 10)}`,
    activatedAt: Date.now(),
    expiresAt: data.days ? Date.now() + data.days * 86400000 : null,
    trafficTotalGB: data.trafficGB,
    trafficUsedGB: 0,
    isAdmin: data.tier === 'admin_unlimited',
    status: 'active',
    notes: data.notes,
  };

  const updated = [newUser, ...all];
  saveSubscribers(updated);
  return { success: true, user: newUser };
}
