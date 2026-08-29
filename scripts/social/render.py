#!/usr/bin/env python3
"""
Instagram post şəkli generatoru — 1080x1350 (4:5), JPEG.

stdin-dən JSON oxuyur:
  { "type": "quran|hadith|dua|name", "ar": "...", "az": "...",
    "en": "...", "source": "...", "out": "/yol/fayl.jpg" }
stdout-a JSON yazır:  { "ok": true, "path": "...", "w":1080, "h":1350 }

ƏRƏB MƏTNİ: Pillow ərəb hərflərini nə birləşdirir, nə də sağdan-sola
düzür. Ona görə hər sətir əvvəlcə sözlərə görə bölünür (məntiqi sırada),
sonra arabic_reshaper ilə birləşdirilir və bidi ilə vizual sıraya salınır.
Sıra vacibdir — əvvəl reshape edib sonra bölmək sözləri korlayır.

Asılılıqlar:  pillow  arabic-reshaper  python-bidi
"""

import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

W, H = 1080, 1350
HERE = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(HERE, '..', '..', 'assets', 'fonts')

# og-image.png ilə eyni brend palitrası
DEEP = (6, 59, 36)
MID = (13, 110, 62)
GOLD = (218, 179, 94)
CREAM = (245, 242, 232)
SOFT = (176, 214, 190)

# Növ etiketləri — şəklin yuxarısında
LABELS = {
    'quran':  ('QURAN',          'القرآن'),
    'hadith': ('HƏDİS',          'الحديث'),
    'dua':    ('DUA',            'الدعاء'),
    'name':   ('ƏSMAÜL HÜSNA',   'أسماء الله الحسنى'),
}

LATIN_REG = ['segoeui.ttf', 'arial.ttf', 'DejaVuSans.ttf']
LATIN_BOLD = ['segoeuib.ttf', 'arialbd.ttf', 'DejaVuSans-Bold.ttf']
FONT_DIRS = [
    FONT_DIR,
    r'C:\Windows\Fonts',
    '/usr/share/fonts/truetype/dejavu',
    '/usr/share/fonts/truetype/liberation',
    '/usr/local/share/fonts',
    '/Library/Fonts',
]


def font(names, size):
    """Adlar siyahısından ilk tapılan şrifti yüklə."""
    for n in names:
        for d in FONT_DIRS:
            p = os.path.join(d, n)
            if os.path.exists(p):
                try:
                    return ImageFont.truetype(p, size)
                except OSError:
                    pass
    return ImageFont.load_default()


def arabic_font(size):
    return font(['Amiri-Regular.ttf', 'NotoNaskhArabic-Regular.ttf', 'arial.ttf'], size)


def shape_ar(text):
    """Bir sətir ərəb mətnini birləşdir və vizual (sağdan-sola) sıraya sal."""
    return get_display(arabic_reshaper.reshape(text))


def wrap(draw, text, fnt, max_w, arabic=False):
    """
    Mətni sözlərə görə sətirlərə böl.
    Ərəb üçün ölçmə birləşdirilmiş formada aparılır, çünki birləşmiş
    hərflərin eni ayrı-ayrı hərflərin cəmindən fərqlidir.
    """
    words = text.split()
    lines, cur = [], []
    for w in words:
        trial = cur + [w]
        s = ' '.join(trial)
        measured = shape_ar(s) if arabic else s
        if draw.textlength(measured, font=fnt) <= max_w or not cur:
            cur = trial
        else:
            lines.append(' '.join(cur))
            cur = [w]
    if cur:
        lines.append(' '.join(cur))
    return lines


def fit_block(draw, text, names, max_w, max_h, start, min_size, arabic=False, line_ratio=1.35):
    """
    Mətni verilmiş sahəyə sığdırmaq üçün şrift ölçüsünü tədricən azalt.
    Qaytarır: (font, sətirlər, sətir hündürlüyü, blokun ümumi hündürlüyü)
    """
    size = start
    while size >= min_size:
        fnt = arabic_font(size) if arabic else font(names, size)
        lines = wrap(draw, text, fnt, max_w, arabic)
        lh = int(size * line_ratio)
        total = lh * len(lines)
        if total <= max_h:
            return fnt, lines, lh, total
        size -= 2
    fnt = arabic_font(min_size) if arabic else font(names, min_size)
    lines = wrap(draw, text, fnt, max_w, arabic)
    lh = int(min_size * line_ratio)
    return fnt, lines, lh, lh * len(lines)


def draw_lines(draw, lines, fnt, cx, y, lh, fill, arabic=False):
    """Sətirləri mərkəzə hizalayaraq çək; qaytarır: son y."""
    for ln in lines:
        draw.text((cx, y), shape_ar(ln) if arabic else ln, font=fnt, fill=fill, anchor='ma')
        y += lh
    return y


def background(img):
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        e = t * t * (3 - 2 * t)
        d.line([(0, y), (W, y)], fill=tuple(int(DEEP[i] + (MID[i] - DEEP[i]) * e) for i in range(3)))

    # Zəif həndəsi naxış — og-image ilə eyni motiv
    import math
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    dl = ImageDraw.Draw(layer)
    step = 150
    for row, cy in enumerate(range(-50, H + 100, step)):
        off = (step // 2) if row % 2 else 0
        for cx in range(-50 + off, W + 100, step):
            for rot in (0, math.pi / 4):
                pts = [(cx + 42 * math.cos(rot + i * math.pi / 2),
                        cy + 42 * math.sin(rot + i * math.pi / 2)) for i in range(4)]
                dl.polygon(pts, outline=(255, 255, 255, 14), width=2)
    img.alpha_composite(layer)


def render(item, out_path):
    img = Image.new('RGBA', (W, H), DEEP + (255,))
    background(img)
    d = ImageDraw.Draw(img)

    d.rectangle([0, 0, W, 8], fill=GOLD)
    d.rectangle([0, H - 8, W, H], fill=GOLD)

    M = 84                     # kənar boşluq
    content_w = W - 2 * M
    cx = W // 2

    # ── Başlıq: növ etiketi ──
    lab_lat, lab_ar = LABELS.get(item['type'], ('', ''))
    f_lab = font(LATIN_BOLD, 30)
    d.text((cx, 74), lab_lat, font=f_lab, fill=GOLD, anchor='ma')
    f_lab_ar = arabic_font(34)
    d.text((cx, 122), shape_ar(lab_ar), font=f_lab_ar, fill=SOFT, anchor='ma')
    d.line([(cx - 46, 184), (cx + 46, 184)], fill=GOLD, width=3)

    # ── Sahə bölgüsü ──
    # Ərəb mətni əsas elementdir, ona ən çox yer verilir.
    top = 236
    bottom = H - 148
    avail = bottom - top

    # Başlanğıc ölçü mətnin uzunluğuna görə seçilir: fit_block yalnız
    # kiçildə bilir, ona görə qısa mətn üçün yuxarıdan başlamasaq
    # (məs. iki sözlük bir ad) şəkildə itib gedir.
    ar_len = len(item['ar'])
    ar_start = 150 if ar_len < 30 else 118 if ar_len < 60 else 92 if ar_len < 110 else 76

    ar_fnt, ar_lines, ar_lh, ar_h = fit_block(
        d, item['ar'], None, content_w, int(avail * 0.46),
        start=ar_start, min_size=34, arabic=True, line_ratio=1.62)

    az_start = 60 if len(item['az']) < 40 else 50 if len(item['az']) < 90 else 42
    az_fnt, az_lines, az_lh, az_h = fit_block(
        d, item['az'], LATIN_REG, content_w, int(avail * 0.30),
        start=az_start, min_size=24, line_ratio=1.42)

    en_start = 42 if len(item['en']) < 40 else 36 if len(item['en']) < 90 else 32
    en_fnt, en_lines, en_lh, en_h = fit_block(
        d, item['en'], LATIN_REG, content_w - 40, int(avail * 0.24),
        start=en_start, min_size=19, line_ratio=1.42)

    gap1, gap2 = 52, 40
    block_h = ar_h + gap1 + az_h + gap2 + en_h
    y = top + max(0, (avail - block_h) // 2)

    y = draw_lines(d, ar_lines, ar_fnt, cx, y, ar_lh, CREAM, arabic=True)
    y += gap1
    y = draw_lines(d, az_lines, az_fnt, cx, y, az_lh, CREAM)
    y += gap2

    d.line([(cx - 34, y - 20), (cx + 34, y - 20)], fill=(255, 255, 255, 60), width=2)
    y = draw_lines(d, en_lines, en_fnt, cx, y, en_lh, SOFT)

    # ── Alt sətir: istinad + brend ──
    src = (item.get('source') or '').strip()
    if src:
        d.text((cx, H - 116), src, font=font(LATIN_BOLD, 27), fill=GOLD, anchor='ma')
    d.text((cx, H - 66), 'muslims.cc', font=font(LATIN_REG, 25), fill=SOFT, anchor='ma')

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    # Instagram JPEG tələb edir — PNG və WebP qəbul edilmir
    img.convert('RGB').save(out_path, 'JPEG', quality=92, optimize=True, progressive=True)
    return out_path


def main():
    # stdin-i açıq şəkildə UTF-8 kimi oxu: Windows-da default kodlaşdırma
    # cp1252-dir və ərəb/azərbaycan hərfləri korlanır.
    item = json.loads(sys.stdin.buffer.read().decode('utf-8'))
    out = item.get('out') or os.path.join(HERE, 'out', 'post.jpg')
    try:
        render(item, out)
        emit({'ok': True, 'path': out, 'w': W, 'h': H})
    except Exception as e:
        emit({'ok': False, 'error': str(e)})
        sys.exit(1)


def emit(obj):
    # ensure_ascii ilə çıxış həmişə ASCII-dir — konsol kodlaşdırmasından asılı deyil
    sys.stdout.write(json.dumps(obj, ensure_ascii=True) + chr(10))


if __name__ == '__main__':
    main()
