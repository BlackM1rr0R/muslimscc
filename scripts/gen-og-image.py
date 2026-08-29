#!/usr/bin/env python3
"""
public/og-image.png generatoru — 1200x630, sosial paylaşım kartı.

Bir dəfəlik lokal skriptdir: nəticə public/-ə yazılır və git-ə commit edilir.
Build zəncirinə qoşulmayıb (Windows şriftlərinə bağlıdır, Vercel-də işləməz).

İşə salmaq:  python scripts/gen-og-image.py
"""

import math
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'og-image.png')

# Brend rəngləri — theme-color #16a34a ilə eyni ailə
DEEP = (6, 59, 36)
MID = (13, 110, 62)
ACCENT = (22, 163, 74)
GOLD = (218, 179, 94)
CREAM = (245, 242, 232)


def load_font(names, size):
    """İlk mövcud şrifti yüklə; heç biri yoxdursa default-a düş."""
    for n in names:
        for base in (r'C:\Windows\Fonts', '/usr/share/fonts/truetype/dejavu', '/Library/Fonts'):
            p = os.path.join(base, n)
            if os.path.exists(p):
                try:
                    return ImageFont.truetype(p, size)
                except OSError:
                    pass
    return ImageFont.load_default()


BOLD = ['segoeuib.ttf', 'seguisb.ttf', 'arialbd.ttf', 'DejaVuSans-Bold.ttf']
REG = ['segoeui.ttf', 'arial.ttf', 'DejaVuSans.ttf']


def vertical_gradient(img):
    """Yuxarıdan aşağı diaqonal-vari yaşıl keçid."""
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        # yumşaq easing — ortada daha çox MID qalsın
        e = t * t * (3 - 2 * t)
        c = tuple(int(DEEP[i] + (MID[i] - DEEP[i]) * e) for i in range(3))
        d.line([(0, y), (W, y)], fill=c)


def star8(d, cx, cy, r, fill, width=2):
    """Rub el hizb — 8 guşəli İslami ulduz (iki üst-üstə kvadrat)."""
    for rot in (0, math.pi / 4):
        pts = []
        for i in range(4):
            a = rot + i * math.pi / 2
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
        d.polygon(pts, outline=fill, width=width)


def pattern(img):
    """Arxa fonda çox zəif həndəsi naxış — dolğunluq üçün."""
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    step = 118
    for row, cy in enumerate(range(-40, H + 80, step)):
        offset = (step // 2) if row % 2 else 0
        for cx in range(-40 + offset, W + 80, step):
            star8(d, cx, cy, 34, (255, 255, 255, 16), width=2)
    img.alpha_composite(layer)


def crescent(img, cx, cy, r):
    """Aypara — böyük dairədən sürüşdürülmüş dairəni çıxararaq."""
    s = 4  # supersampling — kənarlar hamar olsun
    size = int(r * 2.6) * s
    m = Image.new('L', (size, size), 0)
    dm = ImageDraw.Draw(m)
    R = r * s
    c = size / 2
    dm.ellipse([c - R, c - R, c + R, c + R], fill=255)
    dm.ellipse([c - R + 0.42 * R, c - R * 0.94, c + R + 0.42 * R, c + R * 0.94], fill=0)
    m = m.resize((size // s, size // s), Image.LANCZOS)

    tile = Image.new('RGBA', m.size, GOLD + (255,))
    img.paste(tile, (int(cx - m.size[0] / 2), int(cy - m.size[1] / 2)), m)


def star5(img, cx, cy, r, color):
    """Ayparanın yanındakı beşguşəli ulduz."""
    s = 4
    size = int(r * 3) * s
    m = Image.new('L', (size, size), 0)
    dm = ImageDraw.Draw(m)
    c = size / 2
    pts = []
    for i in range(10):
        rad = (r * s) if i % 2 == 0 else (r * s * 0.42)
        a = -math.pi / 2 + i * math.pi / 5
        pts.append((c + rad * math.cos(a), c + rad * math.sin(a)))
    dm.polygon(pts, fill=255)
    m = m.resize((size // s, size // s), Image.LANCZOS)
    tile = Image.new('RGBA', m.size, color + (255,))
    img.paste(tile, (int(cx - m.size[0] / 2), int(cy - m.size[1] / 2)), m)


def main():
    img = Image.new('RGBA', (W, H), DEEP + (255,))
    vertical_gradient(img)
    pattern(img)

    d = ImageDraw.Draw(img)

    # Üstdə və altda incə qızılı xətt — kart çərçivəsi hissi
    d.rectangle([0, 0, W, 7], fill=GOLD)
    d.rectangle([0, H - 7, W, H], fill=ACCENT)

    # ── Emblem ── ulduz ayparanın qövsünün içinə oturur
    crescent(img, 140, 196, 66)
    star5(img, 186, 196, 21, GOLD)

    # ── Wordmark ──
    f_brand = load_font(BOLD, 92)
    d.text((262, 148), 'Muslims.cc', font=f_brand, fill=CREAM, anchor='lm')

    # ── Tagline ──
    f_tag = load_font(REG, 40)
    d.text((72, 296), 'İslami Rəqəmsal Platforma', font=f_tag, fill=(203, 232, 213), anchor='lm')

    # ── Xidmət çipləri ──
    # Çiplər ayrı RGBA qatında çəkilir: ImageDraw şəffaflığı qarışdırmır,
    # birbaşa çəkilsə piksellər tam ağ olur.
    chips = ['Quran', 'Namaz Vaxtları', 'Hədis', 'Dua', 'Zikr', 'Zəkat', 'Qiblə']
    f_chip = load_font(REG, 30)
    chip_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    dc = ImageDraw.Draw(chip_layer)
    placed = []
    x, y = 72, 372
    for c in chips:
        w = d.textlength(c, font=f_chip) + 44
        if x + w > W - 72:
            x, y = 72, y + 66
        dc.rounded_rectangle([x, y, x + w, y + 54], radius=27,
                             fill=(255, 255, 255, 30), outline=(255, 255, 255, 90), width=2)
        placed.append((x + w / 2, y + 27, c))
        x += w + 14
    img.alpha_composite(chip_layer)
    for cx, cy, c in placed:
        d.text((cx, cy), c, font=f_chip, fill=CREAM, anchor='mm')

    # ── Alt sətir ──
    f_foot = load_font(REG, 28)
    d.text((72, H - 62), '5 dil  ·  31 xidmət  ·  pulsuz və reklamsız',
           font=f_foot, fill=(168, 214, 184), anchor='lm')
    d.text((W - 72, H - 62), 'muslims.cc', font=load_font(BOLD, 30), fill=GOLD, anchor='rm')

    img.convert('RGB').save(os.path.normpath(OUT), 'PNG', optimize=True)
    print('OK ->', os.path.normpath(OUT), img.size)


if __name__ == '__main__':
    main()
