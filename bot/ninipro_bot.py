#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NiniPro — Telegram Subscription Bot
===================================
ربات فروش و مدیریت کدهای اشتراک NiniPro.

ویژگی‌ها:
  • چندزبانه (فارسی / انگلیسی / عربی)
  • تایید شماره‌تماس کاربر (Telegram contact)
  • نظرسنجی (Telegram native poll)
  • منوی امنیت (راهنما + گزارش تخلف)
  • پنل مدیریت: دکمه برای هر کار + «بازگشت به منو» در هر صفحه
  • تولید کد اشتراک امضاشده با HMAC (هم‌راستا با اپلیکیشن — بدون سرور)

کدها با همان الگوریتم HMAC-SHA256 + base32 (الفبای نوا) ساخته می‌شوند
که توی src/utils/licensePro.ts توی اپ چک می‌شود. پس ربات و اپ بدون
سرور به هم متصل‌اند.

نصب/اجرا:
  pip install requests   (یا بدون نصب — از urllib داخلی استفاده می‌شود)
  export BOT_TOKEN="8886926384:AAH-...."
  python3 ninipro_bot.py

متغیرهای محیطی (اختیاری):
  BOT_TOKEN      توکن ربات (اجباری)
  ADMIN_IDS       لیست id مدیران با کاما، مثال "7581433749"
  CARD_NUMBER    شماره کارت نمایشی
  PRICE_TRIAL / PRICE_PRO / PRICE_ADMIN   قیمت‌ها (تومان)
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
BOT_TOKEN = os.environ.get("BOT_TOKEN", "8886926384:AAH-VknKeWIBwlj_9gYvy8Q1fdHkiwtaSJg")
ADMIN_IDS = set(int(x) for x in os.environ.get("ADMIN_IDS", "7581433749").split(",") if x.strip())
CARD_NUMBER = os.environ.get("CARD_NUMBER", "6037-XXXX-XXXX-XXXX")  # ← شماره کارت خودت را بگذار
PRICE_TRIAL = os.environ.get("PRICE_TRIAL", "رایگان (تست ۷ روزه)")
PRICE_PRO = os.environ.get("PRICE_PRO", "۱۹۹٬۰۰۰ تومان / ماه")
PRICE_ADMIN = os.environ.get("PRICE_ADMIN", "۵۹۹٬۰۰۰ تومان / نامحدود")

# Secret مشترک با اپلیکیشن (باید دقیقاً با src/utils/licensePro.ts یکی باشد)
SECRET = "NINIPRO-HMAC-2026-e657e99bce5be41a0e40b8a46ec7156c"

ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # 32 chars (بدون I,O,0,1)


# ----------------------------------------------------------------------------
# HMAC code generator (matches app's Web Crypto implementation)
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
    checksum = sign_payload(payload)
    return f"NINI-{payload}-{checksum}"


# ----------------------------------------------------------------------------
# Telegram HTTP helper (urllib, no external deps)
# ----------------------------------------------------------------------------
API = f"https://api.telegram.org/bot{BOT_TOKEN}"


def _call(method: str, data: dict | None = None, files: dict | None = None, timeout: int = 40):
    url = f"{API}/{method}"
    try:
        if files:
            boundary = "----NiniProBoundary"
            body = bytearray()
            for k, v in (data or {}).items():
                body += f"--{boundary}\r\n".encode()
                body += f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode()
                body += str(v).encode() + b"\r\n"
            for k, path in files.items():
                body += f"--{boundary}\r\n".encode()
                body += f'Content-Disposition: form-data; name="{k}"; filename="file"\r\n'.encode()
                body += b"Content-Type: application/octet-stream\r\n\r\n"
                with open(path, "rb") as f:
                    body += f.read()
                body += b"\r\n"
            body += f"--{boundary}--\r\n".encode()
            req = urllib.request.Request(url, data=bytes(body), method="POST")
            req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
        else:
            req = urllib.request.Request(url, data=urllib.parse.urlencode(data or {}).encode(), method="POST")
            req.add_header("Content-Type", "application/x-www-form-urlencoded")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:  # noqa
        sys.stderr.write(f"[http {method}] {e}\n")
        return {}


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
    return _call("editMessageText", data)


def send_poll(chat_id, question, options, is_anonymous=True):
    data = {
        "chat_id": chat_id,
        "question": question,
        "options": json.dumps(options, ensure_ascii=False),
        "is_anonymous": "true" if is_anonymous else "false",
    }
    return _call("sendPoll", data)


def answer_callback(query_id, text=None):
    data = {"callback_query_id": query_id}
    if text:
        data["text"] = text
    return _call("answerCallbackQuery", data)


def send_contact_request(chat_id, text):
    kb = {"keyboard": [[{"text": "✅ تایید شماره من", "request_contact": True}]], "resize_keyboard": True, "one_time_keyboard": True}
    return send_message(chat_id, text, reply_markup=kb)


# ----------------------------------------------------------------------------
# i18n
# ----------------------------------------------------------------------------
I18N = {
    "fa": {
        "welcome": "👋 به ربات رسمی **NiniPro** خوش آمدید!\n\nلطفاً زبان خود را انتخاب کنید:",
        "lang_set": "زبان فارسی تنظیم شد. از منوی زیر استفاده کنید:",
        "main_menu": "📋 منوی اصلی:",
        "buy": "🛒 خرید اشتراک",
        "phone": "📱 تایید شماره",
        "poll": "📊 نظرسنجی",
        "security": "🛡 منوی امنیت",
        "about": "ℹ️ درباره",
        "admin": "⚙️ پنل مدیریت",
        "back": "🔙 بازگشت به منو",
        "choose_plan": "💳 پلن مورد نظر را انتخاب کنید:\n\nشماره کارت جهت واریز:\n<code>{card}</code>",
        "plan_trial": f"🎁 تست رایگان (۷ روز)",
        "plan_pro": f"⭐ پلن PRO — {PRICE_PRO}",
        "plan_admin": f"👑 پلن نامحدود (ادمین) — {PRICE_ADMIN}",
        "paid": "✅ اگر واریز را انجام دادید، دکمه «پرداخت انجام شد» را بزنید تا کد اشتراکتان صادر شود.\nدر غیر این صورت «بازگشت به منو».",
        "paid_btn": "✅ پرداخت انجام شد",
        "code_issued": "🎉 کد اشتراک شما صادر شد:\n\n<code>{code}</code>\n\nاین کد را در اپلیکیشن NiniPro وارد کنید.",
        "phone_prompt": "برای تایید هویت، دکمه زیر را بزنید تا شماره‌تان تایید شود:",
        "phone_ok": "✅ شماره شما تایید شد: {phone}",
        "phone_fail": "❌ نتوانستم شماره را دریافت کنم. لطفاً دکمه تایید را بزنید.",
        "poll_q": "کدام پروتکل NiniPro برایتان بهتر کار کرد؟",
        "poll_opts": ["VLESS", "VMess", "Trojan", "Hysteria2"],
        "sec_menu": "🛡 منوی امنیت:\n\n• کدهای اشتراک امضاشده (HMAC) هستند و جعلی نیستند.\n• رمز عبور خود را در جای امن نگه دارید.\n• در صورت مشاهده تخلف، گزینه «گزارش» را بزنید.",
        "report": "🚩 گزارش تخلف",
        "report_sent": "✅ گزارش شما ارسال شد. مدیریت بررسی می‌کند.",
        "about_txt": "NiniPro v3.5 — پنل مدیریت پروکسی و کانفیگ تلگرام.\nربات فروش و پشتیبانی اشتراک.",
        "admin_menu": "⚙️ پنل مدیریت — دکمه مورد نظر را بزنید:",
        "a_gen_free": "➕ ساخت کد رایگان",
        "a_gen_pro": "⭐ ساخت کد PRO",
        "a_gen_admin": "👑 ساخت کد ادمین",
        "a_list": "📜 لیست کدهای اخیر",
        "a_stats": "📈 آمار",
        "no_access": "❌ شما دسترسی مدیریت ندارید.",
    },
    "en": {
        "welcome": "👋 Welcome to the official **NiniPro** bot!\n\nPlease choose your language:",
        "lang_set": "Language set to English. Use the menu below:",
        "main_menu": "📋 Main menu:",
        "buy": "🛒 Buy subscription",
        "phone": "📱 Confirm phone",
        "poll": "📊 Poll",
        "security": "🛡 Security menu",
        "about": "ℹ️ About",
        "admin": "⚙️ Admin panel",
        "back": "🔙 Back to menu",
        "choose_plan": "💳 Choose a plan:\n\nCard number for payment:\n<code>{card}</code>",
        "plan_trial": "🎁 Free trial (7 days)",
        "plan_pro": f"⭐ PRO plan — {PRICE_PRO}",
        "plan_admin": f"👑 Unlimited (admin) — {PRICE_ADMIN}",
        "paid": "✅ If you have paid, tap «Payment done» to receive your code.\nOtherwise tap «Back to menu».",
        "paid_btn": "✅ Payment done",
        "code_issued": "🎉 Your subscription code:\n\n<code>{code}</code>\n\nEnter it in the NiniPro app.",
        "phone_prompt": "To verify your identity, tap the button below:",
        "phone_ok": "✅ Phone verified: {phone}",
        "phone_fail": "❌ Could not read your phone. Please tap verify.",
        "poll_q": "Which NiniPro protocol worked best for you?",
        "poll_opts": ["VLESS", "VMess", "Trojan", "Hysteria2"],
        "sec_menu": "🛡 Security menu:\n\n• Subscription codes are HMAC-signed (not forgeable).\n• Keep your password safe.\n• Use «Report» if you see abuse.",
        "report": "🚩 Report abuse",
        "report_sent": "✅ Report sent. Admin will review.",
        "about_txt": "NiniPro v3.5 — Telegram proxy/config management panel.\nSubscription sales & support bot.",
        "admin_menu": "⚙️ Admin panel — choose an action:",
        "a_gen_free": "➕ Generate free code",
        "a_gen_pro": "⭐ Generate PRO code",
        "a_gen_admin": "👑 Generate admin code",
        "a_list": "📜 Recent codes",
        "a_stats": "📈 Stats",
        "no_access": "❌ You do not have admin access.",
    },
    "ar": {
        "welcome": "👋 مرحبًا بك في بوت **NiniPro** الرسمي!\n\nيرجى اختيار لغتك:",
        "lang_set": "تم ضبط العربية. استخدم القائمة أدناه:",
        "main_menu": "📋 القائمة الرئيسية:",
        "buy": "🛒 شراء اشتراك",
        "phone": "📱 تأكيد الرقم",
        "poll": "📊 استطلاع",
        "security": "🛡 قائمة الأمان",
        "about": "ℹ️ حول",
        "admin": "⚙️ لوحة التحكم",
        "back": "🔙 العودة للقائمة",
        "choose_plan": "💳 اختر الخطة:\n\nرقم البطاقة:\n<code>{card}</code>",
        "plan_trial": "🎁 تجربة مجانية (٧ أيام)",
        "plan_pro": f"⭐ خطة PRO — {PRICE_PRO}",
        "plan_admin": f"👑 خطة غير محدودة — {PRICE_ADMIN}",
        "paid": "✅ إذا كنت قد دفعت، اضغط «تم الدفع» للحصول على الكود.",
        "paid_btn": "✅ تم الدفع",
        "code_issued": "🎉 كود الاشتراك الخاص بك:\n\n<code>{code}</code>\n\nأدخله في تطبيق NiniPro.",
        "phone_prompt": "لتأكيد هويتك، اضغط الزر أدناه:",
        "phone_ok": "✅ تم تأكيد الرقم: {phone}",
        "phone_fail": "❌ تعذّر قراءة الرقم. يرجى الضغط للتأكيد.",
        "poll_q": "أي بروتوكول NiniPro عمل معك بشكل أفضل؟",
        "poll_opts": ["VLESS", "VMess", "Trojan", "Hysteria2"],
        "sec_menu": "🛡 قائمة الأمان:\n\n• الأكواد موقعة بـ HMAC (غير قابلة للتزوير).\n• احفظ كلمتك في مكان آمن.\n• استخدم «إبلاغ» عند المخالفة.",
        "report": "🚩 إبلاغ",
        "report_sent": "✅ تم إرسال البلاغ.",
        "about_txt": "NiniPro v3.5 — لوحة إدارة بروكسي تلغرام.\nبوت مبيعات ودعم الاشتراكات.",
        "admin_menu": "⚙️ لوحة التحكم — اختر إجراءً:",
        "a_gen_free": "➕ إنشاء كود مجاني",
        "a_gen_pro": "⭐ إنشاء كود PRO",
        "a_gen_admin": "👑 إنشاء كود مدير",
        "a_list": "📜 الأكواد الأخيرة",
        "a_stats": "📈 الإحصائيات",
        "no_access": "❌ ليس لديك صلاحية مدير.",
    },
}

# Recent codes issued by the bot (in-memory; deploy with DB for persistence)
RECENT_CODES = []


# ----------------------------------------------------------------------------
# Keyboards
# ----------------------------------------------------------------------------
def lang_kb():
    return {"inline_keyboard": [[
        {"text": "🇮🇷 فارسی", "callback_data": "lang:fa"},
        {"text": "🇬🇧 English", "callback_data": "lang:en"},
        {"text": "🇸🇦 العربية", "callback_data": "lang:ar"},
    ]]}


def main_kb(uid):
    t = "fa"
    if uid in USER_LANG:
        t = USER_LANG[uid]
    L = I18N[t]
    rows = [[{"text": L["buy"], "callback_data": "buy"}],
            [{"text": L["phone"], "callback_data": "phone"}],
            [{"text": L["poll"], "callback_data": "poll"}],
            [{"text": L["security"], "callback_data": "sec"}],
            [{"text": L["about"], "callback_data": "about"}]]
    if uid in ADMIN_IDS:
        rows.append([{"text": L["admin"], "callback_data": "admin"}])
    return {"inline_keyboard": rows}


def back_kb(uid):
    t = USER_LANG.get(uid, "fa")
    return {"inline_keyboard": [[{"text": I18N[t]["back"], "callback_data": "home"}]]}


def plan_kb(uid):
    t = USER_LANG.get(uid, "fa")
    L = I18N[t]
    return {"inline_keyboard": [
        [{"text": L["plan_trial"], "callback_data": "plan:trial"}],
        [{"text": L["plan_pro"], "callback_data": "plan:pro"}],
        [{"text": L["plan_admin"], "callback_data": "plan:admin"}],
        [{"text": L["back"], "callback_data": "home"}],
    ]}


def paid_kb(uid):
    t = USER_LANG.get(uid, "fa")
    L = I18N[t]
    return {"inline_keyboard": [
        [{"text": L["paid_btn"], "callback_data": "paid"}],
        [{"text": L["back"], "callback_data": "home"}],
    ]}


def admin_kb(uid):
    t = USER_LANG.get(uid, "fa")
    L = I18N[t]
    return {"inline_keyboard": [
        [{"text": L["a_gen_free"], "callback_data": "gen:standard"}],
        [{"text": L["a_gen_pro"], "callback_data": "gen:vip"}],
        [{"text": L["a_gen_admin"], "callback_data": "gen:admin"}],
        [{"text": L["a_list"], "callback_data": "alist"}],
        [{"text": L["a_stats"], "callback_data": "astats"}],
        [{"text": L["back"], "callback_data": "home"}],
    ]}


USER_LANG = {}


# ----------------------------------------------------------------------------
# Handlers
# ----------------------------------------------------------------------------
def show_home(chat_id, uid, edit_id=None):
    t = USER_LANG.get(uid, "fa")
    L = I18N[t]
    text = f"{L['main_menu']}"
    kb = main_kb(uid)
    if edit_id:
        edit_message(chat_id, edit_id, text, kb)
    else:
        send_message(chat_id, text, kb)


def handle_callback(uid, chat_id, data, msg_id):
    t = USER_LANG.get(uid, "fa")
    L = I18N[t]

    if data.startswith("lang:"):
        USER_LANG[uid] = data.split(":", 1)[1]
        L = I18N[USER_LANG[uid]]
        edit_message(chat_id, msg_id, L["lang_set"], main_kb(uid))
        return

    if data == "home":
        show_home(chat_id, uid, msg_id)
        return

    if data == "buy":
        edit_message(chat_id, msg_id, L["choose_plan"].format(card=CARD_NUMBER), plan_kb(uid))
        return

    if data.startswith("plan:"):
        tier = data.split(":", 1)[1]
        edit_message(chat_id, msg_id,
                     L["choose_plan"].format(card=CARD_NUMBER) + "\n\n⏳ " + ("تست رایگان" if tier == "trial" else "پلن انتخاب شد"),
                     plan_kb(uid))
        # store pending tier for the paid step
        PENDING[uid] = "standard" if tier == "trial" else tier
        edit_message(chat_id, msg_id,
                     L["paid"] + ("\n\n🎁 نسخه رایگان تستی." if tier == "trial" else ""),
                     paid_kb(uid))
        return

    if data == "paid":
        tier = PENDING.get(uid, "standard")
        code = make_code(tier)
        RECENT_CODES.insert(0, {"code": code, "tier": tier, "ts": int(time.time())})
        RECENT_CODES[:] = RECENT_CODES[:20]
        edit_message(chat_id, msg_id, L["code_issued"].format(code=code), back_kb(uid), parse_mode="HTML")
        return

    if data == "phone":
        send_contact_request(chat_id, L["phone_prompt"])
        return

    if data == "poll":
        send_poll(chat_id, L["poll_q"], L["poll_opts"])
        edit_message(chat_id, msg_id, L["main_menu"], main_kb(uid))
        return

    if data == "sec":
        edit_message(chat_id, msg_id, L["sec_menu"],
                     {"inline_keyboard": [
                         [{"text": L["report"], "callback_data": "report"}],
                         [{"text": L["back"], "callback_data": "home"}],
                     ]})
        return

    if data == "report":
        edit_message(chat_id, msg_id, L["report_sent"], back_kb(uid))
        for aid in ADMIN_IDS:
            send_message(aid, f"🚩 گزارش تخلف از کاربر {uid}")
        return

    if data == "about":
        edit_message(chat_id, msg_id, L["about_txt"], back_kb(uid))
        return

    if data == "admin":
        if uid not in ADMIN_IDS:
            edit_message(chat_id, msg_id, L["no_access"], back_kb(uid))
            return
        edit_message(chat_id, msg_id, L["admin_menu"], admin_kb(uid))
        return

    if data.startswith("gen:"):
        if uid not in ADMIN_IDS:
            edit_message(chat_id, msg_id, L["no_access"], back_kb(uid))
            return
        tier = data.split(":", 1)[1]
        code = make_code(tier)
        RECENT_CODES.insert(0, {"code": code, "tier": tier, "ts": int(time.time())})
        RECENT_CODES[:] = RECENT_CODES[:20]
        edit_message(chat_id, msg_id,
                     f"✅ کد ساخته شد:\n\n<code>{code}</code>", back_kb(uid), parse_mode="HTML")
        return

    if data == "alist":
        if not RECENT_CODES:
            edit_message(chat_id, msg_id, "📜 هنوز کدی صادر نشده.", back_kb(uid))
        else:
            lines = "\n".join(f"• <code>{c['code']}</code> ({c['tier']})" for c in RECENT_CODES[:10])
            edit_message(chat_id, msg_id, f"📜 آخرین کدها:\n{lines}", back_kb(uid), parse_mode="HTML")
        return

    if data == "astats":
        edit_message(chat_id, msg_id, f"📈 کدهای صادر شده: {len(RECENT_CODES)}", back_kb(uid))
        return


PENDING = {}


def handle_message(uid, chat_id, text, contact=None):
    t = USER_LANG.get(uid, "fa")
    L = I18N[t]

    if contact and contact.get("phone_number"):
        send_message(chat_id, L["phone_ok"].format(phone=contact["phone_number"]), main_kb(uid))
        return

    if text == "/start":
        USER_LANG[uid] = "fa"
        send_message(chat_id, L["welcome"], lang_kb(), parse_mode="Markdown")
        return

    # fallback
    show_home(chat_id, uid)


# ----------------------------------------------------------------------------
# Update loop
# ----------------------------------------------------------------------------
def main():
    offset = 0
    sys.stderr.write("NiniPro bot started.\n")
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
                    data = q["data"]
                    msg_id = q["message"]["message_id"]
                    handle_callback(uid, chat_id, data, msg_id)
                    answer_callback(q["id"])
                elif "message" in u:
                    m = u["message"]
                    uid = m["from"]["id"]
                    chat_id = m["chat"]["id"]
                    contact = m.get("contact")
                    text = m.get("text", "")
                    handle_message(uid, chat_id, text, contact)
        except KeyboardInterrupt:
            break
        except Exception as e:  # noqa
            sys.stderr.write(f"[loop] {e}\n")
            time.sleep(3)


if __name__ == "__main__":
    main()
