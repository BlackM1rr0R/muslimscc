"""BrandMark (src/components/Icon.jsx) -> butun PNG/ICO ikonlari (public/ + mobile/assets/).

Istifade: python scripts/gen-icons.py   (Pillow lazimdir; konsola yalniz ASCII yazir)
Onizleme vereqleri scripts/.icon-preview/ qovluguna dusur (git-e dusmur).
Ikon deyisende index.html ve site.webmanifest-deki ?v= versiyasini artir.
"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, 'public')
MOB = os.path.join(ROOT, 'mobile', 'assets')
PREV = os.path.join(ROOT, 'scripts', '.icon-preview')
os.makedirs(MOB, exist_ok=True)
os.makedirs(PREV, exist_ok=True)

TILE = (0x0f, 0x5a, 0x47, 255)   # --emerald-700
STAR = (0xe6, 0xcc, 0x95, 255)   # --sand-300
DOT = (0xd8, 0xb4, 0x6a, 255)    # --sand-400
IVORY = (0xf7, 0xf5, 0xef, 255)  # --surface-0

SQUARE = [(9.4, 9.4), (22.6, 9.4), (22.6, 22.6), (9.4, 22.6)]
DIAMOND = [(16, 6.7), (25.3, 16), (16, 25.3), (6.7, 16)]


def mark(size, tile='round', scale=1.0, stroke=1.5, dot=2.1,
         star=STAR, dotc=DOT, bg=TILE):
    """tile: 'round' (rx 9/32, transparent corners) | 'full' | 'none'."""
    ss = 8 if size <= 256 else 4
    S = size * ss
    u = S / 32.0
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if tile == 'round':
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=9 * u, fill=bg)
    elif tile == 'full':
        d.rectangle([0, 0, S, S], fill=bg)

    def tp(p):
        return (S / 2 + (p[0] - 16) * u * scale, S / 2 + (p[1] - 16) * u * scale)
    w = max(1, round(stroke * u * scale))
    for poly in (SQUARE, DIAMOND):
        pts = [tp(p) for p in poly]
        d.line(pts + [pts[0], pts[1]], fill=star, width=w, joint='curve')
        r = w / 2
        for x, y in pts:  # round joins at every vertex
            d.ellipse([x - r, y - r, x + r, y + r], fill=star)
    if dot:
        r = dot * u * scale
        d.ellipse([S / 2 - r, S / 2 - r, S / 2 + r, S / 2 + r], fill=dotc)
    return im.resize((size, size), Image.LANCZOS)


def save(im, path, rgb=False):
    if rgb:
        im = im.convert('RGB')
    im.save(path, 'PNG', optimize=True)
    print('OK', os.path.relpath(path, ROOT), im.size, im.mode)


# Web -------------------------------------------------------------------
f16 = mark(16, stroke=2.6, dot=2.9)
f32 = mark(32, stroke=1.9, dot=2.4)
f48 = mark(48, stroke=1.7, dot=2.2)
save(f16, os.path.join(PUB, 'favicon-16x16.png'))
save(f32, os.path.join(PUB, 'favicon-32x32.png'))
save(f48, os.path.join(PUB, 'favicon-48x48.png'))
f48.save(os.path.join(PUB, 'favicon.ico'), format='ICO',
         sizes=[(16, 16), (32, 32), (48, 48)], append_images=[f16, f32])
print('OK public/favicon.ico 16/32/48')

save(mark(180, tile='full', scale=1.04), os.path.join(PUB, 'apple-touch-icon.png'), rgb=True)
save(mark(192), os.path.join(PUB, 'android-chrome-192x192.png'))
save(mark(512), os.path.join(PUB, 'android-chrome-512x512.png'))
# maskable: full bleed, content well inside the 80% safe circle
save(mark(192, tile='full', scale=0.92), os.path.join(PUB, 'maskable-192x192.png'), rgb=True)
save(mark(512, tile='full', scale=0.92), os.path.join(PUB, 'maskable-512x512.png'), rgb=True)
# Windows tile: transparent star on TileColor
save(mark(150, tile='none', scale=0.78), os.path.join(PUB, 'mstile-150x150.png'))
# Notification badge (Android uses alpha only): white mono star
save(mark(96, tile='none', scale=1.25, stroke=2.2, dot=2.6,
          star=(255, 255, 255, 255), dotc=(255, 255, 255, 255)),
     os.path.join(PUB, 'badge-96x96.png'))

# Mobile (Expo) ---------------------------------------------------------
save(mark(1024, tile='full', scale=1.04), os.path.join(MOB, 'icon.png'), rgb=True)
# adaptive foreground: 108dp canvas, ~66dp safe circle -> scale 0.68
save(mark(1024, tile='none', scale=0.68), os.path.join(MOB, 'adaptive-icon.png'))
save(mark(48, stroke=1.7, dot=2.2), os.path.join(MOB, 'favicon.png'))
sp = Image.new('RGBA', (1242, 2436), IVORY)
m = mark(320)
sp.alpha_composite(m, ((1242 - 320) // 2, (2436 - 320) // 2))
save(sp, os.path.join(MOB, 'splash.png'), rgb=True)

# Preview sheet: each icon on light + dark, plus maskable with circle mask
items = ['favicon-16x16.png', 'favicon-32x32.png', 'favicon-48x48.png', 'apple-touch-icon.png',
         'android-chrome-192x192.png', 'maskable-192x192.png', 'mstile-150x150.png', 'badge-96x96.png']
sheet = Image.new('RGBA', (1700, 560), (255, 255, 255, 255))
x = 20
for i, name in enumerate(items):
    im = Image.open(os.path.join(PUB, name)).convert('RGBA')
    for row, bgc in enumerate([(247, 245, 239, 255), (10, 16, 22, 255)]):
        cell = Image.new('RGBA', (200, 240), bgc)
        cell.alpha_composite(im, ((200 - im.width) // 2, (240 - im.height) // 2))
        sheet.alpha_composite(cell, (x, 20 + row * 270))
    x += 210
save(sheet, os.path.join(PREV, 'sheet-small.png'))

mk = Image.open(os.path.join(PUB, 'maskable-512x512.png')).convert('RGBA')
circ = Image.new('L', (512, 512), 0)
ImageDraw.Draw(circ).ellipse([0, 0, 511, 511], fill=255)
masked = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
masked.paste(mk, (0, 0), circ)
safe = mk.copy()
ImageDraw.Draw(safe).ellipse([51, 51, 461, 461], outline=(255, 0, 0, 255), width=2)
big = Image.new('RGBA', (512 * 4 + 60, 552), (200, 200, 200, 255))
for i, im in enumerate([Image.open(os.path.join(PUB, 'android-chrome-512x512.png')).convert('RGBA'), masked, safe,
                        Image.open(os.path.join(MOB, 'adaptive-icon.png')).convert('RGBA').resize((512, 512))]):
    big.alpha_composite(im, (20 + i * 522, 20))
save(big, os.path.join(PREV, 'sheet-large.png'))
