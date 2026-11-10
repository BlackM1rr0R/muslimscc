#!/usr/bin/env python3
"""
v5.9 — hər surə və Allahın hər adı üçün paylaşma kartı (og:image), 1200x630.
  public/og/quran-<n>.png  (114)     public/og/names-<n>.png  (99)

Dildən asılı deyil: ərəbcə ad (Amiri), latınca oxunuşu, nömrə səkkizguşəli ulduzda.
Məlumat: node scripts/gen-og-pages.mjs → scripts/.og-pages.json (mushafIndex, names99).
Bir dəfəlik lokal skript; nəticə commit olunur (scripts/gen-og-image.py kimi).
Asılılıqlar: pillow arabic-reshaper python-bidi.   İşə salmaq: python scripts/gen-og-pages.py
"""
import json, math, os
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
OUT = os.path.join(ROOT, 'public', 'og')
W, H = 1200, 630
DEEP, MID = (10, 61, 49), (15, 90, 71)
GOLD, SAND, CREAM, DIM = (216, 180, 106), (230, 204, 149), (243, 239, 230), (190, 205, 196)
FONT_DIRS = [os.path.join(ROOT, 'assets', 'fonts'), r'C:\Windows\Fonts', '/usr/share/fonts/truetype/dejavu']

def font(names, size):
    for n in names:
        for d in FONT_DIRS:
            p = os.path.join(d, n)
            if os.path.exists(p):
                return ImageFont.truetype(p, size)
    return ImageFont.load_default()

AR = lambda s: font(['Amiri-Bold.ttf', 'Amiri-Regular.ttf'], s)
BOLD = lambda s: font(['segoeuib.ttf', 'arialbd.ttf', 'DejaVuSans-Bold.ttf'], s)
REG = lambda s: font(['segoeui.ttf', 'arial.ttf', 'DejaVuSans.ttf'], s)
DISPLAY = lambda s: font(['georgiab.ttf', 'DejaVuSerif-Bold.ttf'], s)
shape = lambda t: get_display(arabic_reshaper.reshape(t))

def star(d, cx, cy, r, fill=None, outline=None, width=1, inner=0.72):
    pts = []
    for i in range(16):
        a = math.pi / 8 * i - math.pi / 2
        rr = r if i % 2 == 0 else r * inner
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    d.polygon(pts, fill=fill, outline=outline, width=width)

def background():
    img = Image.new('RGB', (W, H), DEEP)
    px = img.load()
    for y in range(H):
        for x in range(0, W, 2):
            t = min(1, math.hypot(x - W * 0.78, y - H * 0.35) / 900)
            c = tuple(int(MID[i] * (1 - t) + DEEP[i] * t) for i in range(3))
            px[x, y] = c
            if x + 1 < W: px[x + 1, y] = c
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    # sağda səkkizguşəli ulduzlar şəbəkəsi (xatəm) — zəif qızılı
    step = 120
    for gy in range(-1, H // step + 2):
        for gx in range(5, W // step + 2):
            cx, cy = gx * step + (step / 2 if gy % 2 else 0), gy * step
            a = max(0, min(1, (cx - 620) / 380))
            if a <= 0: continue
            star(d, cx, cy, 46, outline=(230, 204, 149, int(70 * a)), width=2)
    img.paste(ov, (0, 0), ov)
    return img

def fit(d, text, fnt_fn, size, max_w, min_size=40):
    while size > min_size:
        f = fnt_fn(size)
        if d.textlength(text, font=f) <= max_w: return f
        size -= 4
    return fnt_fn(min_size)

def card(ar, en, n, label_ar, sub, path):
    img = background()
    d = ImageDraw.Draw(img)
    # yuxarı: brend
    d.text((80, 70), 'Muslims', font=DISPLAY(44), fill=CREAM)
    bw = d.textlength('Muslims', font=DISPLAY(44))
    d.text((80 + bw, 70), '.cc', font=DISPLAY(44), fill=GOLD)
    la = shape(label_ar)
    d.text((W - 80, 78), la, font=AR(38), fill=SAND, anchor='ra')
    # ərəbcə ad — iri, mərkəzə yaxın (sol hissə)
    a = shape(ar)
    fa = fit(d, a, AR, 150, 640, 70)
    d.text((470, 300), a, font=fa, fill=CREAM, anchor='mm')
    # latınca oxunuş
    fe = fit(d, en, BOLD, 56, 640, 30)
    d.text((470, 430), en, font=fe, fill=GOLD, anchor='mm')
    if sub:
        d.text((470, 495), shape(sub), font=AR(38), fill=DIM, anchor='mm')
    # nömrə — sağda böyük səkkizguşəli ulduz
    cx, cy = 960, 345
    star(d, cx, cy, 128, fill=(9, 50, 40), outline=GOLD, width=5)
    star(d, cx, cy, 108, outline=SAND, width=2)
    d.text((cx, cy), str(n), font=DISPLAY(96 if n < 100 else 80), fill=CREAM, anchor='mm')
    # alt xətt
    d.line([(80, H - 70), (W - 80, H - 70)], fill=(216, 180, 106), width=2)
    d.text((80, H - 58), 'muslims.cc', font=REG(26), fill=DIM)
    img = img.quantize(colors=96, method=Image.Quantize.MEDIANCUT)
    img.save(path, optimize=True)

def main():
    data = json.load(open(os.path.join(HERE, '.og-pages.json'), encoding='utf-8'))
    os.makedirs(OUT, exist_ok=True)
    for s in data['quran']:
        card(s['ar'], s['en'], s['n'], 'القرآن الكريم', f"{s['ayahs']} آية", os.path.join(OUT, f"quran-{s['n']}.png"))
    for x in data['names']:
        card(x['ar'], x['en'], x['n'], 'أسماء الله الحسنى', '', os.path.join(OUT, f"names-{x['n']}.png"))
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f'✓ {len(os.listdir(OUT))} kart, {total / 1024 / 1024:.1f} MB')

if __name__ == '__main__':
    main()
