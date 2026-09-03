#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NiniPro — Telegram Subscription Bot (v2)
========================================
فروش اشتراک + کیف‌پول + رسید پرداخت + پنل مدیریت کامل.

جریان کاربر:  /start → زبان → تایید شماره → نظرسنجی → منو
جریان ادمین:  /start → زبان → منو (بدون اجبار شماره/نظرسنجی)

امکانات:
  • کیف‌پول: شارژ با کارت‌به‌کارت، ارسال رسید (عکس یا متن)، تأیید ادمین
  • خرید پلن از محل موجودی کیف‌پول (۱۰۰ تومان به بالا)
  • صدور کد اشتراک امضاشده HMAC — مستقیم در اپ NiniPro کار می‌کند
  • پنل ادمین: ساخت کد، حذف کد، افزودن/ویرایش کارت، رسیدهای در انتظار، آمار
  • همه دکمه‌ها تمام‌عرض و بزرگ
  • پشتیبانی مستقیم: @SasaX60

اجرا:
  BOT_TOKEN="***" ADMIN_IDS="7581433749" python3 ninipro_bot.py
"""

import os
import sys
import time
import json
import hmac
import hashlib
import random
import urllib.request
import urllib.parse

# ----------------------------------------------------------------------------
# Config
# ----------------------------------------------------------------------------
BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
ADMIN_IDS = set(int(x) for x in os.environ.get("ADMIN_IDS", "7581433749").split(",") if x.strip())
SUPPORT_URL = "https://t.me/SasaX60"
CARD_NUMBER = os.environ.get("CARD_NUMBER", "6037-XXXX-XXXX-XXXX")

# قیمت‌ها (تومان) — قابل تغییر با env
PRICE_TRIAL = int(os.environ.get("PRICE_TRIAL_NUM", "0"))
PRICE_PRO = int(os.environ.get("PRICE_PRO_NUM", "100"))
PRICE_ADMIN = int(os.environ.get("PRICE_ADMIN_NUM", "500"))
MIN_TOPUP = 100
TOPUP_AMOUNTS = [100, 200, 500, 1000, 2000, 5000]

# Secret مشترک با اپلیکیشن (باید دقیقاً با src/utils/licensePro.ts یکی باشد)
SECRET = "NINIPRO-HMAC-2026-e657e99bce5be41a0e40b8a46ec7156c"
ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # 32 chars (بدون I,O,0,1)

PLAN_TIER = {"trial": "standard", "pro": "vip_premium", "admin": "admin_unlimited"}
PLAN_PRICE = {"trial": PRICE_TRIAL, "pro": PRICE_PRO, "admin": PRICE_ADMIN}


# ----------------------------------------------------------------------------
# HMAC code generator (matches src/utils/licensePro.ts)
# ----------------------------------------------------------------------------
def b32(data: bytes, n: int) -> str:
    out = ""
    acc = 0
    bits = 0
    for byte in data:
        acc = (acc << 8) | byte
        bits += 8
        while bits >= 5 and len(out) < n:
            out += ALPHABET[(acc >> (bits - 5)) & 31]
            bits -= 5
    while len(out) < n:
        acc <<= 5
        bits += 5
        out += ALPHABET[(acc >> (bits - 5)) & 31]
        bits -= 5
    return out


def sign_payload(payload: str) -> str:
    sig = hmac.new(SECRET.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).digest()
    return b32(sig, 5)


def random_chars(n: int) -> str:
    return "".join(random.choice(ALPHABET) for _ in range(n))


def make_code(tier: str) -> str:
    """tier: 'standard' | 'vip_premium' | 'admin_unlimited' (or short 'admin'/'vip')."""
    if tier in ("admin", "admin_unlimited"):
        payload = "ADMN" + random_chars(1)
    elif tier in ("vip", "vip_premium"):
        payload = "VIP" + random_chars(2)
    else:
        payload = "STD" + random_chars(2)
    return f"NINI-{payload}-{sign_payload(payload)}"


def fmt_toman(n: int) -> str:
    return f"{n:,} تومان".replace(",", "٬")


# ----------------------------------------------------------------------------
# Persistence (JSON file)
# ----------------------------------------------------------------------------
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ninipro_db.json")
DB = {
    "wallets": {},      # uid -> balance (toman)
    "receipts": {},     # rid -> {uid, amount, note, ts, status}
    "codes": [],        # [{code, tier, uid, ts}]
    "cards": {},        # uid -> card number string (user's own card for refunds etc.)
    "lang": {},         # uid -> lang
    "phone": {},        # uid -> phone
}


def db_load():
    global DB
    try:
        with open(DB_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        for k in DB:
            if k in data:
                DB[k] = data[k]
    except FileNotFoundError:
        pass
    except Exception as e:  # noqa
        sys.stderr.write(f"[db_load] {e}\n")


def db_save():
    try:
        tmp = DB_PATH + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(DB, f, ensure_ascii=False)
        os.replace(tmp, DB_PATH)
    except Exception as e:  # noqa
        sys.stderr.write(f"[db_save] {e}\n")


def get_bal(uid) -> int:
    return int(DB["wallets"].get(str(uid), 0))


def add_bal(uid, v) -> int:
    DB["wallets"][str(uid)] = get_bal(uid) + int(v)
    db_save()
    return DB["wallets"][str(uid)]


def sub_bal(uid, v) -> bool:
    if get_bal(uid) < int(v):
        return False
    DB["wallets"][str(uid)] = get_bal(uid) - int(v)
    db_save()
    return True


def new_rid() -> str:
    return "".join(random.choice(ALPHABET) for _ in range(6))


# ----------------------------------------------------------------------------
# Telegram HTTP helpers (urllib only, no deps)
# ----------------------------------------------------------------------------
API = f"https://api.telegram.org/bot{BOT_TOKEN}"


def _call(method: str, data: dict | None = None, timeout: int = 40):
    url = f"{API}/{method}"
    try:
        req = urllib.request.Request(
            url, data=urllib.parse.urlencode(data or {}).encode(), method="POST"
        )
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:  # noqa
        sys.stderr.write(f"[http {method}] {e}\n")
        return {}


def _get_file(file_id):
    r = _call("getFile", {"file_id": file_id})
    p = (r.get("result") or {}).get("file_path")
    if not p:
        return None
    return f"https://api.telegram.org/file/bot{BOT_TOKEN}/{p}"


def send_message(chat_id, text, reply_markup=None, parse_mode=None):
    data = {"chat_id": chat_id, "text": text}
    if parse_mode:
        data["parse_mode"] = parse_mode
    if reply_markup:
        data["reply_markup"] = json.dumps(reply_markup, ensure_ascii=False)
    return _call("sendMessage", data)


def edit_message(chat_id, message_id, text, reply_markup=None, parse_mode=None):
    data = {"chat_id": chat_id, "message_id": message_id, "text": text}
    if parse_mode:
        data["parse_mode"] = parse_mode
    if reply_markup:
        data["reply_markup"] = json.dumps(reply_markup, ensure_ascii=False)
    r = _call("editMessageText", data)
    if not r.get("ok") and "message is not modified" not in str(r.get("description", "")):
        # fall back to a new message if edit fails for other reasons
        pass
    return r


def send_poll(chat_id, question, options):
    return _call("sendPoll", {
        "chat_id": chat_id,
        "question": question,
        "options": json.dumps(options, ensure_ascii=False),
    })


def answer_callback(query_id, text=None):
    data = {"callback_query_id": query_id}
    if text:
        data["text"] = text
    return _call("answerCallbackQuery", data)


def send_contact_request(chat_id, text):
    kb = {"keyboard": [[{"text": "✅ تایید شماره من", "request_contact": True}]],
          "resize_keyboard": True, "one_time_keyboard": True}
    return send_message(chat_id, text, reply_markup=kb)


# ----------------------------------------------------------------------------
# i18n
# ----------------------------------------------------------------------------
I18N = {
    "fa": {
        "welcome": "👋 به ربات رسمی NiniPro خوش آمدید!\n\nلطفاً زبان خود را انتخاب کنید:",
        "lang_set": "✅ زبان فارسی تنظیم شد.",
        "main_menu": "📋 منوی اصلی",
        "buy": "🛒 خرید اشتراک",
        "wallet": "💰 کیف‌پول",
        "mycodes": "🎟 کدهای من",
        "security": "🛡 امنیت",
        "support": "🎧 پشتیبانی مستقیم",
        "about": "ℹ️ درباره",
        "admin": "⚙️ پنل مدیریت",
        "back": "🔙 بازگشت به منو",
        "phone_prompt": "📱 برای ادامه، شماره خود را تایید کنید:",
        "phone_ok": "✅ شماره شما تایید شد: {phone}",
        "poll_q": "📊 کدام پروتکل را بیشتر استفاده می‌کنید؟",
        "poll_opts": ["VLESS", "VMess", "Trojan", "Hysteria2"],
        "choose_plan": "💳 پلن مورد نظر را انتخاب کنید:",
        "plan_trial": f"🎁 تست ۷ روزه — {fmt_toman(PRICE_TRIAL) if PRICE_TRIAL else 'رایگان'}",
        "plan_pro": f"⭐ اشتراک PRO (۱ ماه) — {fmt_toman(PRICE_PRO)}",
        "plan_admin": f"👑 اشتراک نامحدود — {fmt_toman(PRICE_ADMIN)}",
        "need_topup": ("💸 موجودی کیف‌پول شما کافی نیست.\n\n"
                       "موجودی فعلی: {bal}\nقیمت: {price}\n\n"
                       "ابتدا کیف‌پول را شارژ کنید."),
        "bought": ("🎉 خرید موفق!\n\nکد اشتراک شما:\n<code>{code}</code>\n\n"
                   "در اپ NiniPro وارد کنید.\nموجودی جدید: {bal}"),
        "wallet_menu": ("💰 کیف‌پول شما\n\nموجودی: {bal} تومان\n\n"
                        "برای شارژ، مبلغ را انتخاب کنید (حداقل {min} تومان):"),
        "custom_amount": "✏️ مبلغ دلخواه (حداقل {min} تومان)",
        "pay_instructions": ("💳 مبلغ {amount} تومان را به کارت زیر واریز کنید:\n\n"
                             "<code>{card}</code>\n\n"
                             "سپس روی «📤 ارسال رسید» بزنید و عکس رسید یا متن تراکنش را بفرستید.\n"
                             "پس از تایید ادمین، کیف‌پول شما شارژ می‌شود."),
        "send_receipt": "📤 ارسال رسید",
        "receipt_saved": ("✅ رسید شما ثبت شد (کد پیگیری: {rid})\n\n"
                          "به ادمین ارسال شد. پس از بررسی، کیف‌پولتان شارژ می‌شود."),
        "receipt_admin": ("🧾 رسید جدید #{rid}\n\nکاربر: <code>{uid}</code>\n"
                          "مبلغ: {amount} تومان\nیادداشت: {note}"),
        "approve": "✅ تایید و شارژ کیف‌پول",
        "reject": "❌ رد رسید",
        "receipt_approved": ("✅ رسید شما تایید شد!\n\nمبلغ {amount} تومان به کیف‌پول شما اضافه شد.\n"
                             "موجودی فعلی: {bal} تومان"),
        "receipt_rejected": "❌ متأسفانه رسید شما رد شد. برای بررسی با پشتیبانی تماس بگیرید.",
        "receipt_done_already": "این رسید قبلاً بررسی شده است.",
        "await_receipt": "📷 لطفاً عکس رسید یا متن تراکنش را بفرستید…",
        "bad_amount": "❌ مبلغ نامعتبر. فقط عدد، حداقل {min} تومان.",
        "amount_set": "🔢 مبلغ {amount} تومان انتخاب شد.",
        "my_balance": "💰 موجودی شما: {bal} تومان",
        "no_codes": "🎟 هنوز کدی برای شما صادر نشده.",
        "my_codes_txt": "🎟 کدهای شما:\n{lines}",
        "sec_menu": ("🛡 امنیت NiniPro\n\n"
                     "• کدهای اشتراک با HMAC امضا می‌شوند و قابل جعل نیستند.\n"
                     "• هر کد فقط یک‌بار فعال‌سازی می‌شود.\n"
                     "• برای گزارش تخلف از دکمه زیر استفاده کنید."),
        "report": "🚩 گزارش تخلف",
        "report_sent": "✅ گزارش شما برای ادمین ارسال شد.",
        "about_txt": ("NiniPro — پنل مدیریت پروکسی و کانفیگ تلگرام\n"
                      "کدهای اشتراک: امضای HMAC • بدون سرور • ضد جعل\n"
                      "پشتیبانی: @SasaX60"),
        "admin_menu": "⚙️ پنل مدیریت — یک گزینه را انتخاب کنید:",
        "a_gen_free": "➕ ساخت کد رایگان (استاندارد)",
        "a_gen_pro": "⭐ ساخت کد PRO",
        "a_gen_admin": "👑 ساخت کد ادمین",
        "a_del": "🗑 حذف کد اشتراک",
        "a_card": "💳 افزودن/تغییر شماره کارت",
        "a_receipts": "🧾 رسیدهای در انتظار",
        "a_list": "📜 آخرین کدهای صادرشده",
        "a_stats": "📈 آمار کیف‌پول و فروش",
        "code_created": "✅ کد ساخته شد:\n\n<code>{code}</code>",
        "del_prompt": "🗑 کد اشتراکی که می‌خواهید حذف کنید را بفرستید:",
        "del_done": "🗑 کد {code} حذف شد.",
        "del_notfound": "❌ چنین کدی در لیست نیست.",
        "card_prompt": "💳 شماره کارت جدید را بفرستید (مثلاً 6037123412341234):",
        "card_done": "✅ شماره کارت تنظیم شد:\n<code>{card}</code>",
        "no_receipts": "🧾 رسید در انتظاری وجود ندارد.",
        "receipts_list": "🧾 رسیدهای در انتظار:\n\n{lines}",
        "stats_txt": ("📈 آمار:\n\n"
                      "• کدهای صادرشده: {codes}\n"
                      "• رسیدهای تاییدشده: {appr}\n"
                      "• رسیدهای ردشده: {rej}\n"
                      "• مجموع فروش: {total} تومان\n"
                      "• کاربران دارای کیف‌پول: {users}"),
        "no_access": "❌ شما دسترسی مدیریت ندارید.",
    },
    "en": {
        "welcome": "👋 Welcome to the official NiniPro bot!\n\nChoose your language:",
        "lang_set": "✅ Language set to English.",
        "main_menu": "📋 Main menu",
        "buy": "🛒 Buy subscription",
        "wallet": "💰 Wallet",
        "mycodes": "🎟 My codes",
        "security": "🛡 Security",
        "support": "🎧 Contact support",
        "about": "ℹ️ About",
        "admin": "⚙️ Admin panel",
        "back": "🔙 Back to menu",
        "phone_prompt": "📱 Please verify your phone number to continue:",
        "phone_ok": "✅ Phone verified: {phone}",
        "poll_q": "📊 Which protocol do you use most?",
        "poll_opts": ["VLESS", "VMess", "Trojan", "Hysteria2"],
        "choose_plan": "💳 Choose a plan:",
        "plan_trial": f"🎁 7-day trial — {'free' if PRICE_TRIAL == 0 else fmt_toman(PRICE_TRIAL)}",
        "plan_pro": f"⭐ PRO (1 month) — {fmt_toman(PRICE_PRO)}",
        "plan_admin": f"👑 Unlimited — {fmt_toman(PRICE_ADMIN)}",
        "need_topup": "💸 Not enough wallet balance.\n\nBalance: {bal}\nPrice: {price}\n\nTop up your wallet first.",
        "bought": "🎉 Purchase complete!\n\nYour code:\n<code>{code}</code>\n\nEnter it in the NiniPro app.\nNew balance: {bal}",
        "wallet_menu": "💰 Your wallet\n\nBalance: {bal} Toman\n\nChoose an amount to top up (min {min}):",
        "custom_amount": "✏️ Custom amount (min {min})",
        "pay_instructions": "💳 Pay {amount} Toman to this card:\n\n<code>{card}</code>\n\nThen tap «📤 Send receipt» and send a photo or text of the transaction.\nAdmin will approve and credit your wallet.",
        "send_receipt": "📤 Send receipt",
        "receipt_saved": "✅ Receipt saved (ID: {rid})\n\nSent to admin for approval.",
        "receipt_admin": "🧾 New receipt #{rid}\n\nUser: <code>{uid}</code>\nAmount: {amount} Toman\nNote: {note}",
        "approve": "✅ Approve & credit wallet",
        "reject": "❌ Reject receipt",
        "receipt_approved": "✅ Receipt approved!\n{amount} Toman added to your wallet.\nBalance: {bal} Toman",
        "receipt_rejected": "❌ Your receipt was rejected. Contact support.",
        "receipt_done_already": "This receipt was already processed.",
        "await_receipt": "📷 Send a photo or text of your payment receipt…",
        "bad_amount": "❌ Invalid amount. Numbers only, min {min}.",
        "amount_set": "🔢 Amount set: {amount} Toman.",
        "my_balance": "💰 Your balance: {bal} Toman",
        "no_codes": "🎟 No codes issued for you yet.",
        "my_codes_txt": "🎟 Your codes:\n{lines}",
        "sec_menu": "🛡 NiniPro security\n\n• Codes are HMAC-signed and unforgeable.\n• Each code activates once.\n• Use Report for abuse.",
        "report": "🚩 Report abuse",
        "report_sent": "✅ Report sent to admin.",
        "about_txt": "NiniPro — Telegram proxy/config panel.\nHMAC-signed codes. Support: @SasaX60",
        "admin_menu": "⚙️ Admin panel — choose an action:",
        "a_gen_free": "➕ Generate standard code",
        "a_gen_pro": "⭐ Generate PRO code",
        "a_gen_admin": "👑 Generate admin code",
        "a_del": "🗑 Delete a code",
        "a_card": "💳 Set card number",
        "a_receipts": "🧾 Pending receipts",
        "a_list": "📜 Recent codes",
        "a_stats": "📈 Wallet & sales stats",
        "code_created": "✅ Code created:\n\n<code>{code}</code>",
        "del_prompt": "🗑 Send the subscription code to delete:",
        "del_done": "🗑 Code {code} deleted.",
        "del_notfound": "❌ Code not found.",
        "card_prompt": "💳 Send the new card number:",
        "card_done": "✅ Card number updated:\n<code>{card}</code>",
        "no_receipts": "🧾 No pending receipts.",
        "receipts_list": "🧾 Pending receipts:\n\n{lines}",
        "stats_txt": "📈 Stats:\n\n• Codes issued: {codes}\n• Receipts approved: {appr}\n• Receipts rejected: {rej}\n• Total sales: {total} Toman\n• Wallet users: {users}",
        "no_access": "❌ You do not have admin access.",
    },
    "ar": {
        "welcome": "👋 مرحبًا بك في بوت NiniPro الرسمي!\n\nاختر لغتك:",
        "lang_set": "✅ تم ضبط اللغة العربية.",
        "main_menu": "📋 القائمة الرئيسية",
        "buy": "🛒 شراء اشتراك",
        "wallet": "💰 المحفظة",
        "mycodes": "🎟 أكوادي",
        "security": "🛡 الأمان",
        "support": "🎧 الدعم المباشر",
        "about": "ℹ️ حول",
        "admin": "⚙️ لوحة التحكم",
        "back": "🔙 العودة للقائمة",
        "phone_prompt": "📱 يرجى تأكيد رقم هاتفك للمتابعة:",
        "phone_ok": "✅ تم تأكيد الرقم: {phone}",
        "poll_q": "📊 أي بروتوكول تستخدمه أكثر؟",
        "poll_opts": ["VLESS", "VMess", "Trojan", "Hysteria2"],
        "choose_plan": "💳 اختر الخطة:",
        "plan_trial": f"🎁 تجربة ٧ أيام — {'مجاني' if PRICE_TRIAL == 0 else fmt_toman(PRICE_TRIAL)}",
        "plan_pro": f"⭐ برو (شهر) — {fmt_toman(PRICE_PRO)}",
        "plan_admin": f"👑 غير محدود — {fmt_toman(PRICE_ADMIN)}",
        "need_topup": "💸 رصيد المحفظة غير كافٍ.\n\nالرصيد: {bal}\nالسعر: {price}\n\nاشحن محفظتك أولًا.",
        "bought": "🎉 تم الشراء!\n\nكودك:\n<code>{code}</code>\n\nأدخله في تطبيق NiniPro.\nالرصيد الجديد: {bal}",
        "wallet_menu": "💰 محفظتك\n\nالرصيد: {bal} تومان\n\nاختر مبلغ الشحن (الحد الأدنى {min}):",
        "custom_amount": "✏️ مبلغ مخصص (الحد الأدنى {min})",
        "pay_instructions": "💳 وديع {amount} تومان إلى هذا البطاقة:\n\n<code>{card}</code>\n\nثم اضغط «📤 إرسال الإيصال» وأرسل صورة أو نص العملية.",
        "send_receipt": "📤 إرسال الإيصال",
        "receipt_saved": "✅ تم حفظ الإيصال (#{rid})\n\nأُرسل إلى المدير للموافقة.",
        "receipt_admin": "🧾 إيصال جديد #{rid}\n\nالمستخدم: <code>{uid}</code>\nالمبلغ: {amount} تومان\nملاحظة: {note}",
        "approve": "✅ الموافقة والشحن",
        "reject": "❌ رفض الإيصال",
        "receipt_approved": "✅ تمت الموافقة!\nتمت إضافة {amount} تومان إلى محفظتك.\nالرصيد: {bal}",
        "receipt_rejected": "❌ تم رفض إيصالك. تواصل مع الدعم.",
        "receipt_done_already": "هذا الإيصال تمت معالجته مسبقًا.",
        "await_receipt": "📷 أرسل صورة أو نص إيصال الدفع…",
        "bad_amount": "❌ مبلغ غير صالح. أرقام فقط، الحد الأدنى {min}.",
        "amount_set": "🔢 تم تحديد المبلغ: {amount} تومان.",
        "my_balance": "💰 رصيدك: {bal} تومان",
        "no_codes": "🎟 لا توجد أكواد بعد.",
        "my_codes_txt": "🎟 أكوادك:\n{lines}",
        "sec_menu": "🛡 أمان NiniPro\n\n• الأكواد موقعة HMAC وغير قابلة للتزوير.\n• كل كود يُفعّل مرة واحدة.",
        "report": "🚩 إبلاغ",
        "report_sent": "✅ تم إرسال البلاغ.",
        "about_txt": "NiniPro — لوحة إدارة البروكسي.\nالدعم: @SasaX60",
        "admin_menu": "⚙️ لوحة التحكم — اختر إجراءً:",
        "a_gen_free": "➕ إنشاء كود قياسي",
        "a_gen_pro": "⭐ إنشاء كود برو",
        "a_gen_admin": "👑 إنشاء كود مدير",
        "a_del": "🗑 حذف كود",
        "a_card": "💳 تغيير رقم البطاقة",
        "a_receipts": "🧾 الإيصالات المعلقة",
        "a_list": "📜 الأكواد الأخيرة",
        "a_stats": "📈 إحصائيات",
        "code_created": "✅ تم إنشاء الكود:\n\n<code>{code}</code>",
        "del_prompt": "🗑 أرسل الكود المراد حذفه:",
        "del_done": "🗑 تم حذف الكود {code}.",
        "del_notfound": "❌ الكود غير موجود.",
        "card_prompt": "💳 أرسل رقم البطاقة الجديد:",
        "card_done": "✅ تم تحديث البطاقة:\n<code>{card}</code>",
        "no_receipts": "🧾 لا توجد إيصالات معلقة.",
        "receipts_list": "🧾 الإيصالات المعلقة:\n\n{lines}",
        "stats_txt": "📈 الإحصائيات:\n\n• الأكواد: {codes}\n• موافقات: {appr}\n• رفض: {rej}\n• المبيعات: {total} تومان\n• المستخدمون: {users}",
        "no_access": "❌ لا تملك صلاحية المدير.",
    },
}

USER_LANG = DB["lang"]          # uid -> lang (persisted)
ONBOARD = {}                    # uid -> 'lang' | 'phone' | 'done'
PENDING = {}                    # uid -> {'kind','plan','amount','rid'}
AWAIT = {}                      # uid -> 'receipt' | 'del_code' | 'set_card'


def L(uid):
    return I18N[USER_LANG.get(str(uid), "fa")]


# ----------------------------------------------------------------------------
# Keyboards — every button full width (one per row)
# ----------------------------------------------------------------------------
def lang_kb():
    return {"inline_keyboard": [
        [{"text": "🇮🇷 فارسی", "callback_data": "lang:fa"}],
        [{"text": "🇬🇧 English", "callback_data": "lang:en"}],
        [{"text": "🇸🇦 العربية", "callback_data": "lang:ar"}],
    ]}


def main_kb(uid):
    t = L(uid)
    rows = [
        [{"text": t["buy"], "callback_data": "buy"}],
        [{"text": t["wallet"], "callback_data": "wallet"}],
        [{"text": t["mycodes"], "callback_data": "mycodes"}],
        [{"text": t["security"], "callback_data": "sec"}],
        [{"text": t["support"], "url": SUPPORT_URL}],
        [{"text": t["about"], "callback_data": "about"}],
    ]
    if uid in ADMIN_IDS:
        rows.append([{"text": t["admin"], "callback_data": "admin"}])
    return {"inline_keyboard": rows}


def back_kb(uid):
    return {"inline_keyboard": [[{"text": L(uid)["back"], "callback_data": "home"}]]}


def plan_kb(uid):
    t = L(uid)
    return {"inline_keyboard": [
        [{"text": t["plan_trial"], "callback_data": "plan:trial"}],
        [{"text": t["plan_pro"], "callback_data": "plan:pro"}],
        [{"text": t["plan_admin"], "callback_data": "plan:admin"}],
        [{"text": t["support"], "url": SUPPORT_URL}],
        [{"text": t["back"], "callback_data": "home"}],
    ]}


def wallet_kb(uid):
    t = L(uid)
    rows = [[{"text": f"＋ {a:,} تومان".replace(",", "٬"), "callback_data": f"topup:{a}"}
             for a in TOPUP_AMOUNTS[i:i + 2]] for i in range(0, len(TOPUP_AMOUNTS), 2)]
    rows.append([{"text": t["custom_amount"].format(min=MIN_TOPUP), "callback_data": "topup:custom"}])
    rows.append([{"text": t["back"], "callback_data": "home"}])
    return {"inline_keyboard": rows}


def admin_kb(uid):
    t = L(uid)
    return {"inline_keyboard": [
        [{"text": t["a_gen_free"], "callback_data": "gen:standard"}],
        [{"text": t["a_gen_pro"], "callback_data": "gen:vip_premium"}],
        [{"text": t["a_gen_admin"], "callback_data": "gen:admin_unlimited"}],
        [{"text": t["a_del"], "callback_data": "adel"}],
        [{"text": t["a_card"], "callback_data": "acard"}],
        [{"text": t["a_receipts"], "callback_data": "areceipts"}],
        [{"text": t["a_list"], "callback_data": "alist"}],
        [{"text": t["a_stats"], "callback_data": "astats"}],
        [{"text": t["back"], "callback_data": "home"}],
    ]}


def receipt_kb(rid):
    return {"inline_keyboard": [
        [{"text": "✅ تایید و شارژ کیف‌پول", "callback_data": f"rok:{rid}"}],
        [{"text": "❌ رد رسید", "callback_data": f"rno:{rid}"}],
    ]}


# ----------------------------------------------------------------------------
# Flows
# ----------------------------------------------------------------------------
def show_home(chat_id, uid, edit_id=None):
    t = L(uid)
    if edit_id:
        edit_message(chat_id, edit_id, t["main_menu"], main_kb(uid))
    else:
        send_message(chat_id, t["main_menu"], main_kb(uid))


def issue_code(uid, tier):
    code = make_code(tier)
    DB["codes"].insert(0, {"code": code, "tier": tier, "uid": int(uid), "ts": int(time.time())})
    DB["codes"] = DB["codes"][:500]
    db_save()
    return code


def start_topup(uid, chat_id, amount, edit_id=None):
    t = L(uid)
    PENDING[uid] = {"kind": "topup", "amount": int(amount)}
    txt = t["pay_instructions"].format(amount=f"{int(amount):,}".replace(",", "٬"), card=CARD_NUMBER)
    kb = {"inline_keyboard": [
        [{"text": t["send_receipt"], "callback_data": "sendreceipt"}],
        [{"text": t["support"], "url": SUPPORT_URL}],
        [{"text": t["back"], "callback_data": "home"}],
    ]}
    if edit_id:
        edit_message(chat_id, edit_id, txt, kb, parse_mode="HTML")
    else:
        send_message(chat_id, txt, kb, parse_mode="HTML")


def buy_plan(uid, chat_id, plan, edit_id=None):
    t = L(uid)
    price = PLAN_PRICE.get(plan, 0)
    bal = get_bal(uid)
    if price > bal:
        txt = t["need_topup"].format(bal=f"{bal:,}".replace(",", "٬"), price=f"{price:,}".replace(",", "٬"))
        kb = {"inline_keyboard": [
            [{"text": t["wallet"], "callback_data": "wallet"}],
            [{"text": t["support"], "url": SUPPORT_URL}],
            [{"text": t["back"], "callback_data": "home"}],
        ]}
        if edit_id:
            edit_message(chat_id, edit_id, txt, kb)
        else:
            send_message(chat_id, txt, kb)
        return
    if price > 0 and not sub_bal(uid, price):
        return
    code = issue_code(uid, PLAN_TIER[plan])
    txt = t["bought"].format(code=code, bal=f"{get_bal(uid):,}".replace(",", "٬"))
    if edit_id:
        edit_message(chat_id, edit_id, txt, back_kb(uid), parse_mode="HTML")
    else:
        send_message(chat_id, txt, back_kb(uid), parse_mode="HTML")


def submit_receipt(uid, chat_id, note, edit_id=None):
    t = L(uid)
    amount = int((PENDING.get(uid) or {}).get("amount", 0))
    if amount <= 0:
        amount = MIN_TOPUP
    rid = new_rid()
    DB["receipts"][rid] = {"uid": int(uid), "amount": amount, "note": note[:300],
                           "ts": int(time.time()), "status": "pending"}
    db_save()
    PENDING.pop(uid, None)
    # notify admin
    for aid in ADMIN_IDS:
        send_message(aid, t["receipt_admin"].format(rid=rid, uid=uid,
                     amount=f"{amount:,}".replace(",", "٬"), note=note[:200]),
                     receipt_kb(rid), parse_mode="HTML")
    txt = t["receipt_saved"].format(rid=rid)
    if edit_id:
        edit_message(chat_id, edit_id, txt, back_kb(uid))
    else:
        send_message(chat_id, txt, back_kb(uid))


def handle_callback(uid, chat_id, data, msg_id):
    t = L(uid)

    if data.startswith("lang:"):
        USER_LANG[str(uid)] = data.split(":", 1)[1]
        db_save()
        t = L(uid)
        if uid in ADMIN_IDS:
            ONBOARD[uid] = "done"
            edit_message(chat_id, msg_id, t["lang_set"] + "\n\n" + t["main_menu"], main_kb(uid))
            return
        edit_message(chat_id, msg_id, t["lang_set"], None)
        ONBOARD[uid] = "phone"
        send_contact_request(chat_id, t["phone_prompt"])
        return

    if data == "home":
        show_home(chat_id, uid, msg_id)
        return

    if data == "buy":
        edit_message(chat_id, msg_id, t["choose_plan"], plan_kb(uid))
        return

    if data.startswith("plan:"):
        buy_plan(uid, chat_id, data.split(":", 1)[1], msg_id)
        return

    if data == "wallet":
        edit_message(chat_id, msg_id,
                     t["wallet_menu"].format(bal=f"{get_bal(uid):,}".replace(",", "٬"), min=MIN_TOPUP),
                     wallet_kb(uid))
        return

    if data.startswith("topup:"):
        v = data.split(":", 1)[1]
        if v == "custom":
            PENDING[uid] = {"kind": "custom_amount"}
            edit_message(chat_id, msg_id, t["custom_amount"].format(min=MIN_TOPUP), back_kb(uid))
        else:
            start_topup(uid, chat_id, int(v), msg_id)
        return

    if data == "sendreceipt":
        AWAIT[uid] = "receipt"
        edit_message(chat_id, msg_id, t["await_receipt"], back_kb(uid))
        return

    if data == "mycodes":
        mine = [c for c in DB["codes"] if c.get("uid") == int(uid)]
        if not mine:
            edit_message(chat_id, msg_id, t["no_codes"], back_kb(uid))
        else:
            lines = "\n".join(f"• <code>{c['code']}</code>" for c in mine[:10])
            edit_message(chat_id, msg_id, t["my_codes_txt"].format(lines=lines),
                         back_kb(uid), parse_mode="HTML")
        return

    if data == "sec":
        edit_message(chat_id, msg_id, t["sec_menu"], {"inline_keyboard": [
            [{"text": t["report"], "callback_data": "report"}],
            [{"text": t["support"], "url": SUPPORT_URL}],
            [{"text": t["back"], "callback_data": "home"}],
        ]})
        return

    if data == "report":
        edit_message(chat_id, msg_id, t["report_sent"], back_kb(uid))
        for aid in ADMIN_IDS:
            send_message(aid, f"🚩 گزارش تخلف از کاربر {uid}")
        return

    if data == "about":
        edit_message(chat_id, msg_id, t["about_txt"], back_kb(uid))
        return

    # ---------------- admin ----------------
    if data == "admin":
        if uid not in ADMIN_IDS:
            edit_message(chat_id, msg_id, t["no_access"], back_kb(uid))
            return
        edit_message(chat_id, msg_id, t["admin_menu"], admin_kb(uid))
        return

    if data.startswith("gen:"):
        if uid not in ADMIN_IDS:
            return
        code = issue_code(uid, data.split(":", 1)[1])
        edit_message(chat_id, msg_id, t["code_created"].format(code=code), admin_kb(uid), parse_mode="HTML")
        return

    if data == "adel":
        if uid not in ADMIN_IDS:
            return
        AWAIT[uid] = "del_code"
        edit_message(chat_id, msg_id, t["del_prompt"], admin_kb(uid))
        return

    if data == "acard":
        if uid not in ADMIN_IDS:
            return
        AWAIT[uid] = "set_card"
        edit_message(chat_id, msg_id, t["card_prompt"], admin_kb(uid))
        return

    if data == "areceipts":
        if uid not in ADMIN_IDS:
            return
        pend = [(rid, r) for rid, r in DB["receipts"].items() if r["status"] == "pending"]
        if not pend:
            edit_message(chat_id, msg_id, t["no_receipts"], admin_kb(uid))
        else:
            lines = "\n".join(f"#{rid} — کاربر <code>{r['uid']}</code> — {r['amount']:,} تومان".replace(",", "٬")
                              for rid, r in pend[:10])
            edit_message(chat_id, msg_id, t["receipts_list"].format(lines=lines), admin_kb(uid), parse_mode="HTML")
        return

    if data.startswith("rok:") or data.startswith("rno:"):
        if uid not in ADMIN_IDS:
            return
        rid = data.split(":", 1)[1]
        r = DB["receipts"].get(rid)
        if not r or r["status"] != "pending":
            edit_message(chat_id, msg_id, t["receipt_done_already"], admin_kb(uid))
            return
        if data.startswith("rok:"):
            r["status"] = "approved"
            newb = add_bal(r["uid"], r["amount"])
            db_save()
            send_message(r["uid"], L(r["uid"])["receipt_approved"].format(
                amount=f"{r['amount']:,}".replace(",", "٬"), bal=f"{newb:,}".replace(",", "٬")))
            edit_message(chat_id, msg_id, f"✅ رسید #{rid} تایید و {r['amount']} تومان شارژ شد.", admin_kb(uid))
        else:
            r["status"] = "rejected"
            db_save()
            send_message(r["uid"], L(r["uid"])["receipt_rejected"])
            edit_message(chat_id, msg_id, f"❌ رسید #{rid} رد شد.", admin_kb(uid))
        return

    if data == "alist":
        if uid not in ADMIN_IDS:
            return
        if not DB["codes"]:
            edit_message(chat_id, msg_id, "📜 هنوز کدی صادر نشده.", admin_kb(uid))
        else:
            lines = "\n".join(f"• <code>{c['code']}</code> ({c['tier']})" for c in DB["codes"][:12])
            edit_message(chat_id, msg_id, f"📜 آخرین کدها:\n{lines}", admin_kb(uid), parse_mode="HTML")
        return

    if data == "astats":
        if uid not in ADMIN_IDS:
            return
        appr = sum(1 for r in DB["receipts"].values() if r["status"] == "approved")
        rej = sum(1 for r in DB["receipts"].values() if r["status"] == "rejected")
        total = sum(r["amount"] for r in DB["receipts"].values() if r["status"] == "approved")
        edit_message(chat_id, msg_id, t["stats_txt"].format(
            codes=len(DB["codes"]), appr=appr, rej=rej,
            total=f"{total:,}".replace(",", "٬"), users=len(DB["wallets"])), admin_kb(uid))
        return


def handle_message(uid, chat_id, text, contact=None, photo=False):
    t = L(uid)
    step = ONBOARD.get(uid, "lang")

    # awaiting admin input
    if AWAIT.get(uid) == "del_code" and uid in ADMIN_IDS:
        code = (text or "").strip().upper()
        found = [c for c in DB["codes"] if c["code"].upper() == code]
        if found:
            DB["codes"] = [c for c in DB["codes"] if c["code"].upper() != code]
            db_save()
            send_message(chat_id, t["del_done"].format(code=code), admin_kb(uid))
        else:
            send_message(chat_id, t["del_notfound"], admin_kb(uid))
        AWAIT.pop(uid, None)
        return

    if AWAIT.get(uid) == "set_card" and uid in ADMIN_IDS:
        global CARD_NUMBER
        CARD_NUMBER = (text or "").strip()
        db_save()
        send_message(chat_id, t["card_done"].format(card=CARD_NUMBER), admin_kb(uid))
        AWAIT.pop(uid, None)
        return

    # user sent receipt (photo or text)
    if AWAIT.get(uid) == "receipt":
        note = text if text else ("📷 رسید تصویری" if photo else "رسید")
        submit_receipt(uid, chat_id, note)
        AWAIT.pop(uid, None)
        return

    # custom topup amount
    if (PENDING.get(uid) or {}).get("kind") == "custom_amount":
        try:
            amt = int("".join(ch for ch in (text or "") if ch.isdigit()
                              or ch in "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩"))
        except ValueError:
            amt = 0
        for fa, en in zip("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789"):
            amt = int(str(amt).replace(fa, en)) if isinstance(amt, int) else amt
        amt = int(str(amt).translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789"))) \
            if not isinstance(amt, int) else amt
        if amt < MIN_TOPUP:
            send_message(chat_id, t["bad_amount"].format(min=MIN_TOPUP), wallet_kb(uid))
            return
        PENDING.pop(uid, None)
        start_topup(uid, chat_id, amt)
        return

    # phone during onboarding (users only)
    if contact and contact.get("phone_number") and step == "phone":
        DB["phone"][str(uid)] = contact["phone_number"]
        db_save()
        ONBOARD[uid] = "done"
        send_message(chat_id, t["phone_ok"].format(phone=contact["phone_number"]), None)
        send_poll(chat_id, t["poll_q"], t["poll_opts"])
        send_message(chat_id, t["main_menu"], main_kb(uid))
        send_message(chat_id, "✅", {"remove_keyboard": True})
        return

    if text == "/start":
        if step == "done" or uid in ADMIN_IDS:
            ONBOARD[uid] = "done"
            show_home(chat_id, uid)
        else:
            ONBOARD[uid] = "lang"
            send_message(chat_id, t["welcome"], lang_kb())
        return

    # default: show menu
    show_home(chat_id, uid)


# ----------------------------------------------------------------------------
# Update loop
# ----------------------------------------------------------------------------
def main():
    if not BOT_TOKEN:
        sys.stderr.write("\nERROR: BOT_TOKEN env var is required.\n")
        sys.exit(1)
    db_load()
    offset = 0
    sys.stderr.write("NiniPro bot v2 started.\n")
    while True:
        try:
            upd = _call("getUpdates", {"offset": offset, "timeout": 30})
            if not upd.get("ok"):
                time.sleep(3)
                continue
            for u in upd.get("result", []):
                offset = u["update_id"] + 1
                if "callback_query" in u:
                    q = u["callback_query"]
                    uid = q["from"]["id"]
                    chat_id = q["message"]["chat"]["id"]
                    handle_callback(uid, chat_id, q["data"], q["message"]["message_id"])
                    answer_callback(q["id"])
                elif "message" in u:
                    m = u["message"]
                    uid = m["from"]["id"]
                    chat_id = m["chat"]["id"]
                    text = m.get("text", "")
                    photo = bool(m.get("photo"))
                    handle_message(uid, chat_id, text, m.get("contact"), photo)
        except KeyboardInterrupt:
            break
        except Exception as e:  # noqa
            sys.stderr.write(f"[loop] {e}\n")
            time.sleep(3)


if __name__ == "__main__":
    main()
