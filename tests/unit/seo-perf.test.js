// ═══════════════════════════════════════════════════════
// SEO/perf qoruyucuları (2026-11-18 auditi, B4):
//   • detail.js böyük məlumatı (hədis, alim, səhabə, dərs, lüğət) statik import etmir
//   • prerender şablonu: şərhlər çıxır, yer tutucular qalır; JSON-LD — bir #website
//   • detal sxemində WebPage.url = canonical (əlavə dil → /en)
//   • nginx: /assets/ ^~, /quran/<n> 301 cədvəli generatorla sinxron, mosque-tv başlıqları
// ═══════════════════════════════════════════════════════
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { stripComments } from '../../scripts/shell-min.mjs'
import { expected as quranRedirects } from '../../scripts/gen-quran-redirects.mjs'
import { siteSchema } from '../../src/seo/siteSchema.js'
import { detailJsonLd } from '../../src/seo/detailData.js'
import { ALL_LANGS } from '../../src/seo/routes.js'
import { META } from '../../src/seo/meta.js'

const read = (f) => fs.readFileSync(f, 'utf8')

describe('detail.js — tənbəl məlumat', () => {
  it('hədis/alim/səhabə/dərs/lüğət məlumatını statik import etmir (hər surə səhifəsinə ~440 KB br idi)', () => {
    const src = read('src/seo/detail.js')
    const imports = [...src.matchAll(/^import\s[^;]*?from\s+'([^']+)'/gm)].map(m => m[1])
    const heavy = imports.filter(p => /data\/(hadiths|hadithGrades|sahaba|scholars|glossary|lessons\/)|utils\/(sourceNames|hadithGrade)/.test(p))
    expect(heavy).toEqual([])
    expect(src).not.toMatch(/import\(/)
  })

  it('Seo.jsx detail.js-i yalnız detailLoaders.js ilə yükləyir (məlumat növə görə)', () => {
    const seo = read('src/seo/Seo.jsx')
    expect(seo).not.toMatch(/import\(['"]\.\/detail\.js['"]\)/)
    expect(seo).toMatch(/loadDetail\(page\)/)
    const loaders = read('src/seo/detailLoaders.js')
    for (const k of ['hadith', 'sahaba', 'scholars', 'learn', 'glossary']) expect(loaders).toMatch(new RegExp(`\\b${k}: \\(\\) =>`))
  })
})

describe('prerender şablonu (index.html × ~45k səhifə)', () => {
  const html = read('index.html')
  const out = stripComments(html)

  it('şərhlər çıxır, SEO:HEAD və PERF:PRELOAD qalır, boş sətir qalmır', () => {
    expect(out).toContain('<!--SEO:HEAD-->')
    expect(out).toContain('<!--PERF:PRELOAD-->')
    expect(out.match(/<!--/g)).toHaveLength(2)
    expect(out).not.toMatch(/\n[ \t]*\n/)
    // inline tema skripti toxunulmaz qalır (CSP hash-i — scripts/check-csp.mjs)
    const script = (s) => /<script>([\s\S]*?)<\/script>/.exec(s)[1]
    expect(script(out)).toBe(script(html))
    expect(html.length - out.length).toBeGreaterThan(3000)
  })

  it('statik JSON-LD, SearchAction, meta keywords və köhnə "5 dildə" yoxdur', () => {
    expect(html).not.toMatch(/application\/ld\+json/)
    expect(html).not.toMatch(/SearchAction/)
    expect(html).not.toMatch(/name="keywords"/)
    expect(html).not.toMatch(/\b5 dildə/)
    expect(META.home.ar.d).not.toMatch(/بخمس لغات/)
  })

  it('sayt sxemi: bir WebSite (#website), 50 dil, SearchAction yox, WebApplication', () => {
    for (const lang of ['az', 'en', 'ar', 'de']) {
      const g = siteSchema(lang)['@graph']
      const sites = g.filter(n => n['@type'] === 'WebSite')
      expect(sites).toHaveLength(1)
      expect(sites[0]['@id']).toBe('https://muslims.cc/#website')
      expect(sites[0].inLanguage).toEqual(ALL_LANGS)
      expect(ALL_LANGS).toHaveLength(50)
      expect(JSON.stringify(g)).not.toMatch(/SearchAction|potentialAction/)
      expect(g.filter(n => n['@type'] === 'WebApplication')).toHaveLength(1)
    }
  })

  it('detal sxemi: WebPage.url = canonical (əlavə dildə əsas-məzmunlu detal → /en)', () => {
    expect(detailJsonLd('prayer', 'de', 'london').url).toBe('https://muslims.cc/en/prayer/london')
    expect(detailJsonLd('hadith', 'de', '1').url).toBe('https://muslims.cc/en/hadith/1')
    // Quran hər dildə öz kanonikidir
    expect(detailJsonLd('quran', 'de', 1).url).toBe('https://muslims.cc/de/quran/1-al-faatiha')
  })
})

describe('nginx (infra/nginx/muslims.cc.conf)', () => {
  const conf = read('infra/nginx/muslims.cc.conf')

  it('/assets/ — ^~ prefiks (şəkil/şrift regex-i 1 illik keşi 30 günə endirməsin)', () => {
    expect(conf).toMatch(/location \^~ \/assets\/ \{\s*expires 1y;/)
    expect(conf).not.toMatch(/location \/assets\/ \{/)
  })

  it('/quran/<n> → 301 cədvəli generatorla sinxrondur (node scripts/gen-quran-redirects.mjs)', () => {
    const e = quranRedirects()
    expect(e.current.nginx).toBe(e.nginx)
    expect(e.current.ht).toBe(e.ht)
    expect(conf).toMatch(/^map \$quran_n \$quran_slug \{$/m)
    expect(conf).toContain('    36 36-yaseen;')
    // {n} olan regex dırnaqda olmalıdır
    expect(conf).toMatch(/location ~ "\^\/\(\?<quran_pre>[^"]+\{0,2\}\)\$" \{/)
  })

  it('mosque-tv: X-Frame-Options yoxdur, COOP və Report-Only CSP (frame-ancestors *) var', () => {
    const block = /location ~ \^\/\(\?:\(\?:en\|ru\|ar\|tr\)\/\)\?mosque-tv\$ \{([\s\S]*?)\n {4}\}/.exec(conf)[1]
    expect(block).not.toMatch(/X-Frame-Options|include /)
    expect(block).toMatch(/Cross-Origin-Opener-Policy "same-origin-allow-popups" always;/)
    const shared = /Content-Security-Policy-Report-Only "([^"]+)"/.exec(read('infra/nginx/security-headers.conf'))[1]
    const own = /Content-Security-Policy-Report-Only "([^"]+)"/.exec(block)[1]
    expect(own).toBe(shared.replace("frame-ancestors 'self'", 'frame-ancestors *'))
  })

  it('SSE axınları: limit_conn (IP başına 8)', () => {
    expect(conf).toMatch(/^limit_conn_zone \$binary_remote_addr zone=sse_per_ip:10m;$/m)
    for (const loc of ['location = /api/khatm/live {', 'location ~ "^/api/read-together/[a-z0-9]{10}/events$" {']) {
      const i = conf.indexOf(loc)
      expect(i, loc).toBeGreaterThan(-1)
      expect(conf.slice(i, conf.indexOf('\n    }', i))).toMatch(/limit_conn\s+sse_per_ip 8;/)
    }
  })
})
