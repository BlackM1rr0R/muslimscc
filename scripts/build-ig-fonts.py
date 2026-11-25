#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════
# Instagram kartlarının (server/instagramCard.js) şriftləri — server/fonts/ yaradır
#
#   python scripts/build-ig-fonts.py        (pip install fonttools brotli)
#
# Saytın öz Inter alt dəstlərindən (src/assets/fonts/inter-*-var.woff2: latin, latin-ext, cyrillic, az — "ə")
# statik TTF düzəldir və birləşdirir: libvips/pango (sharp) WOFF2 oxumur, ayrı-ayrı alt dəstlərdə "ə" itirdi.
# Birləşdirmədən ƏVVƏL hər alt dəst yalnız əvvəlkilərdə OLMAYAN simvollara qədər kəsilir (fontTools.subset): alt dəstlər
# üst-üstə düşür (az: Ə ə İ Ş Ç Ğ … latin-ext-də də var) və təkrarlanan qliflərlə hər alt dəstin öz GSUB-u birləşəndə
# qarışırdı — HarfBuzz "A", "Ə" və s. hərfləri başqa alt dəstin KOPYA qlifinə dəyişirdi (görünüş eyni) və kerning itirdi
# (AV, AY, AYƏ — 2026-11-25). Qeyd: Inter-in böyük Ə (U+018F) qlifi böyük hərf hündürlüyündə "ə" formasıdır — bu düzgündür.
# Sonda HarfBuzz yoxlaması (uharfbuzz varsa): hər böyük hərf tək və kontekstdə cmap-dakı qlifinə formalaşır.
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
from fontTools import subset

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src', 'assets', 'fonts')
OUT = os.path.join(ROOT, 'server', 'fonts')
PARTS = ['inter-latin-var', 'inter-latin-ext-var', 'inter-cyrillic-var', 'inter-az-var']


def build(weight, family, filename, tmp):
    files = []
    covered = set()
    for p in PARTS:
        f = TTFont(os.path.join(SRC, p + '.woff2'))
        axes = {'wght': weight}
        if 'opsz' in [a.axisTag for a in f['fvar'].axes]:
            axes['opsz'] = None
        f = instancer.instantiateVariableFont(f, axes)
        f.flavor = None
        # yalnız yeni simvollar (təkrarlanan qlif / GSUB qarışığı olmasın)
        own = set(f.getBestCmap()) - covered
        if not own:
            continue
        opts = subset.Options()
        opts.layout_features = ['*']
        opts.name_IDs = ['*']
        opts.name_languages = ['*']
        opts.notdef_outline = True
        opts.glyph_names = True
        opts.hinting = False
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=sorted(own))
        sub.subset(f)
        covered |= own
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
    out = os.path.join(OUT, filename)
    font.save(out)
    print(filename, len(font.getBestCmap()), 'glyph')
    self_check(out)


# Böyük hərflər (az, tr, ru) — tək və kontekstdə cmap-dakı qlif qalmalıdır (GSUB onları kiçik hərfə çevirməməlidir)
CHECK_TEXTS = ['GÜNÜN AYƏSİ', 'ƏĞİŞÇÖÜ', 'HƏH', 'Sİ', 'ĞİŞÇÖÜ', 'АЯТ ДНЯ ЁЖЮЪ', 'GÜNÜN AYETİ']


def self_check(path):
    try:
        import uharfbuzz as hb
    except ImportError:
        print('  (uharfbuzz yoxdur — HarfBuzz yoxlaması atlandı: pip install uharfbuzz)')
        return
    tt = TTFont(path)
    cmap, order = tt.getBestCmap(), tt.getGlyphOrder()
    font = hb.Font(hb.Face(hb.Blob.from_file_path(path)))
    bad = []
    for text in CHECK_TEXTS + [chr(c) for c in sorted(cmap) if chr(c).isupper()]:
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(font, buf, {})
        got = [order[i.codepoint] for i in buf.glyph_infos]
        want = [cmap.get(ord(ch)) for ch in text]
        if got != want:
            bad.append((text, got, want))
    if bad:
        raise SystemExit(f'{os.path.basename(path)}: HarfBuzz qlifləri cmap ilə uyğun deyil: {bad[:5]}')
    print('  HarfBuzz yoxlaması: OK')


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
