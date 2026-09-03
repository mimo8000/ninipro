#!/usr/bin/env python3
# Generate NiniPro launcher icons: yellow rounded-square border + "NiniPro" text
from PIL import Image, ImageDraw, ImageFont
import os
import math

SIZES = [48, 72, 96, 144, 192]  # mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi

BG_INNER = (245, 245, 247)      # inner white-ish
BORDER = (250, 204, 21)         # yellow-400
BORDER_2 = (202, 138, 4)        # amber-600 (darker edge)
TEXT = (30, 30, 35)
RADIUS_RATIO = 0.22             # squircle corner radius
BORDER_W_RATIO = 0.07

FONT_PATHS = [
    "/tmp/Nini.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]

def find_font(size):
    for p in FONT_PATHS:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def round_rect_mask(size, radius):
    w, h = size, size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=255)
    return mask

def make_icon(side):
    img = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(side * RADIUS_RATIO)
    bw = max(2, int(side * BORDER_W_RATIO))

    # outer border (squircle) - yellow
    d.rounded_rectangle([0, 0, side - 1, side - 1], radius=r, fill=BORDER)
    # inner darker edge for depth
    d.rounded_rectangle([bw, bw, side - 1 - bw, side - 1 - bw], radius=max(1, r - bw), outline=BORDER_2, width=max(1, int(side*0.012)))
    # inner white area
    d.rounded_rectangle([bw*2, bw*2, side - 1 - bw*2, side - 1 - bw*2], radius=max(1, r - bw*2), fill=BG_INNER)

    # text "NiniPro"
    fs = int(side * 0.19)
    font = find_font(fs)
    text = "NiniPro"
    bbox = d.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (side - tw) / 2 - bbox[0]
    ty = (side - th) / 2 - bbox[1]
    d.text((tx, ty), text, font=font, fill=TEXT)

    return img

base = "/tmp/ninisrc/android/app/src/main/res"
suffix = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]
for s, suf in zip(SIZES, suffix):
    icon = make_icon(s)
    # regular
    icon.save(f"{base}/mipmap-{suf}/ic_launcher.png")
    # round
    icon.save(f"{base}/mipmap-{suf}/ic_launcher_round.png")
    print(f"wrote {suf} ({s}px)")

# foreground (transparent bg version for adaptive icons) - keep simple, reuse
for s, suf in zip(SIZES, suffix):
    icon = make_icon(s)
    icon.save(f"{base}/mipmap-{suf}/ic_launcher_foreground.png")
print("done")
