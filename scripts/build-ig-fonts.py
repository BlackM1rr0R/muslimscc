#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════
# Instagram kartlarının (server/instagramCard.js) şriftləri — server/fonts/ yaradır
#
#   python scripts/build-ig-fonts.py        (pip install fonttools brotli)
#
# Saytın öz Inter alt dəstlərindən (src/assets/fonts/inter-*-var.woff2: latin, latin-ext, cyrillic, az — "ə")
# statik TTF düzəldir və birləşdirir: libvips/pango (sharp) WOFF2 oxumur, ayrı-ayrı alt dəstlərdə "ə" itirdi.
#   MccInter-Regular.ttf   — ailə "MccInter"      (wght 400)
#   MccInter-SemiBold.ttf  — ailə "MccInterSemi"  (wght 600) — ayrı ailə adı: pango-da üslub seçimi lazım olmasın
# Amiri (ərəb mətni) — assets/fonts/Amiri-*.ttf, dəyişdirilmədən köçürülür.
# AmiriQuran.ttf + OFL-Amiri.txt bu skriptlə YARADILMIR: Amiri 1.003 rəsmi buraxılışından (github.com/aliftype/amiri/releases)
# olduğu kimi köçürülüb (server/fonts/README.md).
# Lisenziya: hər ikisi SIL Open Font License 1.1 (mətn şriftin "name" cədvəlindədir, ID 13/14; server/fonts/README.md).
# ═══════════════════════════════════════════════════════
import os
import shutil
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import merge

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src', 'assets', 'fonts')
OUT = os.path.join(ROOT, 'server', 'fonts')
PARTS = ['inter-latin-var', 'inter-latin-ext-var', 'inter-cyrillic-var', 'inter-az-var']


def build(weight, family, filename, tmp):
    files = []
    for p in PARTS:
        f = TTFont(os.path.join(SRC, p + '.woff2'))
        axes = {'wght': weight}
        if 'opsz' in [a.axisTag for a in f['fvar'].axes]:
            axes['opsz'] = None
        f = instancer.instantiateVariableFont(f, axes)
        f.flavor = None
        fn = os.path.join(tmp, p + '.ttf')
        f.save(fn)
        files.append(fn)
    font = merge.Merger().merge(files)
    for rec in font['name'].names:
        if rec.nameID in (1, 16):
            rec.string = family
        elif rec.nameID in (2, 17):
            rec.string = 'Regular'
        elif rec.nameID == 4:
            rec.string = family
        elif rec.nameID == 6:
            rec.string = family + '-Regular'
    font['OS/2'].usWeightClass = weight
    font.save(os.path.join(OUT, filename))
    print(filename, len(font.getBestCmap()), 'glyph')


def main():
    os.makedirs(OUT, exist_ok=True)
    tmp = os.path.join(OUT, '_tmp')
    os.makedirs(tmp, exist_ok=True)
    try:
        build(400, 'MccInter', 'MccInter-Regular.ttf', tmp)
        build(600, 'MccInterSemi', 'MccInter-SemiBold.ttf', tmp)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    for f in ('Amiri-Regular.ttf', 'Amiri-Bold.ttf'):
        shutil.copyfile(os.path.join(ROOT, 'assets', 'fonts', f), os.path.join(OUT, f))


if __name__ == '__main__':
    main()
