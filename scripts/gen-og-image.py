#!/usr/bin/env python3
"""
public/og-image*.png generatoru — 1200x630, sosial paylaşım kartları (hər dilə bir).

Bir dəfəlik lokal skriptdir: nəticə public/-ə yazılır və git-ə commit edilir.
Build zəncirinə qoşulmayıb (Windows şriftlərinə bağlıdır, Vercel-də işləməz).

İşə salmaq:  python scripts/gen-og-image.py
"""

import math
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public')

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


# ── Dil başına mətnlər ──
# Hər dil öz kartını alır (og-image.png = az, og-image-<dil>.png = digərləri):
# /en/quran linki paylaşılanda kartda azərbaycanca yazı görünməsin.
# Ad və şüar src/config/brand.js-dəki BRAND.name / BRAND.tagline ilə uyğun
# saxla (Python JS import edə bilmir). Fayl adları src/seo/meta.js-dəki
# ogImageFor() ilə EYNİ olmalıdır.
BRAND = 'Muslims.cc'
TEXTS = {
    'az': {
        'sub': 'İslami platforma',
        'tag': 'Quran, namaz vaxtları, hədis, dua və zikr',
        'chips': ['Quran', 'Namaz vaxtları', 'Hədis', 'Dua', 'Zikr', 'Zəkat', 'Qiblə'],
        'foot': '5 dildə  ·  pulsuz və reklamsız',
    },
    'en': {
        'sub': 'Islamic platform',
        'tag': 'Quran, prayer times, hadith, duas and dhikr',
        'chips': ['Quran', 'Prayer times', 'Hadith', 'Duas', 'Dhikr', 'Zakat', 'Qibla'],
        'foot': '5 languages  ·  free and ad-free',
    },
    'ru': {
        'sub': 'Исламская платформа',
        'tag': 'Коран, время намаза, хадисы, дуа и зикр',
        'chips': ['Коран', 'Время намаза', 'Хадисы', 'Дуа', 'Зикр', 'Закят', 'Кибла'],
        'foot': '5 языков  ·  бесплатно и без рекламы',
    },
    'tr': {
        'sub': 'İslami platform',
        'tag': 'Kur’an, namaz vakitleri, hadis, dua ve zikir',
        'chips': ['Kur’an', 'Namaz vakitleri', 'Hadis', 'Dua', 'Zikir', 'Zekât', 'Kıble'],
        'foot': '5 dilde  ·  ücretsiz ve reklamsız',
    },
    'ar': {
        'sub': 'منصة إسلامية',
        'tag': 'القرآن ومواقيت الصلاة والحديث والأدعية والأذكار',
        'chips': ['القرآن', 'مواقيت الصلاة', 'الحديث', 'الأدعية', 'الأذكار', 'الزكاة', 'القبلة'],
        'foot': '٥ لغات  ·  مجاناً وبلا إعلانات',
    },
}


def shape_ar(text):
    """Ərəb mətni: Pillow-da raqm yoxdursa hərflər birləşmir və sıra tərsinə
    düşür — arabic_reshaper birləşdirir, bidi vizual (sağdan sola) sıraya çevirir."""
    try:
        import arabic_reshaper
        from bidi.algorithm import get_display
    except ImportError:
        raise SystemExit('ar kartı üçün: pip install arabic-reshaper python-bidi')
    return get_display(arabic_reshaper.reshape(text))


def render(lang):
    t = TEXTS[lang]
    rtl = lang == 'ar'
    sh = shape_ar if rtl else (lambda s: s)
    # RTL-də düzən güzgü kimi çevrilir: emblem sağda, mətn sağa düzlənir
    mx = (lambda x: W - x) if rtl else (lambda x: x)
    side = 'r' if rtl else 'l'

    img = Image.new('RGBA', (W, H), DEEP + (255,))
    vertical_gradient(img)
    pattern(img)
    d = ImageDraw.Draw(img)

    # Üstdə və altda incə zolaq — kart çərçivəsi hissi
    d.rectangle([0, 0, W, 7], fill=GOLD)
    d.rectangle([0, H - 7, W, H], fill=ACCENT)

    # ── Emblem ── ulduz ayparanın qövsünün içinə oturur
    # Aypara güzgülənmir (açıq tərəfi həmişə sağdadır), ona görə ulduz RTL-də
    # də ayparanın mərkəzindən +46 px sağda — açıq qövsün içində qalır
    crescent(img, mx(140), 196, 66)
    star5(img, mx(140) + 46, 196, 21, GOLD)

    # ── Wordmark ── (domen adı — tərcümə olunmur, Latın qalır)
    f_brand = load_font(BOLD, 96)
    d.text((mx(262), 172), BRAND, font=f_brand, fill=CREAM, anchor=side + 's')

    # ── Alt başlıq ── wordmark-ın altında, qızılı
    f_sub = load_font(BOLD, 34)
    d.text((mx(266), 226), sh(t['sub']), font=f_sub, fill=GOLD, anchor=side + 's')

    # ── Şüar ──
    f_tag = load_font(REG, 36)
    d.text((mx(72), 316), sh(t['tag']), font=f_tag, fill=(203, 232, 213), anchor=side + 'm')

    # ── Xidmət çipləri ──
    # Çiplər ayrı RGBA qatında çəkilir: ImageDraw şəffaflığı qarışdırmır,
    # birbaşa çəkilsə piksellər tam ağ olur.
    f_chip = load_font(REG, 30)
    chip_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    dc = ImageDraw.Draw(chip_layer)
    placed = []
    x, y = 72, 372  # x — başlanğıc kənardan məsafə (RTL-də sağdan)
    for c in t['chips']:
        c = sh(c)
        w = d.textlength(c, font=f_chip) + 44
        if x + w > W - 72:
            x, y = 72, y + 66
        x0, x1 = (W - x - w, W - x) if rtl else (x, x + w)
        dc.rounded_rectangle([x0, y, x1, y + 54], radius=27,
                             fill=(255, 255, 255, 30), outline=(255, 255, 255, 90), width=2)
        placed.append(((x0 + x1) / 2, y + 27, c))
        x += w + 14
    img.alpha_composite(chip_layer)
    for cx, cy, c in placed:
        d.text((cx, cy), c, font=f_chip, fill=CREAM, anchor='mm')

    # ── Alt sətir ──
    f_foot = load_font(REG, 28)
    d.text((mx(72), H - 62), sh(t['foot']), font=f_foot, fill=(168, 214, 184), anchor=side + 'm')
    d.text((mx(W - 72), H - 62), 'muslims.cc', font=load_font(BOLD, 30), fill=GOLD,
           anchor=('l' if rtl else 'r') + 'm')

    name = 'og-image.png' if lang == 'az' else 'og-image-%s.png' % lang
    out = os.path.normpath(os.path.join(OUT_DIR, name))
    img.convert('RGB').save(out, 'PNG', optimize=True)
    # Yalnız ASCII çap et — Windows konsolu (cp1252) başqa simvolda yıxılır
    print('OK ->', out, img.size)


def main():
    for lang in TEXTS:
        render(lang)


if __name__ == '__main__':
    main()
