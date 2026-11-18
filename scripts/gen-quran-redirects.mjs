// ═══════════════════════════════════════════════════════
// Qısa surə ünvanı /quran/<n> və /<dil>/quran/<n> → 301 kanonik /quran/<n>-<slug>.
//
// NİYƏ (2026-11-18 auditi): /quran/36 kimi qısa linklər paylaşılır, amma server
// onlara 404 verirdi (SPA yalnız brauzerdə düzəldirdi) — Google üçün ölü link.
// Slug-ları nginx hesablaya bilmir, ona görə bu skript cədvəli YARADIR:
//   • infra/nginx/muslims.cc.conf — "map $quran_n $quran_slug" (http konteksti)
//     + location (server konteksti), işarələr arasında;
//   • public/.htaccess (Apache güzgüsü) — 114 RewriteRule.
// Mənbə: src/seo/surahSlugs.js və src/seo/routes.js (Quranın dilləri).
// tests/unit/seo-perf.test.js fayllardakı blokun bu skriptin çıxışı ilə eyni olduğunu yoxlayır.
//
// İşə sal (slug və ya dil dəyişəndə): node scripts/gen-quran-redirects.mjs
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { SURAH_SLUGS } from '../src/seo/surahSlugs.js'
import { langsFor, DEFAULT_LANG } from '../src/seo/routes.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const NGINX_FILE = path.join(ROOT, 'infra', 'nginx', 'muslims.cc.conf')
export const HTACCESS_FILE = path.join(ROOT, 'public', '.htaccess')

const HEAD = 'scripts/gen-quran-redirects.mjs yaradır — əl ilə redaktə etmə'
export const MARKS = {
  map: ['# BEGIN quran-redirects-map', '# END quran-redirects-map'],
  loc: ['# BEGIN quran-redirects-location', '# END quran-redirects-location'],
  ht: ['# BEGIN quran-redirects', '# END quran-redirects'],
}

/** Quranın prefiksli dilləri (az prefiksizdir; /az/... server səviyyəsində 301 olunur). */
const prefixLangs = () => langsFor('quran').filter(l => l !== DEFAULT_LANG)

export function nginxMap() {
  return [
    MARKS.map[0],
    `# (${HEAD}) /quran/<n> → /quran/<n>-<slug>; location aşağıda, server blokunda`,
    'map $quran_n $quran_slug {',
    '    default "";',
    ...SURAH_SLUGS.map((s, i) => `    ${i + 1} ${i + 1}-${s};`),
    '}',
    MARKS.map[1],
  ].join('\n')
}

export function nginxLocation() {
  return [
    `    ${MARKS.loc[0]}`,
    `    # (${HEAD}) Qısa surə ünvanı → 301 kanonik slug; naməlum nömrə → 404.`,
    '    # {n} olduğu üçün regex dırnaqdadır; adlı tutmalar map-ə ($quran_n) ötürülür.',
    `    location ~ "^/(?<quran_pre>(?:(?:${prefixLangs().join('|')})/)?)quran/(?<quran_n>[1-9][0-9]{0,2})$" {`,
    '        if ($quran_slug = "") { return 404; }',
    '        return 301 /${quran_pre}quran/$quran_slug$is_args$args;',
    '    }',
    `    ${MARKS.loc[1]}`,
  ].join('\n')
}

export function htaccessRules() {
  return [
    `  ${MARKS.ht[0]}`,
    `  # (${HEAD}) /quran/<n>, /<dil>/quran/<n> → 301 /quran/<n>-<slug> (nginx: map $quran_slug)`,
    ...SURAH_SLUGS.map((s, i) => `  RewriteRule ^((?:[a-z]{2}/)?)quran/${i + 1}$ /$1quran/${i + 1}-${s} [R=301,L]`),
    `  ${MARKS.ht[1]}`,
  ].join('\n')
}

/** Mətndə [başla, bitir] işarələri arasındakı bloku (işarələr daxil) əvəz et. */
export function replaceBlock(text, [begin, end], block) {
  const i = text.indexOf(begin)
  const j = text.indexOf(end)
  if (i < 0 || j < i) throw new Error(`işarə tapılmadı: ${begin}`)
  // İşarənin sətir əvvəlindəki boşluqları da blok özü yazır
  const lineStart = text.lastIndexOf('\n', i) + 1
  return text.slice(0, lineStart) + block + text.slice(j + end.length)
}

/** Faylların gözlənilən məzmunu. */
export function expected() {
  const nginx = fs.readFileSync(NGINX_FILE, 'utf8')
  const ht = fs.readFileSync(HTACCESS_FILE, 'utf8')
  return {
    nginx: replaceBlock(replaceBlock(nginx, MARKS.map, nginxMap()), MARKS.loc, nginxLocation()),
    ht: replaceBlock(ht, MARKS.ht, htaccessRules()),
    current: { nginx, ht },
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const e = expected()
  fs.writeFileSync(NGINX_FILE, e.nginx)
  fs.writeFileSync(HTACCESS_FILE, e.ht)
  console.log(`✓ ${SURAH_SLUGS.length} surə: ${path.relative(ROOT, NGINX_FILE)}, ${path.relative(ROOT, HTACCESS_FILE)}`)
}
